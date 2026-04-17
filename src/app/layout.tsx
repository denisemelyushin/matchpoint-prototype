import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppStoreProvider } from "@/lib/app-store";
import { TabBarVariantProvider } from "@/lib/tab-bar-variant";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Matchpoint Pro",
  description: "Find courts, schedule games, connect with players",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Matchpoint Pro",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="h-full overflow-hidden flex justify-center bg-background">
        <div className="relative w-full h-full max-w-[480px] overflow-hidden">
          <AppStoreProvider>
            <TabBarVariantProvider>{children}</TabBarVariantProvider>
          </AppStoreProvider>
        </div>
      </body>
    </html>
  );
}
