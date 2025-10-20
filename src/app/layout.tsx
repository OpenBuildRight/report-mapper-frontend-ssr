import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import {ClientConfigProvider} from "@/context/providers/ClientConfigProvider";
import {AuthClientProvider} from "@/context/providers/AuthClientProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Report Mapper",
  description: "Report Mapper Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientConfigProvider>
            <AuthClientProvider>
                <Navbar />
                <main className="min-h-screen bg-gray-50 pt-16">{children}</main>
            </AuthClientProvider>
        </ClientConfigProvider>
      </body>
    </html>
  );
}
