import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDecisionGuideSlugs } from "@/content/decision-guide-registry";
import { getResolvedDecisionGuide } from "@/lib/decision/resolve";
import { APPLIANCE_CATALOG } from "@/lib/calculator/appliances";
import { computeSizing } from "@/lib/calculator/engine";
import { computeVerdicts } from "@/lib/calculator/verdicts";
import type { LoadEntry } from "@/lib/calculator/types";
import { getKitsUpdated } from "@/lib/data-meta";
import { BreadcrumbJsonLd, FaqJsonLd } from "@/components/json-ld";
import { VerdictList } from "@/components/calculator/verdict-list";
import { DataFooter } from "@/components/ui/data-footer";
import { Prose } from "@/components/decision/prose";
import { DecisionGuideJsonLd } from "@/components/decision/decision-jsonld";
import {
  GuideHeader,
  SizingCards,
  Podium,
  ReceiptSection,
  AddOnBom,
  BuyTimingTable,
  WhyWonWhyFailed,
  MethodologyFreshness,
} from "@/components/decision/decision-sections";

export const dynamic = "force-static";
export const dynamicParams = false;

function presetToLoads(ids: string[]): LoadEntry[] {
  const loads: LoadEntry[] = [];
  ids.forEach((id, i) => {
    const def = APPLIANCE_CATALOG.find((a) => a.id === id);
    if (!def) return;
    loads.push({
      id: `guide-${i}`,
      name: def.name,
      watts: def.defaultWatts,
      qty: def.defaultQty,
      hoursPerDay: def.defaultHours,
      dutyCycle: def.dutyCycle,
      surgeWatts: def.surgeWatts,
      isCustom: false,
    });
  });
  return loads;
}

export function generateStaticParams() {
  return getDecisionGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = getResolvedDecisionGuide(slug);
  if (!resolved) return { title: "Guide Not Found" };
  const meta = resolved.meta;
  return {
    title: meta.metaTitle,
    description: meta.metaDescription,
    alternates: { canonical: `/guides/${slug}` },
    // INDEX GOVERNOR: guides are noindex,follow until a human flips `indexable`.
    ...(meta.indexable ? {} : { robots: { index: false, follow: true } }),
    openGraph: { title: meta.metaTitle, description: meta.metaDescription, url: `/guides/${slug}` },
  };
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3 leading-snug">{children}</h2>
  );
}

export default async function DecisionGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = getResolvedDecisionGuide(slug);
  if (!resolved) notFound();
  const { meta, picks } = resolved;

  const loads = presetToLoads(meta.loadIds);
  const sizing = computeSizing(loads, meta.assumptions);
  const verdicts = computeVerdicts(loads, meta.assumptions, sizing);
  const sections = meta.sections;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Guides", url: "/guides" },
          { name: meta.h1, url: `/guides/${slug}` },
        ]}
      />
      <DecisionGuideJsonLd meta={meta} picks={picks} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/guides" className="hover:text-[var(--accent)] transition-colors">Guides</Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)] truncate">{meta.h1}</span>
      </nav>

      {/* 1. Header + answer-first */}
      <GuideHeader h1={meta.h1} answer={meta.answer} />
      <div className="mt-4">
        <DataFooter updated={getKitsUpdated()} />
      </div>

      {/* 2. Load profile + sizing */}
      {sections[0] && (
        <section className="mt-8">
          <H2>{sections[0].heading}</H2>
          <Prose body={sections[0].body} />
          <div className="mt-5">
            <SizingCards sizing={sizing} />
          </div>
        </section>
      )}

      {/* 3. Verdict block */}
      {sections[1] && (
        <section className="mt-10">
          <H2>{sections[1].heading}</H2>
          <Prose body={sections[1].body} />
          <div className="mt-4">
            <VerdictList verdicts={verdicts} />
          </div>
        </section>
      )}

      {/* 4. Podium */}
      {sections[2] && (
        <section className="mt-10">
          <H2>{sections[2].heading}</H2>
          <div className="mb-4">
            <Prose body={sections[2].body} />
          </div>
          <Podium picks={picks} />
        </section>
      )}

      {/* 4b. Add-on BOM (Tier-3 add-on pages only) */}
      {meta.addOnBom && meta.addOnBom.length > 0 && (
        <section className="mt-10">
          <H2>What to add to close the gap</H2>
          <AddOnBom items={meta.addOnBom} guideSlug={slug} />
        </section>
      )}

      {/* 5. Receipt (autonomy or missing-parts) */}
      <section className="mt-10">
        <H2>The receipt: what your money actually buys</H2>
        <ReceiptSection
          picks={picks}
          mode={meta.receiptMode}
          effectiveLoadWatts={meta.effectiveLoadWatts}
          note={meta.receiptNote}
        />
      </section>

      {/* 6. Gap-closing BOM (narrative for integrated kits) */}
      {sections[3] && (
        <section className="mt-10">
          <H2>{sections[3].heading}</H2>
          <Prose body={sections[3].body} />
        </section>
      )}

      {/* 7. Buy now vs wait */}
      <section className="mt-10">
        <H2>Buy now or wait?</H2>
        <BuyTimingTable picks={picks} />
      </section>

      {/* 8. Why won / why failed */}
      <section className="mt-10">
        <H2>Why these won — and why others failed</H2>
        <WhyWonWhyFailed whyWon={meta.whyWon} whyFailed={meta.whyFailed} />
      </section>

      {/* 9. FAQ */}
      {meta.faqs.length > 0 && (
        <section className="mt-10">
          <H2>Frequently asked</H2>
          {meta.indexable && <FaqJsonLd questions={meta.faqs} />}
          <div className="divide-y divide-[var(--border)] rounded border border-[var(--border)] bg-[var(--bg-surface)]">
            {meta.faqs.map((f, i) => (
              <div key={i} className="p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">{f.question}</p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 10. Methodology + freshness + corrections */}
      <section className="mt-10">
        <H2>Methodology, freshness &amp; corrections</H2>
        <MethodologyFreshness
          cohortLabel={meta.cohortLabel}
          headlineCount={meta.cohortHeadlineCount}
          shortlistCount={meta.cohortShortlistCount}
          updatedAt={meta.updatedAt}
        />
      </section>
    </div>
  );
}
