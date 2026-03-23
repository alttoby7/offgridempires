import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = "https://offgridempire.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "OffGridEmpire — Compare Every Off-Grid Solar Kit",
    template: "%s | OffGridEmpire",
  },
  description:
    "The solar kit comparison engine. Break down components, see true total costs, track prices, and find the right off-grid system for your build.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "OffGridEmpire",
    title: "OffGridEmpire — Compare Every Off-Grid Solar Kit",
    description:
      "The solar kit comparison engine. Break down components, see true total costs, track prices, and find the right off-grid system for your build.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "OffGridEmpire — Compare Every Off-Grid Solar Kit",
    description:
      "The solar kit comparison engine. Break down components, see true total costs, and find the right off-grid system.",
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/* Impact affiliate site verification */}
        <meta name="impact-site-verification" {...{ value: "26ccb1d9-e2c5-436e-84de-eac1b435dd35" } as object} />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PGP7GKZ3ZT"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-PGP7GKZ3ZT');`}
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
