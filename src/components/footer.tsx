import Link from "next/link";
import { getKitCounts } from "@/lib/get-kits";
import { getKitsUpdated } from "@/lib/data-meta";

const footerLinks = {
  Browse: [
    { href: "/kits", label: "All kits" },
    { href: "/portable-power", label: "Portable power" },
    { href: "/solar-kits", label: "DIY solar kits" },
    { href: "/whole-home", label: "Whole-home systems" },
    { href: "/compare", label: "Compare" },
  ],
  Guides: [
    { href: "/best-rv-solar-kit", label: "Best RV solar kit" },
    { href: "/1000-watt-solar-kit", label: "1000W solar kits" },
    { href: "/2000-watt-solar-kit", label: "2000W solar kits" },
    { href: "/best-solar-generator-under-500", label: "Solar generator under $500" },
    { href: "/learn", label: "All articles" },
  ],
  "Use cases": [
    { href: "/best-for/rv", label: "RV / van life" },
    { href: "/best-for/cabin", label: "Weekend cabin" },
    { href: "/best-for/shed", label: "Shed / workshop" },
    { href: "/best-for/emergency", label: "Emergency backup" },
    { href: "/best-for/homestead", label: "Homestead" },
    { href: "/best-for/boat", label: "Boat / marine" },
  ],
  Methodology: [
    { href: "/how-real-build-cost-is-calculated", label: "Real build cost" },
    { href: "/methodology", label: "Scoring methodology" },
    { href: "/data-sources", label: "Data sources" },
    { href: "/editorial-policy", label: "Editorial policy" },
  ],
};

const legalLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  const counts = getKitCounts();
  const total =
    (counts.portable ?? 0) +
    (counts["diy-kit"] ?? 0) +
    (counts["whole-home"] ?? 0) +
    (counts["panels-only"] ?? 0);
  const updated = getKitsUpdated();

  return (
    <footer className="border-t border-[var(--rule)] bg-[var(--bg-secondary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        {/* Promise strip — restates the brand mission */}
        <div className="mb-10 max-w-2xl">
          <p className="font-display text-2xl text-[var(--ink)] leading-tight">
            The independent audit layer for off-grid solar buying decisions.
          </p>
          <p className="mt-2 text-sm text-[var(--ink-soft)] leading-relaxed">
            We track {total > 0 ? total : 419} kits across 16 brands, normalize specs,
            and price in the parts they leave out — every six hours.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-10">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="eyebrow mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--ink-soft)] hover:text-[var(--accent)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-12 pt-6 border-t border-[var(--rule)] grid grid-cols-1 md:grid-cols-2 gap-6 items-baseline">
          <div className="flex items-center gap-3 text-xs text-[var(--ink-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent)]" />
              </span>
              <span className="tabular">Prices refreshed every 6h</span>
            </span>
            <span className="text-[var(--rule)]">·</span>
            <span className="tabular">Catalog updated {updated}</span>
            <span className="text-[var(--rule)]">·</span>
            <Link href="/how-real-build-cost-is-calculated" className="text-[var(--accent)] hover:underline">
              Methodology
            </Link>
          </div>
          <div className="md:text-right flex md:justify-end flex-wrap gap-x-4 gap-y-1">
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs text-[var(--ink-muted)]">
          &copy; {new Date().getFullYear()} OffGridEmpire. Prices are approximate and should be verified before purchase.
          We earn commission from some retailer links — your price is the same.
        </p>
      </div>
    </footer>
  );
}
