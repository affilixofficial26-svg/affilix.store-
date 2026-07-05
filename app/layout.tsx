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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://affilix.es"),
  title: "AFFILIX - Crea, vende y automatiza productos digitales",
  description: "Compra productos digitales, encarga servicios creativos, accede a kits de negocio y encuentra herramientas SaaS recomendadas para crecer mas rapido.",
  keywords: ["productos digitales", "servicios creativos", "herramientas digitales", "SaaS", "automatizacion", "afiliados digitales", "kits de negocio", "prompts", "ebooks", "plantillas", "marketing automatico"],
  openGraph: {
    title: "AFFILIX - Crea, vende y automatiza productos digitales",
    description: "Compra productos digitales, encarga servicios creativos, accede a kits de negocio y encuentra herramientas SaaS recomendadas.",
    images: ["/brand/social/og-affilix.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AFFILIX",
    description: "Crea, vende y automatiza productos digitales.",
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
