"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.2 0 9 4.3 10 8a11.8 11.8 0 0 1-3 4.8" />
      <path d="M6.2 6.2A12 12 0 0 0 2 12c1 3.7 4.8 8 10 8 1.5 0 2.9-.4 4.1-1" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.8-8 10-8 10 8 10 8-3.8 8-10 8S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed.");
      }

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form data-admin-ui data-admin-form
      onSubmit={submit}
      className="w-full max-w-[440px] rounded-[24px] border border-[#e6e9f0] bg-white px-5 py-7 shadow-[0_18px_60px_rgba(16,24,40,0.08)] sm:px-8 sm:py-9"
    >
      <p className="inline-flex rounded-full bg-[#eef2ff] px-3 py-1.5 text-[11px] font-bold tracking-[.13em] text-[#001cac]">
        ADMIN
      </p>

      <h1 className="mt-5 text-[30px] font-bold leading-tight tracking-[-.045em] text-[#151923]">Sign in</h1>

      <p className="mt-2 max-w-[34ch] text-[14px] leading-6 text-[#667085]">
        Manage products, stock, orders and storefront content.
      </p>

      <label className="mt-7 block">
        <span className="text-[11px] font-semibold text-black/55">Email</span>
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-[52px] w-full rounded-[14px] border border-[#d8deea] bg-white px-4 text-[16px] text-[#151923] outline-none transition-colors focus:border-[#001cac] focus:ring-[3px] focus:ring-[#001cac]/10"
          required
        />
      </label>

      <label className="mt-4 block">
        <span className="text-[11px] font-semibold text-black/55">Password</span>

        <div className="relative mt-2">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-[52px] w-full rounded-[14px] border border-[#d8deea] bg-white px-4 pr-14 text-[16px] text-[#151923] outline-none transition-colors focus:border-[#001cac] focus:ring-[3px] focus:ring-[#001cac]/10"
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-[#667085] transition-colors hover:bg-[#eef2ff] hover:text-[#001cac] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#001cac]/30"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            <EyeIcon hidden={showPassword} />
          </button>
        </div>
      </label>

      {message ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          {message}
        </p>
      ) : null}

      <button
        disabled={loading}
        className="mt-7 flex min-h-[52px] w-full items-center justify-center rounded-[14px] bg-[#001cac] px-4 py-3 text-[15px] font-bold !text-white shadow-[0_8px_20px_rgba(0,28,172,0.16)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-[#00147d] hover:shadow-[0_12px_24px_rgba(0,28,172,0.22)] active:scale-[.985] motion-reduce:transition-none motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
