"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/types/product";
import type { StoreSettings } from "@/types/commerce";

const nav = [
  { href: "/", label: "Home" },
  { href: "/#all-products", label: "Shop" },
  { href: "/#about", label: "About" },
  { href: "/wholesale", label: "Dealers" },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className={`menu-icon ${open ? "open" : ""}`} aria-hidden="true">
      <i />
      <i />
    </span>
  );
}

export function Header({
  products,
  settings,
  overlayHome = false,
}: {
  products: Product[];
  settings: StoreSettings;
  overlayHome?: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuCloseTimerRef = useRef<number | null>(null);

  const openMenu = useCallback(() => {
    if (menuCloseTimerRef.current !== null) {
      window.clearTimeout(menuCloseTimerRef.current);
      menuCloseTimerRef.current = null;
    }

    setMenuMounted(true);
    window.requestAnimationFrame(() => setMenuOpen(true));
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);

    if (menuCloseTimerRef.current !== null) {
      window.clearTimeout(menuCloseTimerRef.current);
    }

    menuCloseTimerRef.current = window.setTimeout(() => {
      setMenuMounted(false);
      menuCloseTimerRef.current = null;
    }, 220);
  }, []);

  useEffect(() => {
    return () => {
      if (menuCloseTimerRef.current !== null) {
        window.clearTimeout(menuCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpen, closeMenu]);

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return products.slice(0, 6);

    return products
      .filter((product) =>
        [
          product.name,
          product.category,
          ...product.colors,
          ...product.sizes,
        ]
          .join(" ")
          .toLowerCase()
          .includes(value),
      )
      .slice(0, 8);
  }, [query, products]);

  useEffect(() => {
    if (searchOpen) {
      window.setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false);
        closeMenu();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeMenu]);

  function closePanels() {
    closeMenu();
    setSearchOpen(false);
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    return pathname === href;
  }

  return (
    <>
      <header className={"site-header" + (overlayHome ? " site-header-home-overlay" : "")}>
        <Link
          href="/"
          className="brand"
          aria-label="KLEID.IN home"
          onClick={closePanels}
        >
          KLEID.IN
        </Link>

        <nav className="nav desktop-nav" aria-label="Primary navigation">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={isActive(item.href) ? "active" : ""}
              onClick={closePanels}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className="icon-button"
            type="button"
            aria-label="Search products"
            aria-expanded={searchOpen}
            onClick={() => {
              closeMenu();
              setSearchOpen((current) => !current);
            }}
          >
            <SearchIcon />
          </button>

          {settings.whatsappNumber ? (
            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="header-whatsapp-button"
              aria-label="Message KLEID.IN on WhatsApp"
              title="WhatsApp"
            >
              <span>Contact</span>
            </a>
          ) : null}

          <button
            ref={menuButtonRef}
            className="menu-button"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => {
              setSearchOpen(false);

              if (menuOpen) {
                closeMenu();
              } else {
                openMenu();
              }
            }}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </header>

      {menuMounted ? (
        <div
          ref={menuRef}
          className={`mobile-compact-card ${
            menuOpen ? "is-open" : "is-closing"
          }`}
          role="dialog"
          aria-label="Mobile navigation"
        >
          <nav className="mobile-card-nav" aria-label="Mobile navigation">
            {nav.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className={`mobile-card-link ${
                  isActive(item.href) ? "active" : ""
                }`}
                style={{ animationDelay: `${130 + index * 40}ms` }}
                onClick={closePanels}
              >
                <span>{item.label}</span>
                <span className="mobile-card-arrow" aria-hidden="true">
                  ↗
                </span>
              </Link>
            ))}
          </nav>
        </div>
      ) : null}

      {searchOpen ? (
        <div className="search-panel" role="search">
          <div className="search-panel-inner">
            <div className="search-input-row">
              <SearchIcon />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products, categories, colours..."
                aria-label="Search products"
              />
              <button
                type="button"
                className="search-close"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="search-results">
              <p>{query ? "Search results" : "Popular products"}</p>

              {results.length ? (
                <div className="search-result-list">
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="search-result-item"
                      onClick={closePanels}
                    >
                      <div className="search-result-thumb">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={56}
                            height={56}
                            className="search-result-img"
                          />
                        ) : (
                          <div className="search-result-placeholder">
                            <span>{product.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>

                      <div className="search-result-info">
                        <strong className="search-result-title">
                          {product.name}
                        </strong>
                        <small className="search-result-meta">
                          {product.category}
                          {product.colors?.length
                            ? ` · ${product.colors.join(" / ")}`
                            : ""}
                        </small>
                      </div>

                      <span className="search-result-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="search-empty">
                  No products found for “{query}”.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        @media (max-width: 640px) {
          .site-header.site-header-home-overlay {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 1000 !important;
            width: 100% !important;
            height: 56px !important;
            margin: 0 !important;
            padding: 0 12px 0 14px !important;
            border: 0 !important;
            border-bottom: 1px solid rgba(255, 255, 255, .16) !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }

          .site-header.site-header-home-overlay .brand {
            color: #111 !important;
            font-size: 18px !important;
            line-height: 1 !important;
          }

          .site-header.site-header-home-overlay .icon-button {
            color: #111 !important;
          }

          .site-header.site-header-home-overlay .menu-button {
            color: #3f5cff !important;
          }

          .site-header.site-header-home-overlay .header-actions {
            gap: 4px !important;
          }

          .site-header.site-header-home-overlay .icon-button,
          .site-header.site-header-home-overlay .menu-button {
            width: 34px !important;
            height: 34px !important;
          }

          .site-header.site-header-home-overlay .header-whatsapp-button {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
