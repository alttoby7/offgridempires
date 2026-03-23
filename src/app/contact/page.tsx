import type { Metadata } from "next";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import {
  SectionHeading,
  Paragraph,
  Breadcrumb,
  PageTitle,
  ProseContainer,
  ContentCard,
} from "@/components/ui/prose";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with OffGridEmpire for data corrections, brand partnerships, or bug reports.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact | OffGridEmpire",
    description:
      "Get in touch with OffGridEmpire for data corrections, brand partnerships, or bug reports.",
    url: "/contact",
  },
};

const contactReasons = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    label: "Data Corrections",
    desc: "Wrong price, missing component, incorrect spec, or outdated listing.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
    label: "Brand Partnerships",
    desc: "Manufacturer wanting to verify product data or join our affiliate program.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    label: "Bug Reports",
    desc: "Broken page, incorrect calculation, display issue, or site malfunction.",
  },
];

export default function ContactPage() {
  return (
    <ProseContainer>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Contact", url: "/contact" },
        ]}
      />

      <Breadcrumb
        items={[{ href: "/", label: "Home" }, { label: "Contact" }]}
      />

      <PageTitle
        title="Contact"
        subtitle="OffGridEmpire is a data tool, not a consulting service. Here's how to reach us."
      />

      <div className="grid gap-3 mb-8">
        {contactReasons.map((reason) => (
          <div
            key={reason.label}
            className="rounded border border-[var(--border)] bg-[var(--bg-surface)] p-5 flex items-start gap-4 hover:border-[var(--border-accent)] transition-colors"
          >
            <div className="text-[var(--accent)] mt-0.5 shrink-0">
              {reason.icon}
            </div>
            <div>
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] mb-1">
                {reason.label}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">{reason.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <ContentCard>
        <div className="text-center py-4">
          <SectionHeading>Email</SectionHeading>
          <a
            href="mailto:info@offgridempire.com"
            className="font-mono text-lg text-[var(--accent)] hover:underline"
          >
            info@offgridempire.com
          </a>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)] mt-4">
            Typical response: 48 hours
          </p>
        </div>

        <div className="border-t border-[var(--border)] mt-6 pt-6">
          <SectionHeading>What We Don&apos;t Do</SectionHeading>
          <Paragraph>
            We do not provide system design advice, installation guidance, or product
            recommendations. Use the{" "}
            <a href="/kits" className="text-[var(--accent)] hover:underline">
              comparison tool
            </a>
            .
          </Paragraph>
        </div>
      </ContentCard>
    </ProseContainer>
  );
}
