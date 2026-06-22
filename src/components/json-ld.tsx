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
  const offerPrices = (kit.offers ?? []).map((o) => o.price).filter((p) => p > 0);
  const allPrices = offerPrices.length > 0 ? offerPrices : [kit.listedPrice];
  const lowPrice = Math.min(...allPrices);
  const highPrice = Math.max(...allPrices);
  const offerCount = offerPrices.length > 0 ? offerPrices.length : 1;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${kit.brand} ${kit.name}`,
    description: `${kit.brand} ${kit.name} — ${kit.panelWatts}W solar, ${kit.storageWh > 0 ? `${(kit.storageWh / 1000).toFixed(1)}kWh storage` : "no battery"}, ${kit.inverterWatts > 0 ? `${kit.inverterWatts}W inverter` : "no inverter"}. Real build cost: $${kit.trueCost.toLocaleString()}.`,
    brand: {
      "@type": "Brand",
      name: kit.brand,
    },
    ...(kit.imageUrl ? { image: kit.imageUrl } : {}),
    url: `${SITE_URL}/kits/${kit.slug}`,
    category: "Solar Kit",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice,
      highPrice,
      offerCount,
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
      name: `${kit.brand} ${kit.name}`,
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

/**
 * Dataset schema — exposes OffGridEmpire's proprietary off-grid-solar cost &
 * price corpus as a citable schema.org/Dataset. This is the AIO/GEO lever: it
 * tells answer engines (ChatGPT, Perplexity, Google AI Overviews) that the
 * site is the ORIGINAL SOURCE of structured data they can attribute — real
 * build cost, completeness, cost-per-Wh, and 6-month price history across the
 * full kit corpus — backed by an actual machine-readable DataDownload.
 */
export function DatasetJsonLd({
  kitCount,
  pricedCount,
  updated,
}: {
  kitCount: number;
  pricedCount: number;
  updated?: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "OffGridEmpire Off-Grid Solar Kit Cost & Price Dataset",
    description: `A continuously updated dataset of ${kitCount.toLocaleString()} off-grid solar kits (${pricedCount.toLocaleString()} actively priced) decomposed into 7 standard component roles. Each kit carries its advertised price, real build cost (advertised price plus required missing components), completeness score, cost per usable watt-hour, and 6-month price history. Prices refresh every 6–12 hours from retailer APIs and affiliate feeds.`,
    url: `${SITE_URL}/methodology`,
    sameAs: `${SITE_URL}/data-sources`,
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    creator: {
      "@type": "Organization",
      name: "OffGridEmpire",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "OffGridEmpire",
      url: SITE_URL,
    },
    ...(updated ? { dateModified: updated } : {}),
    keywords: [
      "off-grid solar kits",
      "solar generator pricing",
      "real build cost",
      "cost per watt-hour",
      "solar kit completeness",
      "solar price history",
      "LiFePO4 battery storage",
      "portable power stations",
    ],
    measurementTechnique:
      "Component-role decomposition with required-missing-part cost estimation; 6–12 hour retailer/affiliate price polling.",
    variableMeasured: [
      { "@type": "PropertyValue", name: "Advertised Price", unitText: "USD" },
      {
        "@type": "PropertyValue",
        name: "Real Build Cost",
        description:
          "Advertised price plus the estimated cost of required components the kit does not include.",
        unitText: "USD",
      },
      {
        "@type": "PropertyValue",
        name: "Completeness",
        description:
          "Percentage of the 7 required component roles the kit includes.",
        unitText: "PERCENT",
      },
      {
        "@type": "PropertyValue",
        name: "Cost per Usable Watt-Hour",
        description:
          "Real build cost divided by usable battery watt-hours (depth-of-discharge adjusted).",
        unitText: "USD per Wh",
      },
      {
        "@type": "PropertyValue",
        name: "Battery Storage",
        unitText: "Wh",
      },
      {
        "@type": "PropertyValue",
        name: "Inverter Output",
        unitText: "W",
      },
      {
        "@type": "PropertyValue",
        name: "6-Month Price History",
        description: "Daily-observed price points over the trailing 6 months.",
      },
    ],
    distribution: [
      {
        "@type": "DataDownload",
        name: "Full kit dataset (CSV)",
        encodingFormat: "text/csv",
        contentUrl: `${SITE_URL}/data/offgridempire-solar-kit-dataset.csv`,
      },
      {
        "@type": "DataDownload",
        name: "Full kit dataset (JSON)",
        encodingFormat: "application/json",
        contentUrl: `${SITE_URL}/data/offgridempire-solar-kit-dataset.json`,
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
 * Organization schema for homepage — establishes entity identity.
 */
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OffGridEmpire",
    url: SITE_URL,
    description:
      "Solar kit comparison engine with real build costs and component breakdowns.",
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
