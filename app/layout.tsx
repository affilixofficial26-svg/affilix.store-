import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-dm-sans",
  display: "swap",
});

const geistDisplay = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-syne",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://affilix.store"),
  title: "AFFILIX — Crea, vende y automatiza productos digitales con IA",
  description: "Compra productos digitales, genera servicios con IA, accede a kits de negocio y encuentra herramientas SaaS recomendadas para crecer más rápido.",
  keywords: ["productos digitales", "servicios IA", "herramientas IA", "SaaS", "automatización", "afiliados digitales", "kits de negocio", "prompts", "ebooks", "plantillas", "marketing automático"],
  openGraph: {
    title: "AFFILIX — Crea, vende y automatiza productos digitales con IA",
    description: "Compra productos digitales, genera servicios con IA, accede a kits de negocio y encuentra herramientas SaaS recomendadas.",
    images: ["/brand/social/og-affilix.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AFFILIX Digital Hub",
    description: "Crea, vende y automatiza productos digitales con IA.",
    images: ["/brand/social/twitter-card-affilix.png"],
  },
  icons: {
    icon: "/brand/favicon/favicon-32x32.png",
    apple: "/brand/favicon/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistDisplay.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
