"use client";

import { ChangeEvent, useState } from "react";
import { AdminDrawer } from "@/components/AdminDrawer";
import { readProductExcel } from "@/lib/client-product-excel";

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
  "gallery_image_urls",
  "offer_enabled",
  "offer_type",
  "offer_value",
  "offer_label",
  "offer_badge",
  "animation_enabled",
  "animation_image",
  "sort_order",
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
  const [confirmed, setConfirmed] = useState(false);

  function reset() {
    setFileName("");
    setRows([]);
    setMessage("");
    setResult(null);
    setConfirmed(false);
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
    setConfirmed(false);

    if (!/\.(csv|xlsx)$/i.test(file.name)) {
      setRows([]);
      setFileName(file.name);
      setMessage("Choose a supported .xlsx or .csv product file.");
      return;
    }

    try {
      if (file.size > 4 * 1024 * 1024) throw new Error("Maximum file size is 4 MB.");
      const parsed = file.name.toLowerCase().endsWith(".xlsx")
        ? await readProductExcel(file)
        : parseCsv(await file.text());

      if (!parsed.length) {
        throw new Error("The file has no product rows.");
      }

      if (!Object.prototype.hasOwnProperty.call(parsed[0], "sku")) {
        throw new Error("An SKU column is required.");
      }

      if (parsed.length > 1000) throw new Error("Import up to 1,000 rows at a time.");
      if (parsed.some((row) => !row.sku?.trim())) throw new Error("Every row must have an SKU.");
      setRows(parsed);
      setFileName(file.name);
      setMessage(parsed.length + " rows loaded. Review the preview and confirm before importing.");
    } catch (error) {
      setRows([]);
      setFileName(file.name);
      setMessage(
        error instanceof Error ? error.message : "Could not read CSV file.",
      );
    }
  }

  async function runImport() {
    if (!rows.length || !confirmed) return;
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
        description="Upload Excel (.xlsx) or CSV directly. Review the data before import. Matching SKUs update existing MongoDB products."
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
              disabled={busy || !rows.length || !confirmed}
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
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#001cac]/20 bg-[#001cac]/[.04] px-4 text-xs font-bold text-[#001cac]"
              >
                Download empty CSV template
              </button>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <p className="text-[10px] font-bold uppercase tracking-[.1em] text-black/40">
              Step 2
            </p>
            <h3 className="mt-2 text-sm font-bold">Upload Excel or CSV</h3>
            <label className="mt-4 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/20 bg-black/[.015] px-4 text-center">
              <strong className="text-xs">
                {fileName || "Choose .xlsx or .csv file"}
              </strong>
              <span className="mt-1 text-[10px] text-black/45">
                Supports Excel (.xlsx) and CSV · Max 4 MB / 1,000 rows
              </span>
              <input
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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

            {rows.length ? (
              <section className="mt-4 space-y-3" aria-label="Import preview">
                <h4 className="text-xs font-bold">Review imported products</h4>
                <div className="overflow-x-auto rounded-xl border border-black/10">
                  <table className="w-full min-w-[510px] text-left text-xs">
                    <thead className="bg-[#f5f5f5] text-black/60"><tr>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Stock</th>
                    </tr></thead>
                    <tbody>{rows.slice(0, 8).map((row, index) => (
                      <tr key={row.sku + index} className="border-t border-black/5">
                        <td className="px-3 py-2 font-semibold">{row.sku}</td>
                        <td className="px-3 py-2">{row.name || "Unnamed"}</td>
                        <td className="px-3 py-2">{row.price || "—"}</td>
                        <td className="px-3 py-2">{row.status || "active"}</td>
                        <td className="px-3 py-2">{row.stock || "0"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                {rows.length > 8 ? <p className="text-[11px] text-black/50">Showing the first 8 of {rows.length} rows.</p> : null}
                {rows.every((row) => row.status?.toLowerCase() === "draft") ?
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                    All imported products are drafts. They will not appear on the live store until published.
                  </p> : null}
                {rows.every((row) => Number(row.stock || 0) === 0) ?
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                    The file has no available stock; update real inventory before selling.
                  </p> : null}
                {rows.every((row) => !row.main_image_url && !row.color_image_url && !row.gallery_image_urls) ?
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                    No product photos are included. Upload genuine photos in the product editor after import.
                  </p> : null}
                <label className="flex items-start gap-3 rounded-xl border border-black/10 bg-white px-3 py-3 text-xs leading-5">
                  <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" />
                  <span>I reviewed this file and authorize creating products and updating existing MongoDB products with matching SKUs.</span>
                </label>
              </section>
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
                main_image_url, color_image_url and gallery_image_urls (up to 3
                separated with |). Upload actual photos via Admin → Product Images.
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
