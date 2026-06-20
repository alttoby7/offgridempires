import type { Kit } from "@/lib/demo-data";
import type { DecisionGuideMeta } from "@/lib/decision/types";

const SITE_URL = "https://offgridempire.com";

/**
 * One application/ld+json @graph per decision guide.
 *
 * Gate interaction (decision-page-template.md §4): while `indexable` is false we
 * emit ONLY Article + BreadcrumbList — Product/ItemList/FAQPage are suppressed
 * so a noindexed page never ships rich-result markup. The full graph flips on
 * with indexability. Honest: ItemList order == the published podium order.
 */
export function DecisionGuideJsonLd({
  meta,
  picks,
}: {
  meta: DecisionGuideMeta;
  picks: { kit: Kit }[];
}) {
  const pageUrl = `${SITE_URL}/guides/${meta.slug}`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      "@id": `${pageUrl}#article`,
      headline: meta.h1,
      description: meta.metaDescription,
      datePublished: meta.publishedAt,
      dateModified: meta.updatedAt,
      mainEntityOfPage: pageUrl,
      author: { "@type": "Organization", name: "OffGridEmpire", url: SITE_URL },
      publisher: { "@type": "Organization", name: "OffGridEmpire", url: SITE_URL },
      isPartOf: { "@type": "WebSite", name: "OffGridEmpire", url: SITE_URL },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
        { "@type": "ListItem", position: 3, name: meta.h1, item: pageUrl },
      ],
    },
  ];

  if (meta.indexable) {
    graph.push({
      "@type": "ItemList",
      "@id": `${pageUrl}#shortlist`,
      name: meta.h1,
      numberOfItems: picks.length,
      itemListElement: picks.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${p.kit.brand} ${p.kit.name}`,
        url: `${SITE_URL}/kits/${p.kit.slug}`,
      })),
    });

    for (const { kit } of picks) {
      const offerPrices = (kit.offers ?? []).map((o) => o.price).filter((p) => p > 0);
      const allPrices = offerPrices.length > 0 ? offerPrices : [kit.listedPrice];
      graph.push({
        "@type": "Product",
        "@id": `${SITE_URL}/kits/${kit.slug}#product`,
        name: `${kit.brand} ${kit.name}`,
        brand: { "@type": "Brand", name: kit.brand },
        ...(kit.imageUrl ? { image: kit.imageUrl } : {}),
        url: `${SITE_URL}/kits/${kit.slug}`,
        category: "Solar Kit",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: Math.min(...allPrices),
          highPrice: Math.max(...allPrices),
          offerCount: offerPrices.length > 0 ? offerPrices.length : 1,
          availability: "https://schema.org/InStock",
        },
        additionalProperty: [
          { "@type": "PropertyValue", name: "Real Build Cost", value: `$${kit.trueCost.toLocaleString()}` },
          { "@type": "PropertyValue", name: "Inverter Output", value: `${kit.inverterWatts}W` },
          { "@type": "PropertyValue", name: "Battery Storage", value: `${kit.storageWh}Wh` },
        ],
      });
    }

    if (meta.faqs.length > 0) {
      graph.push({
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: meta.faqs.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: { "@type": "Answer", text: q.answer },
        })),
      });
    }
  }

  const data = { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
