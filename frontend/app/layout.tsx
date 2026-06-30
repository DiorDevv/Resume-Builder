import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const siteUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "Resume Builder — O'zbekiston IT bozori uchun professional CV",
    template: "%s | Resume Builder",
  },
  description:
    "5 daqiqada chiroyli, ATS-friendly CV yarating. O'zbek, rus va ingliz tillarida. IT mutaxassislari uchun maxsus.",
  keywords: [
    "CV yaratish",
    "resume builder",
    "O'zbekiston IT",
    "professional CV",
    "ATS friendly resume",
    "Uzum CV",
    "TBC Bank resume",
    "Epam application",
  ],
  authors: [{ name: "Resume Builder" }],
  creator: "Resume Builder",
  publisher: "Resume Builder",
  metadataBase: new URL(siteUrl),
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    siteName: "Resume Builder",
    title: "Resume Builder — O'zbekiston IT bozori uchun professional CV",
    description:
      "5 daqiqada chiroyli, ATS-friendly CV yarating. O'zbek, rus va ingliz tillarida.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Resume Builder — Professional CV for Uzbekistan IT",
    description:
      "Create an ATS-friendly CV in 5 minutes for Uzbekistan IT market.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "placeholder",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366F1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Resume Builder",
              url: siteUrl,
              description:
                "O'zbekiston IT bozori uchun professional CV yaratuvchi platforma",
              applicationCategory: "Career",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen"><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
