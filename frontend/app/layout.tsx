import type { Metadata } from "next";
import "./globals.css";

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
    google: "placeholder", // Replace with actual Google Site Verification
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
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
