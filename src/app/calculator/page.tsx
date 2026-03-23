import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getKits } from "@/lib/get-kits";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { CalculatorFlow } from "@/components/calculator/calculator-flow";

export const metadata: Metadata = {
  title: "Solar Power Calculator — Size Your Off-Grid System",
  description:
    "Calculate exactly how much solar, battery storage, and inverter capacity you need. Enter your appliances, set your location, and get matched to real kits with pricing.",
  alternates: { canonical: "/calculator" },
  openGraph: {
    title: "Solar Power Calculator | OffGridEmpire",
    description:
      "Calculate exactly how much solar, battery, and inverter you need — then see which real kits match.",
    url: "/calculator",
  },
};

export default function CalculatorPage() {
  const allKits = getKits();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Calculator", url: "/calculator" },
        ]}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--accent)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--text-secondary)]">Calculator</span>
      </nav>

      <Suspense
        fallback={
          <div className="h-96 animate-pulse rounded bg-[var(--bg-surface)]" />
        }
      >
        <CalculatorFlow allKits={allKits} />
      </Suspense>
    </div>
  );
}
