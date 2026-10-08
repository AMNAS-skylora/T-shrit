"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AdminDrawer } from "@/components/AdminDrawer";
import { HomepageAnimationBars } from "@/components/HomepageAnimationBars";
import type {
  AnimationBarConfig,
  AnimationBarDirection,
  AnimationBarItem,
  AnimationBarPlacement,
  AnimationBarTheme,
} from "@/types/animation-bar";

type Draft = {
  name: string;
  items: AnimationBarItem[];
  enabled: boolean;
  autoScroll: boolean;
  allowManualScroll: boolean;
  pauseOnHover: boolean;
  direction: AnimationBarDirection;
  speed: number;
  gap: number;
  separator: string;
  theme: AnimationBarTheme;
  startsAt: string;
  endsAt: string;
  placement: AnimationBarPlacement;
  order: string;
};

function newItem(): AnimationBarItem {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random().toString(16).slice(2),
    text: "",
    href: "",
  };
}

const emptyDraft: Draft = {
  name: "Announcement bar",
  items: [newItem()],
  enabled: true,
  autoScroll: true,
  allowManualScroll: true,
  pauseOnHover: true,
  direction: "left",
  speed: 5,
  gap: 36,
  separator: "•",
  theme: "dark",
  startsAt: "",
  endsAt: "",
  placement: "before-hero",
  order: "0",
};

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-[#001cac] focus:ring-2 focus:ring-[#001cac]/10";
const labelClass =
  "text-[9px] font-bold uppercase tracking-[.1em] text-black/45";

function dateTimeInput(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const local = new Date(
    parsed.getTime() - parsed.getTimezoneOffset() * 60_000,
  );
  return local.toISOString().slice(0, 16);
}

function apiDate(value: string) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

function status(bar: AnimationBarConfig) {
  const now = Date.now();
  const starts = bar.startsAt ? new Date(bar.startsAt).getTime() : null;
  const ends = bar.endsAt ? new Date(bar.endsAt).getTime() : null;

  if (!bar.enabled) return "Hidden";
  if (starts && Number.isFinite(starts) && now < starts) return "Scheduled";
  if (ends && Number.isFinite(ends) && now > ends) return "Ended";
  return "Live";
}

function speedLabel(speed: number) {
  if (speed <= 2) return "Very slow";
  if (speed <= 4) return "Slow";
  if (speed <= 6) return "Normal";
  if (speed <= 8) return "Fast";
  return "Very fast";
}

function themeClass(theme: AnimationBarTheme) {
  if (theme === "light") return "bg-white text-[#111] border border-black/10";
  if (theme === "blue") return "bg-[#001cac] text-white";
  return "bg-[#111] text-white";
}

function Toggle({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center justify-between gap-4 rounded-xl border border-black/10 bg-white px-4 py-3 text-left"
      aria-pressed={checked}
    >
      <span>
        <strong className="block text-xs">{title}</strong>
        {description ? (
          <span className="mt-1 block text-[10px] leading-4 text-black/45">
            {description}
          </span>
        ) : null}
      </span>
      <span
        className={
          "relative h-6 w-11 shrink-0 rounded-full transition " +
          (checked ? "bg-[#001cac]" : "bg-black/15")
        }
      >
        <span
          className={
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow transition " +
            (checked ? "left-6" : "left-1")
          }
        />
      </span>
    </button>
  );
}

export function AdminAnimationBarManager() {
  const [bars, setBars] = useState<AnimationBarConfig[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/animation-bars", {
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not load animation bars.");
    }

    setBars(data.bars || []);
  }

  useEffect(() => {
    void load().catch((error) =>
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load animation bars.",
      ),
    );
  }, []);

  const previewBar = useMemo<AnimationBarConfig>(
    () => ({
      id: "admin-preview",
      name: draft.name || "Animation bar preview",
      items: draft.items.map((item) => ({
        ...item,
        text: item.text || "Your message",
      })),
      enabled: true,
      autoScroll: draft.autoScroll,
      allowManualScroll: draft.allowManualScroll,
      pauseOnHover: draft.pauseOnHover,
      direction: draft.direction,
      speed: draft.speed,
      gap: draft.gap,
      separator: draft.separator,
      theme: draft.theme,
      startsAt: null,
      endsAt: null,
      placement: "before-hero",
      order: 0,
    }),
    [draft],
  );

  function reset() {
    setEditingId(null);
    setDraft({
      ...emptyDraft,
      items: [newItem()],
    });
  }

  function openCreate() {
    reset();
    setMessage("");
    setDrawerOpen(true);
  }

  function edit(bar: AnimationBarConfig) {
    setEditingId(bar.id);
    setDraft({
      name: bar.name,
      items: bar.items.map((item) => ({ ...item })),
      enabled: bar.enabled,
      autoScroll: bar.autoScroll,
      allowManualScroll: bar.allowManualScroll,
      pauseOnHover: bar.pauseOnHover,
      direction: bar.direction,
      speed: bar.speed,
      gap: bar.gap,
      separator: bar.separator,
      theme: bar.theme,
      startsAt: dateTimeInput(bar.startsAt),
      endsAt: dateTimeInput(bar.endsAt),
      placement: bar.placement,
      order: String(bar.order),
    });
    setMessage("");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (saving) return;
    setDrawerOpen(false);
    reset();
  }

  function updateItem(id: string, patch: Partial<AnimationBarItem>) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function addItem() {
    setDraft((current) => ({
      ...current,
      items: [...current.items, newItem()],
    }));
  }

  function removeItem(id: string) {
    setDraft((current) => ({
      ...current,
      items:
        current.items.length > 1
          ? current.items.filter((item) => item.id !== id)
          : current.items,
    }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const cleanedItems = draft.items
        .map((item) => ({
          ...item,
          text: item.text.trim(),
          href: item.href?.trim() || undefined,
        }))
        .filter((item) => item.text);

      if (!cleanedItems.length) {
        throw new Error("Add at least one animation bar message.");
      }

      if (
        draft.startsAt &&
        draft.endsAt &&
        new Date(draft.endsAt).getTime() <= new Date(draft.startsAt).getTime()
      ) {
        throw new Error("End time must be after start time.");
      }

      const payload = {
        ...draft,
        items: cleanedItems,
        startsAt: draft.startsAt ? apiDate(draft.startsAt) : "",
        endsAt: draft.endsAt ? apiDate(draft.endsAt) : "",
        speed: Number(draft.speed),
        gap: Number(draft.gap),
        order: Number(draft.order || 0),
      };

      const response = await fetch(
        editingId
          ? "/api/admin/animation-bars/" + editingId
          : "/api/admin/animation-bars",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save animation bar.");
      }

      setDrawerOpen(false);
      reset();
      setMessage(editingId ? "Animation bar updated." : "Animation bar created.");
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save animation bar.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this animation bar?")) return;

    const response = await fetch("/api/admin/animation-bars/" + id, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not delete animation bar.");
      return;
    }

    setMessage("Animation bar deleted.");
    await load();
  }

  return (
    <section className="mt-10 border-t border-black/10 pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[.16em] text-[#001cac]">
            ANIMATION BAR
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-.04em]">
            Scrolling bar builder
          </h2>
          <p className="mt-2 max-w-xl text-xs leading-5 text-black/45">
            Create timed announcement bars and control scrolling, speed,
            direction and placement from Admin.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="min-h-11 w-full rounded-xl bg-[#001cac] px-5 text-xs font-bold !text-white sm:w-auto"
        >
          + Add animation bar
        </button>
      </div>

      {message ? (
        <p className="mt-4 rounded-xl bg-white px-4 py-3 text-xs font-medium text-black/60 ring-1 ring-black/5">
          {message}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {bars.map((bar) => {
          const barStatus = status(bar);

          return (
            <article
              key={bar.id}
              className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5"
            >
              <div className={"overflow-hidden px-3 py-2 " + themeClass(bar.theme)}>
                <div className="flex min-w-max items-center gap-5">
                  {bar.items.slice(0, 3).map((item, index) => (
                    <div key={item.id} className="flex items-center gap-5">
                      <span className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[.1em]">
                        {item.text}
                      </span>
                      {index < Math.min(2, bar.items.length - 1) ? (
                        <span className="opacity-50">{bar.separator}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[.1em] text-[#001cac]">
                      {bar.placement === "before-hero"
                        ? "Before hero"
                        : "After hero"}{" "}
                      · #{bar.order}
                    </p>
                    <h3 className="mt-1 truncate text-sm font-bold">
                      {bar.name}
                    </h3>
                  </div>

                  <span
                    className={
                      "shrink-0 rounded-full px-2.5 py-1 text-[8px] font-bold uppercase " +
                      (barStatus === "Live"
                        ? "bg-emerald-100 text-emerald-800"
                        : barStatus === "Scheduled"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-black/[.05] text-black/50")
                    }
                  >
                    {barStatus}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-black/[.025] p-2.5">
                    <span className="text-[8px] uppercase text-black/40">
                      Mode
                    </span>
                    <strong className="mt-1 block text-[10px]">
                      {bar.autoScroll ? "Auto" : "Static"}
                    </strong>
                  </div>
                  <div className="rounded-xl bg-black/[.025] p-2.5">
                    <span className="text-[8px] uppercase text-black/40">
                      Speed
                    </span>
                    <strong className="mt-1 block text-[10px]">
                      {bar.speed}/10
                    </strong>
                  </div>
                  <div className="rounded-xl bg-black/[.025] p-2.5">
                    <span className="text-[8px] uppercase text-black/40">
                      Items
                    </span>
                    <strong className="mt-1 block text-[10px]">
                      {bar.items.length}
                    </strong>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => edit(bar)}
                    className="min-h-10 rounded-xl border border-black/10 text-xs font-bold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(bar.id)}
                    className="min-h-10 rounded-xl border border-red-200 text-xs font-bold text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {!bars.length ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-white p-6 md:col-span-2 xl:col-span-3">
            <strong className="text-sm">No animation bars yet.</strong>
            <p className="mt-1 text-[10px] text-black/45">
              Create one to show scrolling announcements on the homepage.
            </p>
          </div>
        ) : null}
      </div>

      <AdminDrawer
        open={drawerOpen}
        title={editingId ? "Edit animation bar" : "Create animation bar"}
        description="Add multiple messages, then choose how and when the bar moves on the storefront."
        onClose={closeDrawer}
        footer={
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={closeDrawer}
              disabled={saving}
              className="min-h-11 rounded-xl border border-black/10 px-5 text-xs font-bold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="animation-bar-form"
              disabled={saving}
              className="min-h-11 rounded-xl bg-[#001cac] px-5 text-xs font-bold !text-white disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : editingId
                  ? "Update bar"
                  : "Create bar"}
            </button>
          </div>
        }
      >
        <form data-admin-form
          id="animation-bar-form"
          onSubmit={save}
          className="space-y-4"
        >
          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className={labelClass}>Internal bar name</span>
                <input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Weekend offers"
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>Placement</span>
                <select
                  value={draft.placement}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      placement: event.target.value as AnimationBarPlacement,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="before-hero">Before hero</option>
                  <option value="after-hero">After hero</option>
                </select>
              </label>

              <label>
                <span className={labelClass}>Order</span>
                <input
                  type="number"
                  value={draft.order}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      order: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>

              <label>
                <span className={labelClass}>Theme</span>
                <select
                  value={draft.theme}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      theme: event.target.value as AnimationBarTheme,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="blue">KLEID blue</option>
                </select>
              </label>

              <label>
                <span className={labelClass}>Separator</span>
                <input
                  value={draft.separator}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      separator: event.target.value.slice(0, 5),
                    }))
                  }
                  placeholder="•"
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={labelClass}>Messages</p>
                <p className="mt-1 text-[10px] text-black/45">
                  Each message can optionally open a page or external link.
                </p>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="min-h-10 rounded-xl border border-black/10 px-3 text-[10px] font-bold"
              >
                + Add item
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {draft.items.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-black/10 bg-[#fafafa] p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-black/40">
                      ITEM {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={draft.items.length === 1}
                      className="text-[9px] font-bold text-red-600 disabled:opacity-30"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <label>
                      <span className={labelClass}>Text</span>
                      <input
                        value={item.text}
                        onChange={(event) =>
                          updateItem(item.id, { text: event.target.value })
                        }
                        placeholder="Free shipping above ₹999"
                        className={inputClass}
                      />
                    </label>
                    <label>
                      <span className={labelClass}>Link (optional)</span>
                      <input
                        value={item.href || ""}
                        onChange={(event) =>
                          updateItem(item.id, { href: event.target.value })
                        }
                        placeholder="/products or https://..."
                        className={inputClass}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2 rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <p className={labelClass}>Scrolling</p>

            <Toggle
              checked={draft.autoScroll}
              onChange={(checked) =>
                setDraft((current) => ({
                  ...current,
                  autoScroll: checked,
                }))
              }
              title="Auto scrolling"
              description="When off, the bar stays static and can optionally be swiped manually."
            />

            {!draft.autoScroll ? (
              <Toggle
                checked={draft.allowManualScroll}
                onChange={(checked) =>
                  setDraft((current) => ({
                    ...current,
                    allowManualScroll: checked,
                  }))
                }
                title="Allow manual swipe / scroll"
                description="Customers can swipe horizontally on mobile or scroll the bar manually."
              />
            ) : (
              <>
                <Toggle
                  checked={draft.pauseOnHover}
                  onChange={(checked) =>
                    setDraft((current) => ({
                      ...current,
                      pauseOnHover: checked,
                    }))
                  }
                  title="Pause on hover"
                  description="Desktop pointer hover pauses the marquee."
                />

                <label className="block rounded-xl border border-black/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      <strong className="block text-xs">Scrolling speed</strong>
                      <span className="mt-1 block text-[10px] text-black/45">
                        {speedLabel(draft.speed)} · adaptive across screen sizes
                      </span>
                    </span>
                    <strong className="text-sm text-[#001cac]">
                      {draft.speed}/10
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={draft.speed}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        speed: Number(event.target.value),
                      }))
                    }
                    className="mt-4 w-full accent-[#001cac]"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        direction: "left",
                      }))
                    }
                    className={
                      "min-h-11 rounded-xl border text-xs font-bold " +
                      (draft.direction === "left"
                        ? "border-[#001cac] bg-[#001cac] !text-white"
                        : "border-black/10")
                    }
                  >
                    ← Move left
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        direction: "right",
                      }))
                    }
                    className={
                      "min-h-11 rounded-xl border text-xs font-bold " +
                      (draft.direction === "right"
                        ? "border-[#001cac] bg-[#001cac] !text-white"
                        : "border-black/10")
                    }
                  >
                    Move right →
                  </button>
                </div>

                <label className="block">
                  <span className={labelClass}>Space between items</span>
                  <input
                    type="range"
                    min="8"
                    max="80"
                    step="4"
                    value={draft.gap}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        gap: Number(event.target.value),
                      }))
                    }
                    className="mt-3 w-full accent-[#001cac]"
                  />
                  <span className="mt-1 block text-[9px] text-black/40">
                    {draft.gap}px
                  </span>
                </label>
              </>
            )}
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <p className={labelClass}>Timing</p>
            <p className="mt-1 text-[10px] leading-5 text-black/45">
              Leave both empty to keep the bar available until it is disabled.
            </p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label>
                <span className={labelClass}>Start time</span>
                <input
                  type="datetime-local"
                  value={draft.startsAt}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      startsAt: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
              <label>
                <span className={labelClass}>End time</span>
                <input
                  type="datetime-local"
                  value={draft.endsAt}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      endsAt: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>
            </div>

            <div className="mt-3">
              <Toggle
                checked={draft.enabled}
                onChange={(checked) =>
                  setDraft((current) => ({
                    ...current,
                    enabled: checked,
                  }))
                }
                title="Bar enabled"
                description="Disabled bars stay saved in Admin but do not appear on the storefront."
              />
            </div>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div>
                <p className={labelClass}>Preview</p>
                <span className="mt-1 block text-[10px] text-black/45">
                  {draft.autoScroll
                    ? speedLabel(draft.speed) +
                      " · " +
                      (draft.direction === "left" ? "Left" : "Right")
                    : draft.allowManualScroll
                      ? "Manual swipe"
                      : "Static"}
                </span>
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl">
              <HomepageAnimationBars
                bars={[previewBar]}
                placement="before-hero"
              />
            </div>
          </section>

          {message ? (
            <p className="rounded-xl bg-white px-4 py-3 text-xs font-medium text-black/60 ring-1 ring-black/5">
              {message}
            </p>
          ) : null}
        </form>
      </AdminDrawer>
    </section>
  );
}
