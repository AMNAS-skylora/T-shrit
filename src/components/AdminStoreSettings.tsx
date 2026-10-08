"use client";

import { useEffect, useState } from "react";
import { AdminDrawer } from "@/components/AdminDrawer";
import type { StoreSettings } from "@/types/commerce";

const sectionControls = [["homeProductHeroEnabled", "Product hero"], ["homeProductSelectorEnabled", "Shirt product selector"], ["homeCustomOffersEnabled", "Custom offer slider"], ["homeFeaturedEnabled", "Featured product animation"], ["homeAboutEnabled", "About section"], ["homeCatalogEnabled", "Product catalog"], ["homeDealersEnabled", "Dealer section"], ["homeSpotlightEnabled", "Spotlight product"], ["homeAnimationBarsEnabled", "Scrolling animation bars"], ["footerEnabled", "Footer (all storefront pages)"]] as const;

function label(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

const controlClass =
  "mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#001cac] focus:ring-2 focus:ring-[#001cac]/10";

export function AdminStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [principlesText, setPrinciplesText] = useState("[]");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function loadSettings() {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Could not load settings.");
    }

    setSettings(data.settings);
    setPrinciplesText(
      JSON.stringify(data.settings.aboutPrinciples || [], null, 2),
    );
  }

  useEffect(() => {
    void loadSettings().catch((error) =>
      setMessage(
        error instanceof Error ? error.message : "Could not load settings.",
      ),
    );
  }, []);

  function update(key: keyof StoreSettings, value: unknown) {
    setSettings((current) => {
      if (!current) return current;
      return { ...current, [key]: value } as StoreSettings;
    });
  }

  async function closeDrawer() {
    if (saving) return;
    setDrawerOpen(false);
    setMessage("");

    try {
      await loadSettings();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not reload settings.",
      );
    }
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMessage("");

    try {
      let principles = settings.aboutPrinciples;

      try {
        const parsed = JSON.parse(principlesText);
        if (!Array.isArray(parsed)) {
          throw new Error();
        }
        principles = parsed;
      } catch {
        throw new Error("About principles JSON is invalid.");
      }

      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...settings,
          aboutPrinciples: principles,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save settings.");
      }

      setSettings(data.settings);
      setPrinciplesText(
        JSON.stringify(data.settings.aboutPrinciples || [], null, 2),
      );
      setDrawerOpen(false);
      setMessage("Store settings saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <p className="text-sm text-black/50">
        Loading settings… {message}
      </p>
    );
  }

  const entries = Object.entries(settings).filter(
    ([key]) =>
      !sectionControls.some(([field]) => field === key) &&
      !(["supportEmail", "whatsappNumber", "phoneNumber", "instagramUrl", "facebookUrl"].includes(key)) &&
      key !== "aboutPrinciples" &&
      key !== "homeShowcaseProductUrls" &&
      !key.startsWith("homeDefaultHero") &&
      !key.startsWith("announcement"),
  ) as Array<[keyof StoreSettings, StoreSettings[keyof StoreSettings]]>;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[.16em] text-[#001cac]">
            STOREFRONT
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">
            Settings
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-black/45">
            Manage store contact details and website settings here.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMessage("");
            setDrawerOpen(true);
          }}
          className="min-h-11 w-full rounded-xl bg-[#001cac] px-5 text-xs font-bold !text-white sm:w-auto"
        >
          Website settings
        </button>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <h2 className="text-lg font-semibold">Store contact details</h2>
        <p className="mt-1 text-xs text-black/50">Click any field to edit, then save your changes.</p>
        <form onSubmit={(event) => { event.preventDefault(); void save(); }}>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold">Email
              <input type="email" autoComplete="email" value={settings.supportEmail} disabled={saving} onChange={(event) => update("supportEmail", event.target.value)} className={controlClass} placeholder="Your store email" />
            </label>
            <label className="text-xs font-semibold">Phone number
              <input type="tel" autoComplete="tel" value={settings.phoneNumber} disabled={saving} onChange={(event) => update("phoneNumber", event.target.value)} className={controlClass} placeholder="Include the country code" />
            </label>
            <label className="text-xs font-semibold">WhatsApp number
              <input type="tel" value={settings.whatsappNumber} disabled={saving} onChange={(event) => update("whatsappNumber", event.target.value)} className={controlClass} placeholder="Include the country code" />
            </label>
            <label className="text-xs font-semibold">Instagram URL
              <input type="url" value={settings.instagramUrl} disabled={saving} onChange={(event) => update("instagramUrl", event.target.value)} className={controlClass} placeholder="https://www.instagram.com/yourname/" />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" disabled={saving} onClick={() => void closeDrawer()} className="min-h-11 rounded-xl border border-black/10 px-4 text-xs font-semibold">Reset changes</button>
            <button type="submit" disabled={saving} className="min-h-11 rounded-xl bg-[#001cac] px-4 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save contact details"}</button>
          </div>
        </form>
      </section>

      {message ? (
        <p className="mt-4 rounded-xl bg-white px-4 py-3 text-xs font-medium text-black/60 ring-1 ring-black/5">
          {message}
        </p>
      ) : null}

      <AdminDrawer
        open={drawerOpen}
        title="Edit storefront settings"
        description="Homepage, About, contact and social content. Changes are applied only after Save."
        onClose={() => void closeDrawer()}
        footer={
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={() => void closeDrawer()}
              disabled={saving}
              className="min-h-11 rounded-xl border border-black/10 px-5 text-xs font-bold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="min-h-11 rounded-xl bg-[#001cac] px-5 text-xs font-bold !text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        }
      >
        <fieldset className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-black/5">
          <legend className="px-2 text-sm font-bold">Section visibility</legend>
          <p className="mb-3 text-xs text-black/50">Turn sections on or off, then Save settings. Hidden sections keep their content.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {sectionControls.map(([key, name]) => (
              <label key={key} className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-black/10 px-3 py-2 text-sm">
                {name}
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={settings[key]} onChange={(event) => update(key, event.target.checked)} />
                  {settings[key] ? "On" : "Off"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-black/5">
          <p className="text-[10px] font-bold uppercase tracking-[.08em] text-black/50">
            Homepage product selector
          </p>
          <p className="mt-1 text-xs leading-5 text-black/45">
            Paste up to four product URLs. Only these linked products will appear in the selector.
          </p>

          <div className="mt-4 grid gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <label key={index} className="block">
                <span className="text-[10px] font-bold uppercase tracking-[.08em] text-black/50">
                  Product URL {index + 1}
                </span>
                <input
                  value={settings.homeShowcaseProductUrls[index] ?? ""}
                  onChange={(event) => {
                    const next = Array.from(
                      { length: 4 },
                      (_, currentIndex) =>
                        settings.homeShowcaseProductUrls[currentIndex] ?? "",
                    );
                    next[index] = event.target.value;

                    update(
                      "homeShowcaseProductUrls",
                      next.map((item) => item.trim()).filter(Boolean),
                    );
                  }}
                  placeholder="/products/product-slug"
                  className={controlClass}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.08em] text-black/50">
                Announcement bar
              </p>
              <p className="mt-1 text-xs text-black/45">
                Static offer bar. No scrolling or animation.
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={settings.announcementEnabled}
                onChange={(event) =>
                  update("announcementEnabled", event.target.checked)
                }
              />
              Enabled
            </label>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-[.08em] text-black/50">
                Offer text
              </span>
              <input
                value={settings.announcementText}
                onChange={(event) =>
                  update("announcementText", event.target.value)
                }
                className={controlClass}
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-[.08em] text-black/50">
                Button label
              </span>
              <input
                value={settings.announcementButtonLabel}
                onChange={(event) =>
                  update("announcementButtonLabel", event.target.value)
                }
                className={controlClass}
                placeholder="SHOP NOW"
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-[.08em] text-black/50">
                Button link
              </span>
              <input
                value={settings.announcementButtonHref}
                onChange={(event) =>
                  update("announcementButtonHref", event.target.value)
                }
                className={controlClass}
                placeholder="/products"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => {
              update("announcementButtonLabel", "");
              update("announcementButtonHref", "");
            }}
            disabled={
              !settings.announcementButtonLabel &&
              !settings.announcementButtonHref
            }
            className="mt-4 min-h-10 rounded-xl border border-red-200 px-4 text-xs font-bold text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Remove announcement button
          </button>
        </div>

        <div className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5 md:grid-cols-2">
          {entries.map(([key, value]) => {
            if (Array.isArray(value)) {
              return (
                <label key={String(key)} className="block md:col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-[.08em] text-black/50">
                    {label(String(key))}
                  </span>
                  <input
                    value={value.join(", ")}
                    onChange={(event) =>
                      update(
                        key,
                        event.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      )
                    }
                    className={controlClass}
                  />
                </label>
              );
            }

            const stringValue = String(value ?? "");
            const long =
              stringValue.length > 70 ||
              /body|lead|title|tagline/i.test(String(key));

            return (
              <label
                key={String(key)}
                className={long ? "block md:col-span-2" : "block"}
              >
                <span className="text-[10px] font-bold uppercase tracking-[.08em] text-black/50">
                  {label(String(key))}
                </span>
                {long ? (
                  <textarea
                    value={stringValue}
                    onChange={(event) => update(key, event.target.value)}
                    className={controlClass + " min-h-24 resize-y"}
                  />
                ) : (
                  <input
                    value={stringValue}
                    onChange={(event) => update(key, event.target.value)}
                    className={controlClass}
                  />
                )}
              </label>
            );
          })}

          <label className="block md:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-[.08em] text-black/50">
              About principles (JSON)
            </span>
            <textarea
              value={principlesText}
              onChange={(event) => setPrinciplesText(event.target.value)}
              className={controlClass + " min-h-52 resize-y font-mono text-xs"}
            />
          </label>

          {message ? (
            <p className="md:col-span-2 rounded-xl bg-black/[.025] px-3 py-2 text-xs font-medium text-black/55">
              {message}
            </p>
          ) : null}
        </div>
      </AdminDrawer>
    </div>
  );
}
