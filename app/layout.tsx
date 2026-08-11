import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://gustavoaba.github.io/orume3d/";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Orume 3D | Ideias que ganham forma",
    template: "%s | Orume 3D",
  },
  description:
    "Impressão 3D sob medida: peças personalizadas, presentes, decoração, protótipos e soluções feitas para o seu projeto.",
  keywords: [
    "impressão 3D",
    "impressão 3D personalizada",
    "peças 3D",
    "protótipos 3D",
    "Orume 3D",
    "Campinas",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Orume 3D",
    title: "Orume 3D | Ideias que ganham forma",
    description: "Peças personalizadas e soluções em impressão 3D, do seu jeito.",
    images: [
      {
        url: new URL("og.png", siteUrl).toString(),
        width: 1733,
        height: 907,
        alt: "Orume 3D — Ideias que ganham forma",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Orume 3D | Ideias que ganham forma",
    description: "Peças personalizadas e soluções em impressão 3D, do seu jeito.",
    images: [new URL("og.png", siteUrl).toString()],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#081425",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
