import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title:
    "OpenAPI Sync - Automate API Documentation, Types, Clients & Validation",
  description:
    "A powerful developer tool that automates TypeScript type generation, fully-typed API clients (Fetch, Axios, React Query, SWR, RTK Query), runtime validation schemas (Zod, Yup, Joi), endpoint definitions, and comprehensive documentation from your OpenAPI specifications. Now with v5.0.0 enhanced client generation and developer experience.",
  keywords: [
    "openapi",
    "swagger",
    "typescript",
    "api",
    "codegen",
    "type generation",
    "rest api",
    "documentation",
    "api client",
    "fetch",
    "axios",
    "react-query",
    "swr",
    "rtk-query",
    "redux toolkit",
    "tanstack query",
    "type-safe",
    "hooks",
    "validation",
    "zod",
    "yup",
    "joi",
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
