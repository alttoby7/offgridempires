"use client";

import { trackAffiliateClick } from "@/lib/analytics";

interface AffiliateLinkProps {
  href: string;
  kitSlug: string;
  retailer: string;
  price: number;
  className?: string;
  children: React.ReactNode;
}

export function AffiliateLink({
  href,
  kitSlug,
  retailer,
  price,
  className,
  children,
}: AffiliateLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow noopener sponsored"
      className={className}
      onClick={() => trackAffiliateClick(kitSlug, retailer, price)}
    >
      {children}
    </a>
  );
}
