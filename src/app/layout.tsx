import type { Metadata, Viewport } from "next";
import "@fontsource-variable/source-sans-3";
import "@fontsource/source-serif-4/latin-400.css";
import "@fontsource/source-serif-4/latin-600.css";
import "@fontsource/source-serif-4/latin-700.css";
import "./globals.css";
import { Themes } from "@/components/theme";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: `${brand.name} — AI news & intelligence`,
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
  alternates: { types: { "application/rss+xml": "/feed.xml" } },
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: brand.name,
    description: brand.description,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#151615" },
  ],
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <Themes>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          {children}
        </Themes>
      </body>
    </html>
  );
}
