"use client";

import { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";

const installCommands = [
  { label: "NPM", command: "npm install openapi-sync" },
  { label: "Yarn", command: "yarn add openapi-sync" },
  { label: "PNPM", command: "pnpm add openapi-sync" },
  { label: "Global", command: "npm install -g openapi-sync" },
  { label: "NPX", command: "npx openapi-sync" },
];

export default function Installation() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="installation"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Easy Installation
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get started in seconds with your favorite package manager. Generate
            types, validation schemas, and endpoints automatically.
          </p>
        </div>

        {/* Installation Options */}
        <div className="max-w-4xl mx-auto">
          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {installCommands.map((cmd, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === index
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {cmd.label}
              </button>
            ))}
          </div>

          {/* Command Display */}
          <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-4 text-gray-400 text-sm">terminal</span>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(installCommands[activeTab].command)
                }
                className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
              >
                {copied ? (
                  <>
                    <FiCheck className="text-green-400" />
                    <span className="text-sm text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <FiCopy />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-6">
              <code className="text-lg text-gray-300 font-mono">
                $ {installCommands[activeTab].command}
              </code>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <span className="text-red-600 dark:text-red-400 mr-2">📦</span>
                Package Information
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>
                  • Latest version:{" "}
                  <span className="font-mono text-red-600">4.0.0</span>
                </li>
                <li>• Bundle size: Optimized for production</li>
                <li>• Dependencies: Minimal and well-maintained</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <span className="text-red-600 dark:text-red-400 mr-2">⚡</span>
                Quick Links
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://www.npmjs.com/package/openapi-sync"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:underline"
                  >
                    NPM Package →
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/akintomiwa-fisayo/openapi-sync"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:underline"
                  >
                    GitHub Repository →
                  </a>
                </li>
                <li>
                  <a
                    href="#quick-start"
                    className="text-red-600 hover:underline"
                  >
                    Quick Start Guide →
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
