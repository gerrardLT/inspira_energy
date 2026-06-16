import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-heading",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inspira Energy | Smart Capital for Clean Energy",
  description:
    "Singapore-registered renewable energy fund platform. Institutional-grade solar, storage, and wind investments across Southeast Asia, Australia, China, and Europe.",
  openGraph: {
    title: "Inspira Energy | Smart Capital for Clean Energy",
    description:
      "Institutional-grade renewable energy fund products. From greenfield to grid-connected operations.",
    type: "website",
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
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
