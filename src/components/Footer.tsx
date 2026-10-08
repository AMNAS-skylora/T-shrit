import Link from "next/link";
import type { StoreSettings } from "@/types/commerce";

export function Footer({ settings }: { settings: StoreSettings }) {
  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`
    : "";

  return (
    <footer className="site-footer">
      <div className="footer-intro">
        <Link href="/" className="footer-logo">KLEID.IN</Link>
        <p>{settings.footerTagline}</p>
      </div>

      <div className="footer-column">
        <span>Explore</span>
        <Link href="/">Home</Link>
        <Link href="/#all-products">Shop</Link>
        <Link href="/#about">About</Link>
        {whatsappHref ? (
          <a href={whatsappHref} target="_blank" rel="noreferrer">Contact</a>
        ) : null}
      </div>

      <div className="footer-column">
        <span>Help</span>
        {whatsappHref ? (
          <>
            <a href={whatsappHref} target="_blank" rel="noreferrer">Shipping</a>
            <a href={whatsappHref} target="_blank" rel="noreferrer">Returns</a>
            <a href={whatsappHref} target="_blank" rel="noreferrer">Size Guide</a>
          </>
        ) : null}
      </div>

      <div className="footer-column footer-social-column">
        <span>Social</span>

        <div className="footer-social-links">
          {settings.instagramUrl ? (
            <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="footer-social-link" aria-label="Instagram">
              <span className="footer-social-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.7" />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
                  <circle cx="17.4" cy="6.8" r="1" fill="currentColor" />
                </svg>
              </span>
              <span className="footer-social-name">Instagram</span>
            </a>
          ) : null}

          {settings.facebookUrl ? (
            <a href={settings.facebookUrl} target="_blank" rel="noreferrer" className="footer-social-link" aria-label="Facebook">
              <span className="footer-social-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v5h4v-5h3l1-4h-4V9c0-.7.3-1 1-1Z" fill="currentColor" />
                </svg>
              </span>
              <span className="footer-social-name">Facebook</span>
            </a>
          ) : null}

          {whatsappHref ? (
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="footer-social-link" aria-label="WhatsApp">
              <span className="footer-social-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.3-4A8 8 0 1 1 20 11.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.2 8.1c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.7c.1.3.1.5-.1.7l-.6.7c-.2.2-.1.4 0 .6.5.9 1.3 1.7 2.2 2.2.2.1.4.2.6 0l.8-1c.2-.2.4-.3.7-.2l1.6.8c.3.1.4.3.4.6 0 .6-.3 1.4-.8 1.8-.5.5-1.3.8-2.1.6-1.2-.3-2.7-1-4.2-2.4-1.2-1.1-2-2.4-2.4-3.5-.3-.8 0-1.9.5-2.6Z" fill="currentColor" />
                </svg>
              </span>
              <span className="footer-social-name">WhatsApp</span>
            </a>
          ) : null}
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} KLEID.IN</span>
        <span>India / INR</span>
      </div>
    </footer>
  );
}
