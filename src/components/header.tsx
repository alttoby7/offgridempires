import Link from "next/link";

const navLinks = [
  { href: "/kits", label: "Kits" },
  { href: "/calculator", label: "Calculator" },
  { href: "/products", label: "Components" },
  { href: "/compare", label: "Compare" },
  { href: "/categories/batteries", label: "Categories" },
];

export function Header() {
  return (
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

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
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
            <button className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
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
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
