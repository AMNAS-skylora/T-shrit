/**
 * Read the first "Products" worksheet from a standard .xlsx workbook.
 * No external script/CDN or third-party runtime parser is needed.
 * Excel files are ZIP containers of Office Open XML documents.
 */
const MAX_XLSX_BYTES = 4 * 1024 * 1024;
const MAX_XML_BYTES = 12 * 1024 * 1024;
const MAX_ROWS = 1000;
const decoder = new TextDecoder("utf-8");

type ZipEntry = {
  method: number;
  compressedSize: number;
  decompressedSize: number;
  dataOffset: number;
};

function parseZip(buffer: ArrayBuffer): Map<string, ZipEntry> {
  const data = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  // EOCD may be followed by a 64 KiB comment.
  let eocd = -1;
  for (let index = data.byteLength - 22; index >= Math.max(0, data.byteLength - 65557); index--) {
    if (data.getUint32(index, true) === 0x06054b50) {
      eocd = index;
      break;
    }
  }
  if (eocd < 0) throw new Error("Invalid Excel workbook.");
  const entries = data.getUint16(eocd + 10, true);
  const directoryOffset = data.getUint32(eocd + 16, true);
  if (entries > 400 || directoryOffset >= buffer.byteLength) {
    throw new Error("Workbook contains too many files.");
  }

  const files = new Map<string, ZipEntry>();
  let offset = directoryOffset;
  for (let index = 0; index < entries; index++) {
    if (offset + 46 > buffer.byteLength || data.getUint32(offset, true) !== 0x02014b50) {
      throw new Error("Invalid Excel ZIP directory.");
    }
    const method = data.getUint16(offset + 10, true);
    const compressedSize = data.getUint32(offset + 20, true);
    const decompressedSize = data.getUint32(offset + 24, true);
    const nameLength = data.getUint16(offset + 28, true);
    const extraLength = data.getUint16(offset + 30, true);
    const commentLength = data.getUint16(offset + 32, true);
    const localOffset = data.getUint32(offset + 42, true);
    const end = offset + 46 + nameLength + extraLength + commentLength;
    if (end > buffer.byteLength || localOffset + 30 > buffer.byteLength || data.getUint32(localOffset, true) !== 0x04034b50) {
      throw new Error("Invalid Excel ZIP file entry.");
    }
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    const localNameLength = data.getUint16(localOffset + 26, true);
    const localExtraLength = data.getUint16(localOffset + 28, true);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    if (dataOffset + compressedSize > buffer.byteLength) throw new Error("Invalid ZIP compressed data.");
    if (files.has(name)) throw new Error("Duplicate Excel archive entry.");
    files.set(name, { method, compressedSize, decompressedSize, dataOffset });
    offset = end;
  }
  return files;
}

async function unpackXml(buffer: ArrayBuffer, files: Map<string, ZipEntry>, path: string, optional = false): Promise<string> {
  const entry = files.get(path);
  if (!entry) {
    if (optional) return "";
    throw new Error("Excel workbook is missing " + path + ".");
  }
  if (entry.decompressedSize > MAX_XML_BYTES) throw new Error("Excel worksheet is too large.");
  const compressed = new Uint8Array(buffer.slice(entry.dataOffset, entry.dataOffset + entry.compressedSize));
  if (entry.method === 0) return decoder.decode(compressed);
  if (entry.method !== 8 || typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot open compressed Excel files. Use Chrome/Edge or upload CSV.");
  }

  const reader = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_XML_BYTES) {
        await reader.cancel();
        throw new Error("Excel worksheet is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(length);
  let at = 0;
  for (const chunk of chunks) {
    result.set(chunk, at);
    at += chunk.length;
  }
  return decoder.decode(result);
}

function xmlDocument(xml: string, filename: string): Document {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) {
    throw new Error("Invalid Excel XML: " + filename);
  }
  return doc;
}

function xmlTags(node: Document | Element, tag: string): Element[] {
  return Array.from(node.getElementsByTagNameNS("*", tag));
}

