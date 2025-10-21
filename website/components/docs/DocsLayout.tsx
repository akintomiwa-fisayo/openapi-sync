"use client";

import { useState } from "react";
import { FiMenu, FiX, FiChevronRight } from "react-icons/fi";
import Link from "next/link";
import routes from "@/lib/routes";

const sections = [
  {
    title: "Getting Started",
    links: [
      { id: "introduction", label: "Introduction" },
      { id: "installation", label: "Installation" },
      { id: "quick-start", label: "Quick Start" },
    ],
  },
  {
    title: "Configuration",
    links: [
      { id: "basic-config", label: "Basic Configuration" },
      { id: "advanced-config", label: "Advanced Configuration" },
      { id: "type-config", label: "Type Configuration" },
      { id: "endpoint-config", label: "Endpoint Configuration" },
    ],
  },
  {
    title: "Features",
    links: [
      { id: "folder-splitting", label: "Folder Splitting" },
      { id: "validation-schemas", label: "Validation Schemas" },
      { id: "custom-code", label: "Custom Code Preservation" },
      { id: "endpoint-filtering", label: "Endpoint Filtering" },
    ],
  },
  {
    title: "Usage",
    links: [
      { id: "cli-usage", label: "CLI Usage" },
      { id: "programmatic-usage", label: "Programmatic Usage" },
      { id: "generated-output", label: "Generated Output" },
    ],
  },
  {
    title: "Examples",
    links: [
      { id: "basic-examples", label: "Basic Examples" },
      { id: "validation-examples", label: "Validation Examples" },
      { id: "advanced-examples", label: "Advanced Examples" },
    ],
  },
  {
    title: "Resources",
    links: [
      { id: "api-reference", label: "API Reference" },
      { id: "troubleshooting", label: "Troubleshooting" },
      { id: "changelog", label: "Changelog" },
    ],
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg"
          >
            {isSidebarOpen ? (
              <FiX className="text-xl" />
            ) : (
              <FiMenu className="text-xl" />
            )}
          </button>

          {/* Sidebar */}
          <aside
            className={`fixed lg:sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-all z-40 ${
              isSidebarOpen
                ? "left-4 right-4 lg:left-0 lg:right-auto"
                : "-left-full lg:left-0"
            } lg:w-64 flex-shrink-0`}
          >
            <nav className="space-y-6">
              {sections.map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.id}>
                        <button
                          onClick={() => scrollToSection(link.id)}
                          className="flex items-center text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors w-full text-left py-1"
                        >
                          <FiChevronRight className="text-sm mr-1" />
                          {link.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                href={"/"}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
              >
                ← Back to Home
              </Link>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 lg:p-12">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
