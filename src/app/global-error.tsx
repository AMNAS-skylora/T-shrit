"use client";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <html lang="en"><body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#fafafa", color: "#111" }}>
    <main style={{ maxWidth: 560, margin: "15vh auto", padding: 24 }}>
      <p>KLEID.IN</p><h1>We couldn't load the store.</h1>
      <p>Please try again in a moment.</p>
      <button onClick={retry} style={{ padding: "14px 24px", background: "#001cac", color: "white", border: 0, cursor: "pointer" }}>Try again</button>
    </main>
  </body></html>;
}
