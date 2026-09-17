import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#020817",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://openapi-sync.com"),
  title:
    "OpenAPI Sync - Automate API Documentation, Types, Clients & Validation",
  description:
    "A powerful developer tool that automates TypeScript type generation, fully-typed API clients (Fetch, Axios, React Query, SWR, RTK Query), runtime validation schemas (Zod, Yup, Joi), endpoint definitions, and comprehensive documentation from your OpenAPI specifications. Now with v6.4.1 MCP support, agent-friendly workflows, and enhanced client generation.",
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
    apple: "/favicon.png",
  },
  openGraph: {
    title: "OpenAPI Sync - Automate Types, Clients & Validation",
    description:
      "A powerful developer tool that automates TypeScript types, fully-typed API clients (Fetch, Axios, React Query, SWR, RTK Query), and runtime validation schemas from your OpenAPI specs.",
    url: "https://openapi-sync.com",
    siteName: "OpenAPI Sync",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OpenAPI Sync - Automate Types, Clients & Validation",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenAPI Sync - Automate Types, Clients & Validation",
    description:
      "Automate TypeScript types, fully-typed clients, and runtime validation schemas from your OpenAPI specifications.",
    images: ["/og-image.png"],
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
