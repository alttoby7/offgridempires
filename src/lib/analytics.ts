/**
 * GA4 custom event tracking for OffGridEmpire.
 * Wraps window.gtag() with typed event helpers.
 */

type GtagFn = (...args: unknown[]) => void;

function gtag(...args: unknown[]) {
  const g = (window as unknown as { gtag?: GtagFn }).gtag;
  if (typeof g === "function") {
    g(...args);
  }
}

/** User clicks one of the 3 persona path cards on the homepage */
export function trackPathClick(path: "portable" | "diy" | "whole-home") {
  gtag("event", "path_click", { path_type: path });
}

/** User starts the calculator (Step 1 loads) */
export function trackCalcStart() {
  gtag("event", "calc_start");
}

/** User advances to a calculator step */
export function trackCalcStep(step: number) {
  gtag("event", "calc_step", { step_number: step });
}

/** User completes the calculator and sees results */
export function trackCalcComplete(dailyWh: number, matchCount: number) {
  gtag("event", "calc_complete", {
    daily_wh: dailyWh,
    match_count: matchCount,
  });
}

/** User clicks a kit card (from any listing page) */
export function trackKitClick(kitSlug: string, source: string) {
  gtag("event", "kit_click", { kit_slug: kitSlug, click_source: source });
}

/** User clicks an affiliate link to a retailer */
export function trackAffiliateClick(
  kitSlug: string,
  retailer: string,
  price: number
) {
  gtag("event", "affiliate_click", {
    kit_slug: kitSlug,
    retailer,
    price_cents: Math.round(price * 100),
  });
}

/** User loads the compare page */
export function trackCompareView(kitSlugs: string[]) {
  gtag("event", "compare_view", {
    kit_count: kitSlugs.length,
    kits: kitSlugs.join(","),
  });
}

/** User shares a gap receipt */
export function trackReceiptShare(
  kitSlug: string,
  method: "copy" | "download" | "share"
) {
  gtag("event", "receipt_share", { kit_slug: kitSlug, share_method: method });
}

/** User clicks a use case chip */
export function trackUseCaseClick(useCase: string) {
  gtag("event", "usecase_click", { use_case: useCase });
}

/** User clicks a smart path card on homepage */
export function trackSmartPathClick(pathName: string) {
  gtag("event", "smart_path_click", { path_name: pathName });
}
