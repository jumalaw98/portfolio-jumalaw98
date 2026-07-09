import { Inter, Space_Grotesk, JetBrains_Mono, Caveat } from "next/font/google";

// Body text + default UI face — branding-guide.md Section 3
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Headings/UI — geometric, matches the bold monogram strokes
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

// Code/technical snippets, stack tags — signals "developer" instantly
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Signature / personal accent — sparing use only (footer signature, hero sub-line touches)
export const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export const fontVariables = `${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${caveat.variable}`;