function cellText(cell: Element, sharedStrings: string[]): string {
  const type = cell.getAttribute("t");
  if (type === "inlineStr") {
    return xmlTags(cell, "is").flatMap((node) => xmlTags(node, "t")).map((node) => node.textContent ?? "").join("");
  }
  const raw = xmlTags(cell, "v")[0]?.textContent ?? "";
  if (type === "s") {
    const index = Number(raw);
    return Number.isSafeInteger(index) ? sharedStrings[index] ?? "" : "";
  }
  if (type === "b") return raw === "1" ? "true" : "false";
  if (type === "e") return "";
  return raw;
}

function columnIndex(reference: string): number {
  const letters = /^[A-Z]+/i.exec(reference)?.[0].toUpperCase() ?? "";
  let index = 0;
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64);
  return index - 1;
}

function normalizedKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

export async function readProductExcel(file: File): Promise<Record<string, string>[]> {
  if (file.size > MAX_XLSX_BYTES) throw new Error("Excel files must be 4 MB or smaller.");
  const buffer = await file.arrayBuffer();
  const files = parseZip(buffer);

  const [workbookXml, relationshipXml, sharedXml] = await Promise.all([
    unpackXml(buffer, files, "xl/workbook.xml"),
    unpackXml(buffer, files, "xl/_rels/workbook.xml.rels"),
    unpackXml(buffer, files, "xl/sharedStrings.xml", true),
  ]);
  const workbook = xmlDocument(workbookXml, "workbook.xml");
  const relationship = xmlDocument(relationshipXml, "workbook.xml.rels");
  const sheets = xmlTags(workbook, "sheet");
  if (!sheets.length) throw new Error("Excel workbook contains no worksheets.");
  const selected = sheets.find((sheet) => sheet.getAttribute("name")?.toLowerCase() === "products") ?? sheets[0];
  const rid = selected.getAttribute("r:id") ?? selected.getAttributeNS(
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id",
  );
  const rel = xmlTags(relationship, "Relationship").find((node) => node.getAttribute("Id") === rid);
  const target = rel?.getAttribute("Target") ?? "";
  if (!target || rel?.getAttribute("TargetMode") === "External") {
    throw new Error("Could not locate the Excel product worksheet.");
  }
  const path = target.startsWith("/") ? target.slice(1) : "xl/" + target.replace(/^\.\//, "");
  const parts = path.split("/");
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "..") resolved.pop();
    else if (part !== ".") resolved.push(part);
  }
  const sheetPath = resolved.join("/");
  if (!sheetPath.startsWith("xl/worksheets/")) throw new Error("Invalid Excel worksheet path.");

  const sharedStrings = sharedXml
    ? xmlTags(xmlDocument(sharedXml, "sharedStrings.xml"), "si").map((si) =>
        xmlTags(si, "t").map((t) => t.textContent ?? "").join(""))
    : [];
  const doc = xmlDocument(await unpackXml(buffer, files, sheetPath), sheetPath);
  const sheetData = xmlTags(doc, "sheetData")[0];
  if (!sheetData) throw new Error("Excel worksheet contains no product data.");
  const cellsByRow: string[][] = [];
  for (const row of xmlTags(sheetData, "row")) {
    const cells: string[] = [];
    let nextIndex = 0;
    for (const cell of xmlTags(row, "c")) {
      const ref = cell.getAttribute("r");
      const index = ref ? columnIndex(ref) : nextIndex;
      if (index < 0 || index >= 100) throw new Error("Excel sheet has too many columns.");
      cells[index] = cellText(cell, sharedStrings);
      nextIndex = index + 1;
    }
    if (cells.some((value) => String(value ?? "").trim())) cellsByRow.push(cells);
    if (cellsByRow.length > MAX_ROWS + 1) throw new Error("Import up to 1,000 rows at a time.");
  }
  if (cellsByRow.length < 2) throw new Error("Excel file has no product records.");
  const headers = cellsByRow[0].map((value) => normalizedKey(value ?? ""));
  if (!headers.includes("sku")) throw new Error("Excel file needs an SKU column.");

  return cellsByRow.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      if (headers[i]) record[headers[i]] = String(cells[i] ?? "").trim();
    }
    return record;
  });
}
