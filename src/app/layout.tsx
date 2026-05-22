import type { Metadata } from "next";
import { Fraunces, Inter_Tight, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE_URL = "https://offgridempire.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "OffGridEmpire — Compare Every Off-Grid Solar Kit",
    template: "%s | OffGridEmpire",
  },
  description:
    "The independent audit layer for off-grid solar buying decisions. We show the real build cost of every kit — advertised price plus the parts they leave out.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "OffGridEmpire",
    title: "OffGridEmpire — Compare Every Off-Grid Solar Kit",
    description:
      "The independent audit layer for off-grid solar buying decisions. We show the real build cost of every kit — advertised price plus the parts they leave out.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "OffGridEmpire — Compare Every Off-Grid Solar Kit",
    description:
      "Real build cost of every off-grid solar kit. Advertised price plus the parts they leave out.",
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${interTight.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#faf7f2" />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PGP7GKZ3ZT"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());if(typeof window!=='undefined'&&window.location.hostname==='offgridempire.com'){gtag('config','G-PGP7GKZ3ZT');}`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
