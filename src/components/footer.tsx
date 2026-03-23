import Link from "next/link";

const footerLinks = {
  Tool: [
    { href: "/kits", label: "Browse Kits" },
    { href: "/compare", label: "Compare" },
    { href: "/products", label: "Components" },
    { href: "/categories/batteries", label: "Batteries" },
    { href: "/categories/panels", label: "Solar Panels" },
  ],
  "Use Cases": [
    { href: "/kits?use_case=rv", label: "RV & Van Life" },
    { href: "/kits?use_case=cabin", label: "Cabin" },
    { href: "/kits?use_case=homestead", label: "Homestead" },
    { href: "/kits?use_case=emergency", label: "Emergency Backup" },
    { href: "/kits?use_case=shed", label: "Shed & Workshop" },
  ],
  Resources: [
    { href: "#", label: "How We Score" },
    { href: "#", label: "Data Sources" },
    { href: "#", label: "Affiliate Disclosure" },
    { href: "#", label: "Contact" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <svg
                width="18"
                height="18"
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
              <span className="font-mono text-sm font-bold tracking-tight">
                OFFGRID<span className="text-[var(--accent)]">EMPIRE</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              The solar kit comparison engine. See what&apos;s really inside every kit.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} OffGridEmpire. Prices are approximate and should be verified before purchase.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Affiliate disclosure: We earn commissions from qualifying purchases.
          </p>
        </div>
      </div>
    </footer>
  );
}
