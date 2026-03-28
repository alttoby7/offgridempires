"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/kits", label: "Kits" },
  { href: "/calculator", label: "Calculator" },
  { href: "/products", label: "Components" },
  { href: "/compare", label: "Compare" },
  { href: "/categories/batteries", label: "Categories" },
];

const mobileMenuSections = [
  {
    title: "Browse",
    links: [
      { href: "/kits", label: "All Kits" },
      { href: "/products", label: "Components" },
      { href: "/compare", label: "Compare" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/calculator", label: "Size My System" },
      { href: "/methodology", label: "How We Score" },
    ],
  },
  {
    title: "Use Cases",
    links: [
      { href: "/best-for/rv", label: "RV & Van Life" },
      { href: "/best-for/cabin", label: "Cabin" },
      { href: "/best-for/homestead", label: "Homestead" },
      { href: "/best-for/emergency", label: "Emergency" },
      { href: "/best-for/shed", label: "Shed" },
      { href: "/best-for/boat", label: "Boat" },
    ],
  },
  {
    title: "Brands",
    links: [
      { href: "/brands/renogy", label: "Renogy" },
      { href: "/brands/ecoflow", label: "EcoFlow" },
      { href: "/brands/bluetti", label: "Bluetti" },
      { href: "/brands/jackery", label: "Jackery" },
      { href: "/brands/eco-worthy", label: "Eco-Worthy" },
    ],
  },
  {
    title: "Categories",
    links: [
      { href: "/categories/batteries", label: "Batteries" },
      { href: "/categories/panels", label: "Panels" },
      { href: "/categories/inverters", label: "Inverters" },
      { href: "/categories/charge-controllers", label: "Charge Controllers" },
    ],
  },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-primary)]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative flex h-9 w-9 items-center justify-center">
                <div className="absolute inset-0 rounded bg-[var(--accent)] opacity-10 group-hover:opacity-20 transition-opacity" />
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--accent)]"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <span className="font-mono text-sm font-bold tracking-tight text-[var(--text-primary)]">
                OFFGRID<span className="text-[var(--accent)]">EMPIRE</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                    pathname === link.href
                      ? "text-[var(--accent)] bg-[var(--bg-surface)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA + Mobile toggle */}
            <div className="flex items-center gap-3">
              <Link
                href="/kits"
                className="hidden sm:inline-flex items-center gap-2 rounded bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors"
              >
                Browse Kits
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />

          {/* Slide-out drawer */}
          <nav className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[var(--bg-primary)] border-l border-[var(--border)] overflow-y-auto">
            {/* Drawer header */}
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-primary)]">
              <span className="font-mono text-sm font-bold tracking-tight text-[var(--text-primary)]">
                OFFGRID<span className="text-[var(--accent)]">EMPIRE</span>
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Close menu"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Calculator CTA */}
            <div className="px-5 py-4">
              <Link
                href="/calculator"
                className="flex items-center justify-center gap-2 rounded bg-[var(--accent)] px-4 py-3 text-sm font-bold text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] transition-colors w-full"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Size My System
              </Link>
            </div>

            {/* Menu sections */}
            <div className="px-5 pb-8 space-y-6">
              {mobileMenuSections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                    {section.title}
                  </h3>
                  <ul className="space-y-0.5">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className={`block px-3 py-2.5 text-sm rounded transition-colors ${
                            pathname === link.href
                              ? "text-[var(--accent)] bg-[var(--bg-surface)]"
                              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Legal links */}
              <div className="pt-4 border-t border-[var(--border)]">
                <div className="flex flex-wrap gap-4">
                  {[
                    { href: "/about", label: "About" },
                    { href: "/privacy", label: "Privacy" },
                    { href: "/terms", label: "Terms" },
                    { href: "/affiliate-disclosure", label: "Disclosure" },
                    { href: "/contact", label: "Contact" },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
