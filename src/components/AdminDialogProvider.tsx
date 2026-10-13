"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type BaseOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
};
type ConfirmOptions = BaseOptions & {
  cancelLabel?: string;
  destructive?: boolean;
};
type PromptOptions = BaseOptions & {
  cancelLabel?: string;
  initialValue?: string;
  placeholder?: string;
  required?: boolean;
};
type Request =
  | ({ kind: "confirm" } & ConfirmOptions)
  | ({ kind: "notice" } & BaseOptions)
  | ({ kind: "prompt" } & PromptOptions);
type Result = boolean | string | null;
type DialogApi = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  notice: (options: BaseOptions) => Promise<void>;
  prompt: (options: PromptOptions) => Promise<string | null>;
};

const DialogContext = createContext<DialogApi | null>(null);
const focusableSelector =
  'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]';

export function useAdminDialog(): DialogApi {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useAdminDialog requires AdminDialogProvider");
  return context;
}

// One shared accessible popup system for admin confirmations, notices and prompts.
// No browser-native alert/confirm/prompt calls, so all dialogs use the store UI.
export function AdminDialogProvider({ children }: { children: ReactNode }) {
  const titleId = useId();
  const descriptionId = useId();
  const [request, setRequest] = useState<Request | null>(null);
  const [inputValue, setInputValue] = useState("");
  const resolver = useRef<((value: Result) => void) | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const open = useCallback((next: Request, finish: (value: Result) => void) => {
    // Avoid stacking modal dialogs; reject a second request rather than
    // overwriting the first promise and leaving it unresolved.
    if (resolver.current) {
      finish(next.kind === "prompt" ? null : false);
      return;
    }
    previousFocus.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    resolver.current = finish;
    setInputValue(next.kind === "prompt" ? next.initialValue || "" : "");
    setRequest(next);
  }, []);

  const close = useCallback((result: Result) => {
    if (!resolver.current) return;
    const finish = resolver.current;
    resolver.current = null;
    setRequest(null);
    finish(result);
    window.requestAnimationFrame(() => {
      if (previousFocus.current?.isConnected) previousFocus.current.focus();
    });
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => {
      open({ kind: "confirm", ...options }, (result) => resolve(result === true));
    }),
    [open],
  );
  const notice = useCallback(
    (options: BaseOptions) => new Promise<void>((resolve) => {
      open({ kind: "notice", ...options }, () => resolve());
    }),
    [open],
  );
  const prompt = useCallback(
    (options: PromptOptions) => new Promise<string | null>((resolve) => {
      open({ kind: "prompt", ...options }, (result) =>
        resolve(typeof result === "string" ? result : null),
      );
    }),
    [open],
  );

  useEffect(() => {
    if (!request) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      (request.kind === "prompt" ? inputRef.current : cancelRef.current)?.focus();
    });

    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close(request.kind === "prompt" ? null : false);
        return;
      }
      if (event.key !== "Tab") return;
      // Stop underlying drawers from hijacking focus while a dialog is open.
      event.stopPropagation();
      const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) || [])
        .filter((element) => element.getClientRects().length > 0);
      if (!controls.length) {
        event.preventDefault();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panelRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeys, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = before;
      document.removeEventListener("keydown", handleKeys, true);
    };
  }, [request, close]);

  useEffect(() => () => {
    // Settle an outstanding promise if admin navigation unmounts the provider.
    const finish = resolver.current;
    resolver.current = null;
    finish?.(false);
  }, []);

  const api = useMemo(() => ({ confirm, notice, prompt }), [confirm, notice, prompt]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request) return;
    if (request.kind === "prompt") {
      const value = inputValue.trim();
      if (request.required && !value) return;
      close(value);
    } else {
      close(true);
    }
  }

  return (
    <DialogContext.Provider value={api}>
      {children}
      {request ? createPortal(
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center overflow-y-auto bg-[#0c1020]/55 p-4 backdrop-blur-[3px] sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              close(request.kind === "prompt" ? null : false);
            }
          }}
        >
          <div
            ref={panelRef}
            data-admin-popup
            role={request.kind === "confirm" && request.destructive ? "alertdialog" : "dialog"}
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="w-full max-w-[440px] overflow-hidden rounded-[22px] border border-black/10 bg-white text-[#171717] shadow-[0_24px_100px_rgba(5,10,30,.24)]"
          >
            <form onSubmit={submit}>
              <div className="px-5 pb-5 pt-5 sm:px-7 sm:pb-6 sm:pt-7">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={
                        "grid h-11 w-11 shrink-0 place-items-center rounded-2xl " +
                        (request.kind === "confirm" && request.destructive
                          ? "bg-red-50 text-red-600"
                          : "bg-[#001cac]/[.07] text-[#001cac]")
                      }
                    >
                      {request.kind === "confirm" && request.destructive ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[21px] w-[21px]">
                          <path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-[21px] w-[21px]">
                          <circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-9v1" strokeLinecap="round" />
                        </svg>
                      )}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#001cac]">KLEID.IN ADMIN</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => close(request.kind === "prompt" ? null : false)}
                    aria-label="Close dialog"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/10 text-xl text-black/55 transition hover:bg-black/[.04]"
                  >×</button>
                </div>

                <h2 id={titleId} className="m-0 text-[22px] font-bold leading-[1.25] tracking-[-.035em] sm:text-[25px]">
                  {request.title}
                </h2>
                <p id={descriptionId} className="mt-3 whitespace-pre-wrap break-words text-[13px] leading-6 text-black/55">
                  {request.description}
                </p>

                {request.kind === "prompt" ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder={request.placeholder}
                    required={request.required}
                    className="mt-5 min-h-12 w-full rounded-xl border border-black/15 bg-[#fafafa] px-4 text-sm outline-none focus:border-[#001cac] focus:ring-2 focus:ring-[#001cac]/15"
                  />
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-black/[.06] bg-[#fafbfc] px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                {request.kind !== "notice" ? (
                  <button
                    ref={cancelRef}
                    type="button"
                    onClick={() => close(request.kind === "prompt" ? null : false)}
                    className="min-h-11 w-full rounded-xl border border-black/10 bg-white px-5 text-[12px] font-bold text-black/70 transition hover:bg-[#f2f3f5] sm:w-auto"
                  >
                    {request.cancelLabel || "Cancel"}
                  </button>
                ) : (
                  <button ref={cancelRef} type="button" onClick={() => close(true)} className="hidden" tabIndex={-1}>Close</button>
                )}
                <button
                  type="submit"
                  className={
                    "min-h-11 w-full rounded-xl px-6 text-[12px] font-bold text-white transition hover:brightness-95 sm:w-auto " +
                    (request.kind === "confirm" && request.destructive ? "bg-[#cf3037]" : "bg-[#001cac]")
                  }
                >
                  {request.confirmLabel || (request.kind === "confirm" && request.destructive ? "Delete" : "OK")}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      ) : null}
    </DialogContext.Provider>
  );
}
