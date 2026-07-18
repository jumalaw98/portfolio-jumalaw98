import type { ReactNode } from "react";
import { fontVariables } from "@/styles/fonts";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { defaultMetadata, personJsonLd } from "@/lib/seo";
import "./globals.css";

export const metadata = defaultMetadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {/* Person schema for Home/About — SEO Implementation plan, project-architecture.md */}
        <JsonLd data={personJsonLd()} />
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
