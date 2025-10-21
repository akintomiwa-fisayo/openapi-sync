import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OpenAPI Sync - Automate API Documentation, Types & Validation",
  description:
    "A powerful developer tool that automates TypeScript type generation, runtime validation schemas (Zod, Yup, Joi), endpoint definitions, and comprehensive documentation from your OpenAPI specifications in real-time.",
  keywords: [
    "openapi",
    "swagger",
    "typescript",
    "api",
    "codegen",
    "type generation",
    "rest api",
    "documentation",
  ],
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
