"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const primaryNav = [
  { href: "/kits", label: "Kits" },
  { href: "/calculator", label: "Calculator" },
  { href: "/learn", label: "Learn" },
];

const guideLinks = [
  { href: "/best-rv-solar-kit", label: "Best RV Solar Kit" },
  { href: "/1000-watt-solar-kit", label: "1000W Solar Kits" },
  { href: "/2000-watt-solar-kit", label: "2000W Solar Kits" },
  { href: "/best-solar-generator-under-500", label: "Solar Generator Under $500" },
  { href: "/portable-power", label: "All Portable Power" },
  { href: "/whole-home", label: "Whole-Home Systems" },
];

const mobileSections = [
  {
    title: "Kits",
    links: [
      { href: "/kits", label: "All kits" },
      { href: "/portable-power", label: "Portable power stations" },
      { href: "/solar-kits", label: "DIY solar kits" },
      { href: "/whole-home", label: "Whole-home systems" },
    ],
  },
  {
    title: "Guides",
    links: guideLinks,
  },
  {
    title: "Tools",
    links: [
      { href: "/calculator", label: "System size calculator" },
      { href: "/compare", label: "Compare kits side-by-side" },
      { href: "/tools/shed-solar-calculator", label: "Shed solar calculator" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "About OffGridEmpire" },
      { href: "/how-real-build-cost-is-calculated", label: "How we calculate real build cost" },
      { href: "/editorial-policy", label: "Editorial policy" },
      { href: "/data-sources", label: "Data sources" },
    ],
  },
];

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      {/* Stamped monogram — sun + horizon inside a bordered square */}
      <span
        className="relative flex h-8 w-8 items-center justify-center rounded-[3px] border border-[var(--ink)] bg-[var(--paper)] overflow-hidden"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--accent)]">
          {/* sun */}
          <circle cx="12" cy="13" r="4" fill="currentColor" />
          {/* horizon */}
          <line x1="2" y1="17" x2="22" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          {/* sun rays */}
          <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="4.5" y1="6" x2="6.4" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="19.5" y1="6" x2="17.6" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <span className="font-display text-[19px] font-medium tracking-tight text-[var(--ink)] leading-none">
        OffGrid<span className="text-[var(--accent)]">Empire</span>
      </span>
    </span>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [guidesOpen, setGuidesOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
    setGuidesOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--rule)] bg-[var(--paper)]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="group">
              <Wordmark />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/kits"
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${
                  pathname === "/kits"
                    ? "text-[var(--accent)]"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                Kits
              </Link>

              {/* Guides dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setGuidesOpen(true)}
                onMouseLeave={() => setGuidesOpen(false)}
              >
                <button
                  className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors flex items-center gap-1 ${
                    guideLinks.some((l) => l.href === pathname)
                      ? "text-[var(--accent)]"
                      : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  }`}
                  aria-expanded={guidesOpen}
                >
                  Guides
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {guidesOpen && (
                  <div className="absolute left-0 top-full pt-2 w-72">
                    <div className="rounded-sm border border-[var(--rule)] bg-[var(--bg-surface)] shadow-[0_8px_24px_-8px_rgba(20,17,13,0.18)] py-2">
                      {guideLinks.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          className="block px-4 py-2 text-sm text-[var(--ink-soft)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)] transition-colors"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {primaryNav.slice(1).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${
                    pathname === link.href || pathname?.startsWith(link.href + "/")
                      ? "text-[var(--accent)]"
                      : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/about"
                className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${
                  pathname === "/about"
                    ? "text-[var(--accent)]"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                About
              </Link>
            </nav>

            {/* CTA + mobile toggle */}
            <div className="flex items-center gap-3">
              <Link
                href="/calculator"
                className="hidden sm:inline-flex items-center gap-2 rounded-sm bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--paper)] hover:bg-[var(--accent)] transition-colors"
              >
                Size your system
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-[var(--ink)]/40"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-[var(--paper)] border-l border-[var(--rule)] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-[var(--rule)] bg-[var(--paper)]">
              <Wordmark />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4">
              <Link
                href="/calculator"
                className="flex items-center justify-center gap-2 rounded-sm bg-[var(--ink)] px-4 py-3 text-sm font-bold text-[var(--paper)] hover:bg-[var(--accent)] transition-colors w-full"
              >
                Size your system
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="px-5 pb-8 space-y-6">
              {mobileSections.map((section) => (
                <div key={section.title}>
                  <h3 className="eyebrow mb-2">{section.title}</h3>
                  <ul className="space-y-0.5">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className={`block px-3 py-2 text-sm rounded-sm transition-colors ${
                            pathname === link.href
                              ? "text-[var(--accent)] bg-[var(--bg-secondary)]"
                              : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--bg-secondary)]"
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="pt-4 border-t border-[var(--rule)]">
                <div className="flex flex-wrap gap-4">
                  {[
                    { href: "/privacy", label: "Privacy" },
                    { href: "/terms", label: "Terms" },
                    { href: "/affiliate-disclosure", label: "Disclosure" },
                    { href: "/contact", label: "Contact" },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-xs text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors"
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
