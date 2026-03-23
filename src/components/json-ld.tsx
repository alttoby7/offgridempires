import type { Kit } from "@/lib/demo-data";

const SITE_URL = "https://offgridempire.com";

/**
 * WebSite schema for homepage — enables sitelinks search box in Google.
 */
export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OffGridEmpire",
    url: SITE_URL,
    description:
      "The solar kit comparison engine. Break down components, see true total costs, track prices, and find the right off-grid system.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/kits?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * BreadcrumbList schema for any page.
 */
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Product schema for kit detail pages.
 * Uses Product type with offers and aggregateRating placeholder.
 */
export function KitProductJsonLd({ kit }: { kit: Kit }) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: kit.name,
    description: `${kit.name} — ${kit.panelWatts}W solar, ${kit.storageWh > 0 ? `${(kit.storageWh / 1000).toFixed(1)}kWh storage` : "no battery"}, ${kit.inverterWatts > 0 ? `${kit.inverterWatts}W inverter` : "no inverter"}. Real build cost: $${kit.trueCost.toLocaleString()}.`,
    brand: {
      "@type": "Brand",
      name: kit.brand,
    },
    url: `${SITE_URL}/kits/${kit.slug}`,
    category: "Solar Kit",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: kit.listedPrice.toFixed(2),
      highPrice: kit.trueCost.toFixed(2),
      offerCount: 1,
      availability: "https://schema.org/InStock",
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Panel Wattage",
        value: `${kit.panelWatts}W`,
      },
      {
        "@type": "PropertyValue",
        name: "Battery Storage",
        value: kit.storageWh > 0 ? `${kit.storageWh}Wh` : "Not included",
      },
      {
        "@type": "PropertyValue",
        name: "Inverter Output",
        value: kit.inverterWatts > 0 ? `${kit.inverterWatts}W` : "Not included",
      },
      {
        "@type": "PropertyValue",
        name: "Voltage",
        value: `${kit.voltage}V`,
      },
      {
        "@type": "PropertyValue",
        name: "Battery Chemistry",
        value: kit.chemistry,
      },
      {
        "@type": "PropertyValue",
        name: "Completeness",
        value: `${kit.completeness}%`,
      },
      {
        "@type": "PropertyValue",
        name: "Real Build Cost",
        value: `$${kit.trueCost.toLocaleString()}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * ItemList schema for kit listing pages.
 */
export function KitListJsonLd({ kits }: { kits: Kit[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Off-Grid Solar Kits",
    description: "Compare off-grid solar kits with true total cost breakdowns.",
    numberOfItems: kits.length,
    itemListElement: kits.map((kit, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: kit.name,
      url: `${SITE_URL}/kits/${kit.slug}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * FAQPage schema — useful for methodology and educational pages.
 */
export function FaqJsonLd({
  questions,
}: {
  questions: { question: string; answer: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
