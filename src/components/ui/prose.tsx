import Link from "next/link";

export function SectionHeading({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="font-mono text-sm uppercase tracking-wider text-[var(--accent)] mt-10 mb-4"
    >
      {children}
    </h2>
  );
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
      {children}
    </p>
  );
}

export function Breadcrumb({
  items,
}: {
  items: { href?: string; label: string }[];
}) {
  return (
    <nav className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-6">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-2">
          {i > 0 && <span>/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-[var(--accent)] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--text-secondary)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-[var(--text-muted)] mb-8">{subtitle}</p>
      )}
    </>
  );
}

export function ProseContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </div>
  );
}

export function ContentCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-[var(--border)] rounded bg-[var(--bg-surface)] p-6">
      {children}
    </div>
  );
}
