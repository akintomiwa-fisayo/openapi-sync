"use client";

import { useState } from "react";
import Link from "next/link";
import { FiMenu, FiX, FiGithub } from "react-icons/fi";
import ThemeToggle from "./ThemeToggle";
import routes from "@/lib/routes";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/#installation", label: "Installation" },
    { href: "/#quick-start", label: "Quick Start" },
    { href: "/#examples", label: "Examples" },
    { href: routes.docs().url, label: "Documentation" },
  ];

  return (
    <nav className="fixed top-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-50 border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={"/"} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-rose-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">
              OpenAPI Sync
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <ThemeToggle />
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com/akintomiwa-fisayo/openapi-sync"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <FiGithub className="text-xl" />
              <span>GitHub</span>
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            {isOpen ? (
              <FiX className="text-2xl" />
            ) : (
              <FiMenu className="text-2xl" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-gray-200 dark:border-gray-800">
            <div className="pb-3">
              <ThemeToggle />
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com/akintomiwa-fisayo/openapi-sync"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors py-2"
            >
              <FiGithub className="text-xl" />
              <span>GitHub</span>
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
