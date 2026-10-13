"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#fafafa", color: "#111" }}>
        <main style={{ maxWidth: 560, margin: "12vh auto", padding: 24 }}>
          <p style={{ color: "#001cac", fontWeight: 700 }}>KLEID.IN</p>
          <h1 style={{ fontSize: "clamp(28px, 7vw, 40px)", lineHeight: 1.12 }}>
            We couldn&apos;t load the store.
          </h1>
          <p style={{ lineHeight: 1.6, color: "#555" }}>Please try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: 48,
              padding: "12px 24px",
              borderRadius: 999,
              background: "#001cac",
              color: "white",
              border: 0,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
