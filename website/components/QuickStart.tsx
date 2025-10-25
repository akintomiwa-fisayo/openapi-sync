"use client";

import { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";

const steps = [
  {
    number: "01",
    title: "Create Configuration",
    description: "Create a configuration file in your project root",
    code: `// openapi.sync.json
{
  "refetchInterval": 5000,
  "folder": "./src/api",
  "api": {
    "petstore": "https://petstore3.swagger.io/api/v3/openapi.json"
  }
}`,
    language: "json",
  },
  {
    number: "02",
    title: "Run Sync Command",
    description: "Execute the sync command to generate types and endpoints",
    code: `npx openapi-sync`,
    language: "bash",
  },
  {
    number: "03",
    title: "Use Generated Code",
    description:
      "Import and use the generated types and endpoints in your code",
    code: `import { getPetById } from "./src/api/petstore/endpoints";
import { IPet } from "./src/api/petstore/types";

// Use the endpoint URL
const petUrl = getPetById("123"); // Returns: "/pet/123"

// Use the generated types
const pet: IPet = {
  id: 1,
  name: "Fluffy",
  status: "available"
};`,
    language: "typescript",
  },
];

export default function QuickStart() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section
      id="quick-start"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Quick Start Guide
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get up and running in less than 5 minutes with full TypeScript
            types, fully-typed API clients, and validation schemas—now with
            v5.0.0 improvements
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col lg:flex-row gap-8 items-start"
            >
              {/* Step Info */}
              <div className="lg:w-1/3">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-red-600 to-rose-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Code Block */}
              <div className="lg:w-2/3 w-full">
                <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden">
                  <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                    <span className="text-gray-400 text-sm">
                      {step.language}
                    </span>
                    <button
                      onClick={() => copyToClipboard(step.code, index)}
                      className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2"
                    >
                      {copiedIndex === index ? (
                        <>
                          <FiCheck className="text-green-400" />
                          <span className="text-sm text-green-400">
                            Copied!
                          </span>
                        </>
                      ) : (
                        <>
                          <FiCopy />
                          <span className="text-sm">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-6 overflow-x-auto">
                    <code className="text-sm text-gray-300">{step.code}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Next Steps */}
        <div className="mt-16 bg-gradient-to-br from-red-50 to-rose-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-12 border-2 border-red-200 dark:border-red-900">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            What&apos;s Next?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-950 rounded-lg p-6 shadow-sm">
              <div className="text-3xl mb-3">📚</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Explore Examples
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                Check out detailed examples for every use case
              </p>
              <a
                href="#examples"
                className="text-red-600 hover:underline text-sm font-medium"
              >
                View Examples →
              </a>
            </div>
            <div className="bg-white dark:bg-gray-950 rounded-lg p-6 shadow-sm">
              <div className="text-3xl mb-3">⚙️</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Advanced Configuration
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                Learn about folder splitting, validation, and more
              </p>
              <a
                href="/docs"
                className="text-red-600 hover:underline text-sm font-medium"
              >
                Read Docs →
              </a>
            </div>
            <div className="bg-white dark:bg-gray-950 rounded-lg p-6 shadow-sm">
              <div className="text-3xl mb-3">💬</div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Get Support
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                Join our community or report issues
              </p>
              <a
                href="https://github.com/akintomiwa-fisayo/openapi-sync/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:underline text-sm font-medium"
              >
                GitHub Issues →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
