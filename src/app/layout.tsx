import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

// Force all pages to be dynamically rendered (skip static generation during build)
export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "GearShare",
  description: "P2P Gear Rental Marketplace",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || '';

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta property="csp-nonce" content={nonce} />
      </head>
      <body className="antialiased flex flex-col min-h-screen font-sans" nonce={nonce}>
        <AuthProvider>
          <main className="flex-grow">
            {children}
          </main>
          <ToastProvider />
        </AuthProvider>
      </body>
    </html>
  );
}
