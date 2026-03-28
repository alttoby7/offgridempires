import Link from "next/link";

const footerLinks = {
  Products: [
    { href: "/portable-power", label: "Portable Power" },
    { href: "/solar-kits", label: "DIY Solar Kits" },
    { href: "/whole-home", label: "Whole-Home Systems" },
    { href: "/kits", label: "All Kits" },
    { href: "/products", label: "Components" },
    { href: "/compare", label: "Compare" },
  ],
  "Use Cases": [
    { href: "/best-for/rv", label: "RV & Van Life" },
    { href: "/best-for/cabin", label: "Weekend Cabin" },
    { href: "/best-for/shed", label: "Shed & Workshop" },
    { href: "/best-for/emergency", label: "Emergency Backup" },
    { href: "/best-for/homestead", label: "Homestead" },
    { href: "/best-for/boat", label: "Boat & Marine" },
  ],
  Brands: [
    { href: "/brands/renogy", label: "Renogy" },
    { href: "/brands/eco-worthy", label: "Eco-Worthy" },
    { href: "/brands/ecoflow", label: "EcoFlow" },
    { href: "/brands/jackery", label: "Jackery" },
    { href: "/brands/bluetti", label: "Bluetti" },
    { href: "/brands/windynation", label: "WindyNation" },
  ],
  Budget: [
    { href: "/solar-kits/under-500", label: "Under $500" },
    { href: "/solar-kits/under-1000", label: "Under $1,000" },
    { href: "/solar-kits/under-2000", label: "Under $2,000" },
    { href: "/solar-kits/under-3000", label: "Under $3,000" },
  ],
  Resources: [
    { href: "/calculator", label: "Size My System" },
    { href: "/methodology", label: "How We Score" },
    { href: "/affiliate-disclosure", label: "Affiliate Disclosure" },
    { href: "/contact", label: "Contact" },
  ],
};

const legalLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
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
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
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
          <div className="flex items-center gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
