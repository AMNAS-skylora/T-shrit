"use client";

import { ChangeEvent, useState } from "react";
import { AdminDrawer } from "@/components/AdminDrawer";

type ImportResult = {
  created: number;
  updated: number;
  failed: number;
  results?: Array<{
    sku: string;
    action: "created" | "updated" | "failed";
    error?: string;
  }>;
};

const headers = [
  "sku",
  "name",
  "slug",
  "category",
  "price",
  "compare_at_price",
  "status",
  "description",
  "color",
  "color_value",
  "size",
  "stock",
  "main_image_url",
  "color_image_url",
  "offer_enabled",
  "offer_type",
  "offer_value",
  "offer_label",
  "offer_badge",
  "animation_enabled",
  "animation_image",
  "sort_order",
];

const sampleRows = [
  [
    "KLD-001",
    "Essential Tee",
    "essential-tee",
    "T-Shirts",
    "799",
    "999",
    "active",
    "Heavy cotton everyday tee",
    "Black",
    "#000000",
    "S",
    "5",
    "",
    "",
    "true",
    "percentage",
    "10",
    "Launch offer",
    "10% OFF",
    "false",
    "",
    "1",
  ],
  [
    "KLD-001",
    "Essential Tee",
    "essential-tee",
    "T-Shirts",
    "799",
    "999",
    "active",
    "Heavy cotton everyday tee",
    "Black",
    "#000000",
    "M",
    "8",
    "",
    "",
    "true",
    "percentage",
    "10",
    "Launch offer",
    "10% OFF",
    "false",
    "",
    "1",
  ],
  [
    "KLD-001",
    "Essential Tee",
    "essential-tee",
    "T-Shirts",
    "799",
    "999",
    "active",
    "Heavy cotton everyday tee",
    "White",
    "#FFFFFF",
    "S",
    "4",
    "",
    "",
    "true",
    "percentage",
    "10",
    "Launch offer",
    "10% OFF",
    "false",
    "",
    "1",
  ],
];

function csvEscape(value: string) {
  if (/[",\n\r]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function templateCsv() {
  return [
    headers.map(csvEscape).join(","),
    ...sampleRows.map((row) => row.map(csvEscape).join(",")),
  ].join("\r\n");
}

function parseCsv(content: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);

  if (!rows.length) return [];

  const header = rows[0].map((cell) =>
    cell.replace(/^\uFEFF/, "").trim().toLowerCase(),
  );

  return rows.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      if (!key) return;
      record[key] = cells[index]?.trim() ?? "";
    });
    return record;
  });
}

