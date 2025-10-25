"use client";

import { useState } from "react";
import { FiMenu, FiX, FiChevronRight } from "react-icons/fi";
import Link from "next/link";

interface NavLink {
  id: string;
  label: string;
  icon?: string;
  subtext?: string;
}

interface NavSection {
  title: string;
  badge?: string;
  links: NavLink[];
}

const sections: NavSection[] = [
  {
    title: "Getting Started",
    links: [
      { id: "introduction", label: "Introduction" },
      { id: "installation", label: "Installation" },
      { id: "quick-start", label: "Quick Start" },
    ],
  },
  {
    title: "Core Features",
    links: [
      { id: "basic-config", label: "Basic Configuration" },
      { id: "folder-splitting", label: "Folder Splitting" },
      { id: "validation-schemas", label: "Validation Schemas" },
      { id: "custom-code", label: "Custom Code Preservation" },
      { id: "endpoint-filtering", label: "Endpoint Filtering" },
    ],
  },
  {
    title: "🚀 Client Generation",
    badge: "v5.0.0",
    links: [
      {
        id: "client-generation",
        label: "Overview",
        icon: "⭐",
      },
      {
        id: "client-generation",
        label: "Fetch Client",
        subtext: "Native browser API",
      },
      {
        id: "client-generation",
        label: "Axios Client",
        subtext: "Popular HTTP client",
      },
      {
        id: "client-generation",
        label: "React Query",
        subtext: "TanStack Query hooks",
      },
      {
        id: "client-generation",
        label: "SWR Hooks",
        subtext: "Vercel's data fetching",
      },
      {
        id: "client-generation",
        label: "RTK Query",
        subtext: "Redux Toolkit Query",
      },
    ],
  },
  {
    title: "Usage & CLI",
    badge: "v5.0.0",
    links: [
      { id: "cli-usage", label: "CLI Commands" },
      { id: "programmatic-usage", label: "Programmatic API" },
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
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {section.title}
                    </h3>
                    {section.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full">
                        {section.badge}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {section.links.map((link, linkIdx) => (
                      <li key={`${link.id}-${linkIdx}`}>
                        <button
                          onClick={() => scrollToSection(link.id)}
                          className="group flex items-start text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors w-full text-left py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          {link.icon ? (
                            <span className="text-sm mr-2 mt-0.5">
                              {link.icon}
                            </span>
                          ) : (
                            <FiChevronRight className="text-sm mr-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {link.label}
                            </div>
                            {link.subtext && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {link.subtext}
                              </div>
                            )}
                          </div>
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