export function AdminProductImport({
  onImported,
}: {
  onImported: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  function reset() {
    setFileName("");
    setRows([]);
    setMessage("");
    setResult(null);
  }

  function close() {
    if (busy) return;
    setOpen(false);
    reset();
  }

  function downloadTemplate() {
    const blob = new Blob(["\uFEFF" + templateCsv()], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "kleidin-product-import-template.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setMessage("");
    setResult(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setRows([]);
      setFileName(file.name);
      setMessage(
        "Open the Excel template and use Save As → CSV UTF-8, then upload that CSV file.",
      );
      return;
    }

    try {
      const content = await file.text();
      const parsed = parseCsv(content);

      if (!parsed.length) {
        throw new Error("The CSV has no product rows.");
      }

      if (!Object.prototype.hasOwnProperty.call(parsed[0], "sku")) {
        throw new Error("The CSV must include an SKU column.");
      }

      setRows(parsed);
      setFileName(file.name);
      setMessage(parsed.length + " rows ready to import.");
    } catch (error) {
      setRows([]);
      setFileName(file.name);
      setMessage(
        error instanceof Error ? error.message : "Could not read CSV file.",
      );
    }
  }

  async function runImport() {
    if (!rows.length) return;
    setBusy(true);
    setMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = (await response.json()) as ImportResult & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Product import failed.");
      }

      setResult(data);
      setMessage(
        "Import complete: " +
          data.created +
          " created, " +
          data.updated +
          " updated, " +
          data.failed +
          " failed.",
      );
      await onImported();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Product import failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-black/10 bg-white px-5 text-xs font-bold sm:w-auto"
      >
        Excel import
      </button>

      <AdminDrawer
        open={open}
        title="Excel bulk product import"
        description="Download the template, edit it in Excel, save as CSV UTF-8, then upload it here. Multiple rows with the same SKU become colour and size variants."
        onClose={close}
        footer={
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={close}
              disabled={busy}
              className="min-h-11 rounded-xl border border-black/10 px-5 text-xs font-bold disabled:opacity-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => void runImport()}
              disabled={busy || !rows.length}
              className="min-h-11 rounded-xl bg-[#001cac] px-5 text-xs font-bold !text-white disabled:opacity-50"
            >
              {busy ? "Importing…" : "Import products"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <p className="text-[10px] font-bold uppercase tracking-[.1em] text-black/40">
              Step 1
            </p>
            <h3 className="mt-2 text-sm font-bold">Download template</h3>
            <p className="mt-1 text-[11px] leading-5 text-black/50">
              One row represents one size inside one colour. Repeat the SKU for
              additional colours and sizes. Excel will open the CSV normally.
            </p>
            <button
              type="button"
              onClick={downloadTemplate}
              className="mt-4 min-h-11 rounded-xl border border-[#001cac]/20 bg-[#001cac]/[.04] px-4 text-xs font-bold text-[#001cac]"
            >
              Download Excel template
            </button>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <p className="text-[10px] font-bold uppercase tracking-[.1em] text-black/40">
              Step 2
            </p>
            <h3 className="mt-2 text-sm font-bold">Upload completed CSV</h3>
            <label className="mt-4 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/20 bg-black/[.015] px-4 text-center">
              <strong className="text-xs">
                {fileName || "Choose CSV file"}
              </strong>
              <span className="mt-1 text-[10px] text-black/45">
                Excel → Save As → CSV UTF-8
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => void readFile(event)}
                className="sr-only"
              />
            </label>

            {rows.length ? (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-black/[.03] p-3">
                  <span className="text-[9px] text-black/40">Rows</span>
                  <strong className="mt-1 block text-lg">{rows.length}</strong>
                </div>
                <div className="rounded-xl bg-black/[.03] p-3">
                  <span className="text-[9px] text-black/40">Products</span>
                  <strong className="mt-1 block text-lg">
                    {new Set(rows.map((row) => row.sku).filter(Boolean)).size}
                  </strong>
                </div>
                <div className="rounded-xl bg-black/[.03] p-3">
                  <span className="text-[9px] text-black/40">Ready</span>
                  <strong className="mt-1 block text-lg">Yes</strong>
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <h3 className="text-sm font-bold">Template rules</h3>
            <div className="mt-3 space-y-2 text-[11px] leading-5 text-black/55">
              <p>
                <strong>SKU:</strong> same SKU rows are merged into one product.
              </p>
              <p>
                <strong>Colour + size:</strong> each row becomes inventory for
                that exact combination.
              </p>
              <p>
                <strong>Images:</strong> use public Cloudinary/image URLs in
                main_image_url and color_image_url. Multiple colour images can
                be separated with |.
              </p>
              <p>
                <strong>Offers:</strong> offer_type supports percentage, fixed,
                or sale-price.
              </p>
            </div>
          </section>

          {message ? (
            <p className="rounded-xl bg-white px-4 py-3 text-xs font-medium text-black/60 ring-1 ring-black/5">
              {message}
            </p>
          ) : null}

          {result?.results?.some((item) => item.action === "failed") ? (
            <section className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <h3 className="text-xs font-bold text-red-700">Failed rows</h3>
              <div className="mt-2 space-y-1">
                {result.results
                  .filter((item) => item.action === "failed")
                  .map((item) => (
                    <p key={item.sku} className="text-[10px] text-red-700">
                      {item.sku}: {item.error || "Import failed"}
                    </p>
                  ))}
              </div>
            </section>
          ) : null}
        </div>
      </AdminDrawer>
    </>
  );
}
