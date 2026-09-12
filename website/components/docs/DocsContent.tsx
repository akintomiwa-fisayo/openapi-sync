"use client";

import CodeBlock from "./CodeBlock";
import VideoTutorial from "./VideoTutorial";
import { getVideoTutorial } from "@/lib/videoTutorials";
import versionsData from "@/lib/changelog-data.json";

export default function DocsContent() {
  const comingSoonId = "vmUVIqhZrHg";
  return (
    <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-h1:text-gray-900 dark:prose-h1:text-white prose-h2:text-gray-900 dark:prose-h2:text-white prose-h3:text-gray-900 dark:prose-h3:text-white prose-h4:text-gray-900 dark:prose-h4:text-white prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-code:text-gray-900 dark:prose-code:text-white">
      {/* Introduction */}
      <section id="introduction" className="mb-16">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Documentation
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
          OpenAPI Sync is a powerful developer tool that automates the
          generation of TypeScript types, API clients (Fetch, Axios, React
          Query, SWR, RTK Query), runtime validation schemas (Zod, Yup, Joi),
          and endpoint definitions from your OpenAPI specifications in
          real-time.
        </p>
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 dark:border-red-500 p-4 rounded mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-0">
            <strong>Latest Version:</strong> {versionsData[0].version} - {versionsData[0].changes[0]}
          </p>
        </div>

        <VideoTutorial
          videoId={getVideoTutorial("introduction")?.videoId || comingSoonId}
          title={
            getVideoTutorial("introduction")?.title ||
            "Getting Started with OpenAPI Sync"
          }
          description={getVideoTutorial("introduction")?.description}
          duration={getVideoTutorial("introduction")?.duration}
        />
      </section>

      {/* Installation */}
      <section id="installation" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Installation
        </h2>

        <VideoTutorial
          videoId={getVideoTutorial("installation")?.videoId || comingSoonId}
          title={
            getVideoTutorial("installation")?.title || "Installation & Setup"
          }
          description={getVideoTutorial("installation")?.description}
          duration={getVideoTutorial("installation")?.duration}
        />

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Install OpenAPI Sync using your preferred package manager:
        </p>
        <CodeBlock
          code={`# NPM
npm install openapi-sync

# Yarn
yarn add openapi-sync

# PNPM
pnpm add openapi-sync

# Global Installation
npm install -g openapi-sync

# Direct Usage (No Installation)
npx openapi-sync`}
          language="bash"
        />

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-600 dark:border-yellow-500 p-4 rounded mt-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>⚠️ macOS Big Sur Users:</strong> If you encounter an esbuild
            installation error (
            <code className="text-xs bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">
              Symbol not found: _SecTrustCopyCertificateChain
            </code>
            ), please install esbuild@0.17.19 first:{" "}
            <code className="text-xs bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">
              npm install esbuild@0.17.19
            </code>{" "}
            then install openapi-sync. See{" "}
            <a
              href="#troubleshooting"
              className="text-yellow-700 dark:text-yellow-400 hover:underline font-semibold"
            >
              Troubleshooting
            </a>{" "}
            for details.
          </p>
        </div>
      </section>

      {/* Quick Start */}
      <section id="quick-start" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Quick Start
        </h2>

        <VideoTutorial
          videoId={getVideoTutorial("quickStart")?.videoId || comingSoonId}
          title={
            getVideoTutorial("quickStart")?.title || "Quick Start Tutorial"
          }
          description={getVideoTutorial("quickStart")?.description}
          duration={getVideoTutorial("quickStart")?.duration}
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          1. Create Configuration
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Create a configuration file in your project root:
        </p>
        <CodeBlock
          code={`// openapi.sync.json
{
  "refetchInterval": 5000,
  "folder": "./src/api",
  "api": {
    "petstore": "https://petstore3.swagger.io/api/v3/openapi.json"
  }
}`}
          language="json"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          2. Run Sync Command
        </h3>
        <CodeBlock code={`npx openapi-sync`} language="bash" />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          3. Use Generated Code
        </h3>
        <CodeBlock
          code={`import { getPetById } from "./src/api/petstore/endpoints";
import { IPet } from "./src/api/petstore/types";

// Use the endpoint URL
const petUrl = getPetById("123"); // Returns: "/pet/123"

// Use the generated types
const pet: IPet = {
  id: 1,
  name: "Fluffy",
  status: "available"
};`}
          language="typescript"
        />
      </section>

      {/* Presets */}
      <section id="presets" className="mb-16">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-0">
            Presets
          </h2>
          <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-red-200 dark:border-red-800">
            Zero-Config
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Presets bundle opinionated defaults for popular frameworks, HTTP clients, and runtime validation libraries into a single name. Instead of configuring dozens of settings manually, simply select a preset during <code className="text-red-600 dark:text-red-400">npx openapi-sync init</code> or declare <code className="text-red-600 dark:text-red-400">&quot;preset&quot;: &quot;&lt;name&gt;&quot;</code> in your config file. Any explicit configuration you provide will cleanly override preset defaults.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Available Presets
        </h3>

        <div className="overflow-x-auto mb-8">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Preset Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Target Framework / HTTP Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Validation Library
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Features Configured
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Dependencies
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                  <div>react-query-zod</div>
                  <span className="inline-block mt-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    Recommended
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">TanStack React Query v5</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                    Zod
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Typed Query &amp; Mutation hooks, Zod schemas, preserved custom code, operationId naming
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  npm i @tanstack/react-query axios zod
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  react-query-yup
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">TanStack React Query v5</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                    Yup
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Typed Query &amp; Mutation hooks, Yup validation schemas, preserved custom code
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  npm i @tanstack/react-query axios yup
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  swr-zod
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">Vercel SWR</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                    Zod
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  SWR hooks with mutation support (<code className="text-xs">useSWRMutation</code>), Zod schemas, preserved custom code
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  npm i swr axios zod
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  swr-yup
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">Vercel SWR</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                    Yup
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  SWR hooks with mutation support, Yup schemas, preserved custom code
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  npm i swr axios yup
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  axios-zod
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">Axios Client</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                    Zod
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Standalone typed Axios client instance, Zod schemas, preserved custom code
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  npm i axios zod
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  axios-joi
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">Axios Client</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                    Joi
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Standalone typed Axios client, Joi validation schemas (great for Node.js backends)
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  npm i axios joi
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  fetch-zod
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">Native Fetch API</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                    Zod
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Zero-dependency native fetch client, Zod runtime validation
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  npm i zod
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  rtk-query-zod
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">Redux Toolkit Query</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                    Zod
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  RTK Query API slice definitions with <code className="text-xs">fetchBaseQuery</code>, Zod schemas
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  npm i @reduxjs/toolkit react-redux zod
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  next-fetch
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">Next.js (App / Pages router)</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                    Disabled
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Server Components-friendly fetch calls with caching headers, validation disabled for zero bundle bloat
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400 italic whitespace-nowrap">
                  Built-in
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  python-basic
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">Python</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                    N/A
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Generates Python dataclasses / <code className="text-xs">TypedDict</code> types, no TypeScript runtime validation
                </td>
                <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  pip install requests
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          How to Use Presets
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          <strong>1. Via Setup Wizard:</strong> Run <code className="text-red-600 dark:text-red-400">npx openapi-sync init</code> and select your preset. Questions matching the preset will be automatically configured for you.
        </p>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          <strong>2. In JSON Configuration (<code className="text-xs">openapi.sync.json</code>):</strong>
        </p>
        <CodeBlock
          code={`{
  "$schema": "./node_modules/openapi-sync/openapi.sync.schema.json",
  "preset": "react-query-zod",
  "api": {
    "petstore": "https://petstore3.swagger.io/api/v3/openapi.json"
  }
}`}
          language="json"
        />

        <p className="text-gray-600 dark:text-gray-300 mb-4 mt-6">
          <strong>3. In TypeScript (<code className="text-xs">openapi.sync.ts</code>) with <code className="text-xs">defineConfig</code>:</strong>
        </p>
        <CodeBlock
          code={`import { defineConfig } from "openapi-sync";

export default defineConfig({
  preset: "react-query-zod",
  api: {
    petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
  },
  // Overrides: User values always take precedence over preset defaults
  folder: "./src/api",
});`}
          language="typescript"
        />
      </section>

      {/* Basic Configuration */}
      <section id="basic-config" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Basic Configuration
        </h2>

        <VideoTutorial
          videoId={getVideoTutorial("basicConfig")?.videoId || comingSoonId}
          title={
            getVideoTutorial("basicConfig")?.title || "Basic Configuration"
          }
          description={getVideoTutorial("basicConfig")?.description}
          duration={getVideoTutorial("basicConfig")?.duration}
        />

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          OpenAPI Sync supports multiple configuration formats:
        </p>
        <ul className="list-disc pl-6 mb-4 text-gray-600 dark:text-gray-300">
          <li>
            <code>openapi.sync.json</code> - JSON format
          </li>
          <li>
            <code>openapi.sync.ts</code> - TypeScript format
          </li>
          <li>
            <code>openapi.sync.js</code> - JavaScript format
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Configuration Options
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Property
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  preset
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  string
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Pre-configured framework preset (e.g. &quot;react-query-zod&quot;, &quot;swr-zod&quot;). See <a href="#presets" className="text-red-600 dark:text-red-400 hover:underline">Presets</a>.
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  refetchInterval
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  number
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Milliseconds between API refetches (dev only)
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  folder
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  string
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Output directory for generated files
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  api
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Record&lt;string, string&gt;
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Map of API names to OpenAPI spec URLs
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  server
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  number | string
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Server index or custom server URL
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-8">
          Protected Specs &amp; Authentication
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          OpenAPI Sync can fetch specs protected behind Bearer tokens, Basic auth, API keys, or custom headers.
        </p>

        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded mb-6">
          <p className="text-sm text-amber-800 dark:text-amber-200 font-semibold mb-1">
            ⚠️ Important for Developers &amp; AI Agents
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-0">
            Referencing environment variables for credentials <strong>requires using a TypeScript (<code className="text-xs">openapi.sync.ts</code>) or JavaScript (<code className="text-xs">openapi.sync.js</code>) configuration file</strong>. Static JSON (<code className="text-xs">openapi.sync.json</code>) does not evaluate JavaScript runtime expressions like <code className="text-xs">process.env</code> and will cause JSON syntax errors.
          </p>
        </div>

        <CodeBlock
          code={`// openapi.sync.ts
import { defineConfig } from "openapi-sync";

export default defineConfig({
  api: {
    // 1. Bearer Token
    billingApi: {
      url: "https://api.example.com/billing/openapi.json",
      auth: {
        type: "bearer",
        token: process.env.BILLING_API_TOKEN!,
      },
    },

    // 2. Basic Auth
    internalApi: {
      url: "https://internal.example.com/spec.json",
      auth: {
        type: "basic",
        username: process.env.INTERNAL_USER!,
        password: process.env.INTERNAL_PASSWORD!,
      },
    },

    // 3. API Key in Header or Query
    analyticsApi: {
      url: "https://analytics.example.com/openapi.json",
      auth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        value: process.env.ANALYTICS_KEY!,
      },
    },

    // 4. Custom Headers
    customApi: {
      url: "https://api.example.com/spec.json",
      auth: {
        type: "custom",
        headers: {
          "X-Organization-Id": "org_12345",
          "X-Api-Secret": process.env.API_SECRET!,
        },
      },
    },

    // 5. Automatic \${env.VAR} placeholder resolution
    // (Automatically reads from .env, .env.local, or next.config.js)
    envResolvedApi: {
      url: "https://api.example.com/spec.json",
      auth: {
        type: "bearer",
        token: "\${env.SPEC_ACCESS_TOKEN}",
      },
    },
  },
});`}
          language="typescript"
        />
      </section>

      {/* Folder Splitting */}
      <section id="folder-splitting" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Folder Splitting
        </h2>

        <VideoTutorial
          videoId={getVideoTutorial("folderSplitting")?.videoId || comingSoonId}
          title={
            getVideoTutorial("folderSplitting")?.title ||
            "Folder Splitting & Organization"
          }
          description={getVideoTutorial("folderSplitting")?.description}
          duration={getVideoTutorial("folderSplitting")?.duration}
        />

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Organize your generated code into folders based on tags or custom
          logic.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Split by Tags
        </h3>
        <CodeBlock
          code={`folderSplit: {
  byTags: true  // Creates folders like admin/, user/, pet/
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Custom Folder Logic
        </h3>
        <CodeBlock
          code={`folderSplit: {
  customFolder: ({ method, path, tags, operationId }) => {
    // Admin endpoints go to admin folder
    if (tags?.includes("admin")) return "admin";
    
    // API versioning
    if (path.startsWith("/api/v1/")) return "v1";
    if (path.startsWith("/api/v2/")) return "v2";
    
    // Method-based organization
    if (method === "GET") return "read";
    if (method === "POST" || method === "PUT") return "write";
    
    return null; // Use default structure
  }
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Generated Structure
        </h3>
        <CodeBlock
          code={`src/api/
├── petstore/
│   ├── admin/
│   │   ├── endpoints.ts
│   │   └── types.ts
│   ├── user/
│   │   ├── endpoints.ts
│   │   └── types.ts
│   └── pet/
│       ├── endpoints.ts
│       └── types.ts
└── shared.ts`}
          language="text"
        />
      </section>

      {/* Validation Schemas */}
      <section id="validation-schemas" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Validation Schemas
        </h2>

        <VideoTutorial
          videoId={
            getVideoTutorial("validationSchemas")?.videoId || comingSoonId
          }
          title={
            getVideoTutorial("validationSchemas")?.title ||
            "Runtime Validation with Zod, Yup & Joi"
          }
          description={getVideoTutorial("validationSchemas")?.description}
          duration={getVideoTutorial("validationSchemas")?.duration}
        />

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Generate runtime validation schemas using Zod, Yup, or Joi from your
          OpenAPI specification.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Configuration
        </h3>
        <CodeBlock
          code={`validations: {
  library: "zod",  // "zod" | "yup" | "joi"
  generate: {
    query: true,   // Generate query parameter validations
    dto: true      // Generate request body validations
  },
  name: {
    prefix: "I",
    suffix: "Schema",
    useOperationId: true
  }
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Installation
        </h3>
        <CodeBlock
          code={`# For Zod
npm install zod

# For Yup
npm install yup

# For Joi
npm install joi`}
          language="bash"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Usage Example
        </h3>
        <CodeBlock
          code={`import { IAddPetDTOSchema } from "./src/api/petstore/validation";
import { z } from "zod";

// Validate request body
try {
  const validatedData = IAddPetDTOSchema.parse(req.body);
  // Data is now validated and typed
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Validation errors:", error.errors);
  }
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Express Middleware
        </h3>
        <CodeBlock
          code={`import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const validate = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
      }
    }
  };
};

// Usage
import { IAddPetDTOSchema } from "./api/validation";
router.post("/pet", validate(IAddPetDTOSchema), handler);`}
          language="typescript"
        />
      </section>

      {/* Custom Code Preservation */}
      <section id="custom-code" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Custom Code Preservation
        </h2>

        <VideoTutorial
          videoId={getVideoTutorial("customCode")?.videoId || comingSoonId}
          title={
            getVideoTutorial("customCode")?.title || "Custom Code Preservation"
          }
          description={getVideoTutorial("customCode")?.description}
          duration={getVideoTutorial("customCode")?.duration}
        />

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Add your own custom code that will survive when files are regenerated.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Configuration
        </h3>
        <CodeBlock
          code={`customCode: {
  enabled: true,              // Enable custom code preservation
  position: "bottom",         // "top" | "bottom" | "both"
  markerText: "CUSTOM CODE",  // Custom marker text
  includeInstructions: true   // Include helpful instructions
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Usage
        </h3>
        <CodeBlock
          code={`// endpoints.ts (after generation)
export const getPet = (petId: string) => \`/pet/\${petId}\`;

// 🔒 CUSTOM CODE START
// Add your custom code here - it will be preserved
export const legacyGetPet = (id: string) => \`/api/v1/pet/\${id}\`;

export const buildPetUrl = (petId: string, includePhotos: boolean) => {
  const base = getPet(petId);
  return includePhotos ? \`\${base}?include=photos\` : base;
};
// 🔒 CUSTOM CODE END

export const updatePet = (petId: string) => \`/pet/\${petId}\`;`}
          language="typescript"
        />
      </section>

      {/* Endpoint Filtering */}
      <section id="endpoint-filtering" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Endpoint Filtering
        </h2>

        <VideoTutorial
          videoId={
            getVideoTutorial("endpointFiltering")?.videoId || comingSoonId
          }
          title={
            getVideoTutorial("endpointFiltering")?.title ||
            "Endpoint Filtering & Selection"
          }
          description={getVideoTutorial("endpointFiltering")?.description}
          duration={getVideoTutorial("endpointFiltering")?.duration}
        />

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Control which endpoints are included in code generation.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Exclude Endpoints
        </h3>
        <CodeBlock
          code={`endpoints: {
  exclude: {
    // Exclude by tags
    tags: ["deprecated", "internal"],
    
    // Exclude specific endpoints
    endpoints: [
      { path: "/admin/users", method: "DELETE" },
      { regex: "^/internal/.*", method: "GET" },
      { path: "/debug" }  // All methods
    ]
  }
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Include Only Specific Endpoints
        </h3>
        <CodeBlock
          code={`endpoints: {
  include: {
    // Include only public endpoints
    tags: ["public"],
    
    // Include specific endpoints
    endpoints: [
      { path: "/public/users", method: "GET" },
      { regex: "^/public/.*" }
    ]
  }
}`}
          language="typescript"
        />
      </section>

      {/* Python Codegen */}
      <section id="python-generation" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Python Code Generation 🐍
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          In addition to TypeScript, OpenAPI Sync supports generating type-safe Python data structures and endpoint definitions directly from your OpenAPI specifications using native <code>@dataclass</code> models.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Configuration
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Set <code>language: &quot;python&quot;</code> in your API configuration block:
        </p>
        <CodeBlock
          code={`// openapi.sync.json or openapi.sync.ts
export default {
  apis: [
    {
      name: "petstore_py",
      url: "https://petstore.swagger.io/v2/swagger.json",
      destination: "./src/api/petstore_py",
      language: "python", // 🐍 Generates types.py and endpoints.py
      folderSplit: {
        byTags: true
      }
    }
  ]
};`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Generated Python Models (<code>types.py</code>)
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Generated types use standard Python typing (<code>Optional</code>, <code>List</code>, <code>Union</code>, <code>Dict</code>) and <code>@dataclass</code> decorators, with automatic keyword and character sanitization:
        </p>
        <CodeBlock
          code={`from dataclasses import dataclass
from typing import Optional, List, Union, Dict, Any

@dataclass
class Pet:
    """Pet model schema
    
    Attributes:
        id: Unique identifier for the pet
        name: Name of the pet
        category: Pet category
        status: Pet status in the store
    """
    id: Optional[int] = None
    name: Optional[str] = None
    category: Optional["Category"] = None
    status: Optional[str] = None

@dataclass
class GetPetByIdQuery:
    include_deleted: Optional[bool] = None`}
          language="python"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Generated Python Endpoints (<code>endpoints.py</code>)
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Python endpoints include typed URL builder methods, method constants, and docstrings with cURL examples:
        </p>
        <CodeBlock
          code={`class Endpoint:
    def __init__(self, name: str, path: str, method: str, url):
        self.name = name
        self.path = path
        self.method = method
        self.url = url

class Endpoints:
    GET_PET_BY_ID = Endpoint(
        name="getPetById",
        path="/pet/{petId}",
        method="GET",
        url=lambda petId: f"/pet/{petId}"
    )`}
          language="python"
        />
      </section>

      {/* API Client Generation */}
      <section id="client-generation" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          API Client Generation
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Automatically generate fully-typed API clients and hooks for popular
          libraries directly from your OpenAPI specifications.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 dark:border-blue-500 p-4 rounded mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-0">
            Generate clients for Fetch, Axios, React Query, SWR, and RTK Query
            with full TypeScript support!
          </p>
        </div>

        <VideoTutorial
          videoId={
            getVideoTutorial("clientGenerationOverview")?.videoId ||
            comingSoonId
          }
          title={
            getVideoTutorial("clientGenerationOverview")?.title ||
            "API Client Generation Overview"
          }
          description={
            getVideoTutorial("clientGenerationOverview")?.description
          }
          duration={getVideoTutorial("clientGenerationOverview")?.duration}
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Supported Client Types
        </h3>
        <ul className="list-disc pl-6 mb-6 text-gray-600 dark:text-gray-300">
          <li>
            <strong>fetch</strong> - Native browser Fetch API with TypeScript
            types
          </li>
          <li>
            <strong>axios</strong> - Axios client with interceptors and error
            handling
          </li>
          <li>
            <strong>react-query</strong> - React Query/TanStack Query hooks (v4
            & v5)
          </li>
          <li>
            <strong>swr</strong> - SWR hooks for React
          </li>
          <li>
            <strong>rtk-query</strong> - Redux Toolkit Query API slice
          </li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Basic Usage
        </h3>
        <CodeBlock
          code={`# Generate Fetch client
npx openapi-sync generate-client --type fetch

# Generate Axios client
npx openapi-sync generate-client --type axios

# Generate React Query hooks
npx openapi-sync generate-client --type react-query

# Generate SWR hooks
npx openapi-sync generate-client --type swr

# Generate RTK Query API
npx openapi-sync generate-client --type rtk-query`}
          language="bash"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Filter by Tags or Endpoints
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Generate clients for specific endpoints only:
        </p>
        <CodeBlock
          code={`# Filter by tags
npx openapi-sync generate-client --type fetch --tags pets,users

# Filter by endpoint names
npx openapi-sync generate-client --type axios --endpoints getPetById,createPet

# Generate for specific API
npx openapi-sync generate-client --type react-query --api petstore

# Specify output directory
npx openapi-sync generate-client --type swr --output ./src/clients

# Set base URL
npx openapi-sync generate-client --type fetch --base-url https://api.example.com`}
          language="bash"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          React Query Example
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Complete example using React Query hooks:
        </p>
        <CodeBlock
          code={`// 1. Generate the client
// npx openapi-sync generate-client --type react-query

// 2. Setup in your app
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import apiClient from "./api/petstore/client/client";

// Configure API client
apiClient.updateConfig({
  baseURL: "https://api.example.com",
  headers: {
    Authorization: "Bearer your-auth-token",
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourComponent />
    </QueryClientProvider>
  );
}

// 3. Use in components
import { useGetPetById, useCreatePet } from "./api/petstore/client/hooks";

function PetDetails({ petId }: { petId: string }) {
  // Query hook for GET requests
  const { data, isLoading, error } = useGetPetById({ petId });

  // Mutation hook for POST/PUT/PATCH/DELETE
  const createPet = useCreatePet({
    onSuccess: (newPet) => {
      console.log("Pet created:", newPet);
    },
  });

  const handleCreate = () => {
    createPet.mutate({
      data: {
        name: "Fluffy",
        species: "cat",
      },
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{data?.name}</h1>
      <p>Status: {data?.status}</p>
      <button onClick={handleCreate}>Create New Pet</button>
    </div>
  );
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Fetch Client Example
        </h3>
        <CodeBlock
          code={`import { setApiConfig, getPetById, createPet } from "./api/petstore/client";

// Configure the client
setApiConfig({
  baseURL: "https://api.example.com",
  auth: { token: "your-token" },
  headers: {
    "X-Custom-Header": "value",
  },
});

// Use the client
async function fetchPet(petId: string) {
  try {
    const pet = await getPetById({ petId });
    console.log("Pet:", pet);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("API Error:", error.statusCode, error.response);
    }
  }
}

async function addNewPet() {
  const newPet = await createPet({
    data: {
      name: "Max",
      species: "dog",
      age: 3,
    },
  });
  console.log("Created:", newPet);
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Axios Client Example
        </h3>
        <CodeBlock
          code={`import apiClient from "./api/petstore/client";

// Configure the client
apiClient.updateConfig({
  baseURL: "https://api.example.com",
  timeout: 10000,
  headers: {
    "X-App-Version": "1.0.0",
    Authorization: "Bearer your-auth-token",
  },
});

// Use the client
async function example() {
  // GET request
  const pet = await apiClient.getPetById({ petId: "123" });
  
  // POST request
  const newPet = await apiClient.createPet({
    data: {
      name: "Buddy",
      species: "dog",
    },
  });
  
  // PUT request
  await apiClient.updatePet(
    { petId: "123" },
    { name: "Buddy Updated" }
  );
  
  // DELETE request
  await apiClient.deletePet({ petId: "123" });
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          SWR Hooks Example
        </h3>
        <CodeBlock
          code={`import { useGetPetById, useCreatePet } from "./api/petstore/client/hooks";

function PetProfile({ petId }: { petId: string }) {
  // SWR automatically handles caching, revalidation, and more
  const { data, error, isLoading, mutate } = useGetPetById({ petId });

  const { trigger, isMutating } = useCreatePet();

  const handleCreate = async () => {
    try {
      const newPet = await trigger({
        arg: {
          data: {
            name: "Charlie",
            species: "cat",
          },
        },
      });
      // Revalidate the pet list
      mutate();
    } catch (err) {
      console.error("Failed to create pet:", err);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading pet</div>;

  return (
    <div>
      <h2>{data?.name}</h2>
      <button onClick={handleCreate} disabled={isMutating}>
        {isMutating ? "Creating..." : "Create New Pet"}
      </button>
    </div>
  );
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          RTK Query Example
        </h3>
        <CodeBlock
          code={`// 1. Setup store
import { configureStore } from "@reduxjs/toolkit";
import { apiApi } from "./api/petstore/client/api";

export const store = configureStore({
  reducer: {
    [apiApi.reducerPath]: apiApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiApi.middleware),
});

// 2. Use in components
import { useGetPetByIdQuery, useCreatePetMutation } from "./api/petstore/client/api";

function PetCard({ petId }: { petId: string }) {
  const { data, isLoading, error } = useGetPetByIdQuery({ 
    params: { petId } 
  });
  
  const [createPet, { isLoading: isCreating }] = useCreatePetMutation();

  const handleCreate = async () => {
    try {
      await createPet({
        data: {
          name: "Luna",
          species: "cat",
        },
      }).unwrap();
      alert("Pet created!");
    } catch (err) {
      console.error("Failed:", err);
    }
  };

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error!</div>}
      {data && (
        <div>
          <h3>{data.name}</h3>
          <p>{data.species}</p>
        </div>
      )}
      <button onClick={handleCreate} disabled={isCreating}>
        Create Pet
      </button>
    </div>
  );
}`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Generated File Structure
        </h3>
        <CodeBlock
          code={`api/
└── petstore/
    ├── client/
    │   ├── client.ts      # Base API client
    │   ├── hooks.ts       # React Query/SWR hooks
    │   ├── api.ts         # RTK Query API (if applicable)
    │   ├── index.ts       # Exports
    │   └── README.md      # Usage documentation
    ├── endpoints.ts
    ├── types/
    │   ├── index.ts
    │   └── shared.ts
    └── validations.ts`}
          language="text"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Configuration Options
        </h3>
        <CodeBlock
          code={`// openapi.sync.ts
import { IConfig } from "openapi-sync/types";

const config: IConfig = {
  folder: "./src/api",
  api: {
    petstore: "https://petstore3.swagger.io/api/v3/openapi.json",
  },
  // Client generation configuration
  clientGeneration: {
    enabled: true,
    type: "react-query",
    baseURL: "https://api.example.com",
    tags: ["pets", "users"],  // Optional: filter by tags
    endpoints: ["getPetById"], // Optional: specific endpoints
    auth: {
      type: "bearer",
      in: "header",
    },
    errorHandling: {
      generateErrorClasses: true,
    },
    reactQuery: {
      version: 5,
      mutations: true,
      infiniteQueries: false,
    },
  },
};

export default config;`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Custom Code Preservation
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Generated clients preserve your custom code during regeneration:
        </p>
        <CodeBlock
          code={`// client.ts (Generated)

// Auto-generated client code...

// ============================================================
// 🔒 CUSTOM CODE START
// Add your custom code below this line
// This section will be preserved during regeneration
// ============================================================

// Your custom helper functions
export function buildPaginatedUrl(
  baseUrl: string,
  page: number,
  limit: number
) {
  return \`\${baseUrl}?page=\${page}&limit=\${limit}\`;
}

// Custom interceptors
export function setupCustomInterceptors() {
  // Your custom logic
}

// 🔒 CUSTOM CODE END
// ============================================================`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          CLI Options Reference
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Option
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Example
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  --type, -t
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Client type to generate (required)
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  fetch, axios, react-query, swr, rtk-query
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  --api, -a
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Specific API from config
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  --api petstore
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  --tags
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Filter by endpoint tags
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  --tags pets,users
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  --endpoints, -e
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Filter by endpoint names
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  --endpoints getPetById,createPet
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  --output, -o
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Output directory
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  --output ./src/clients
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                  --base-url, -b
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  Base URL for requests
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  --base-url https://api.example.com
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* v5.0.0 Client Improvements */}
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600 dark:border-green-500 p-4 rounded mb-6 mt-8">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-0">
            <strong>New in v5.0.0:</strong> All client generators now include
            comprehensive inline documentation, better ESLint compliance, and
            improved folder splitting support!
          </p>
        </div>

        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">
          RTK Query Enhancements (v5.0.0)
        </h3>

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Simplified Redux Store Setup
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          When using folder splitting, RTK Query now generates an{" "}
          <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            apis.ts
          </code>{" "}
          file with a helper object that makes Redux store configuration
          incredibly simple:
        </p>
        <CodeBlock
          code={`// Before v5.0.0 (Complex setup)
import { configureStore } from '@reduxjs/toolkit';
import { petsApi } from './pets/api';
import { usersApi } from './users/api';
import { ordersApi } from './orders/api';

export const store = configureStore({
  reducer: {
    [petsApi.reducerPath]: petsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(petsApi.middleware)
      .concat(usersApi.middleware)
      .concat(ordersApi.middleware),
});`}
          language="typescript"
        />
        <CodeBlock
          code={`// After v5.0.0 (Simple setup!)
import { configureStore } from '@reduxjs/toolkit';
import { setupApiStore } from './api/petstore/apis';

export const store = configureStore({
  reducer: setupApiStore.reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(setupApiStore.middleware),
});

// That's it! All API slices are automatically configured ✨`}
          language="typescript"
        />

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Unique Reducer Paths
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Each API slice now has a unique{" "}
          <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            reducerPath
          </code>{" "}
          based on its folder name, preventing conflicts:
        </p>
        <CodeBlock
          code={`// Generated pets/api.ts
const petsApi = createApi({
  reducerPath: 'petsApi',  // ✅ Unique!
  // ...
});

// Generated users/api.ts
const usersApi = createApi({
  reducerPath: 'usersApi',  // ✅ Unique!
  // ...
});

// No more "Duplicate property" TypeScript errors!`}
          language="typescript"
        />

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Default Exports for Better Imports
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          API slices now export as default, making imports cleaner:
        </p>
        <CodeBlock
          code={`// Clean default import
import petsApi from './pets/api';
import { useGetPetsQuery } from './pets/api';

// Or use the aggregated apis.ts
import { petsApi, useGetPetsQuery } from './apis';`}
          language="typescript"
        />

        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">
          SWR Improvements (v5.0.0)
        </h3>

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Fixed Mutation Type Errors
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          SWR mutation hooks now have correct TypeScript types, fixing the
          double-nesting issue:
        </p>
        <CodeBlock
          code={`// v5.0.0 - Correct types! ✅
export function useCreatePet(
  config?: SWRMutationConfiguration<
    Pet,
    Error,
    string,
    { data: PetRequest }  // Correct: single level
  >
) {
  return useSWRMutation(
    'createPet',
    async (_, { arg }: { arg: { data: PetRequest } }) => {
      return apiClient.createPet(arg);
    },
    config
  );
}

// Usage - works perfectly!
const { trigger } = useCreatePet();
await trigger({ arg: { data: { name: 'Fluffy' } } });`}
          language="typescript"
        />

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Comprehensive Inline Documentation
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Every generated SWR hooks file now includes 230+ lines of usage
          examples and patterns:
        </p>
        <CodeBlock
          code={`/**
 * SWR Hooks - Complete Usage Guide
 * 
 * ## Quick Start
 * 
 * 1. Configure SWR globally:
 * \`\`\`typescript
 * <SWRConfig value={{ revalidateOnFocus: false }}>
 *   {children}
 * </SWRConfig>
 * \`\`\`
 * 
 * ## Examples
 * 
 * ### Reading Data (GET)
 * \`\`\`typescript
 * const { data, error, isLoading } = useGetPets();
 * \`\`\`
 * 
 * ### Creating Data (POST)
 * \`\`\`typescript
 * const { trigger, isMutating } = useCreatePet();
 * await trigger({ arg: { data: { name: 'Luna' } } });
 * \`\`\`
 * 
 * ### Optimistic Updates
 * \`\`\`typescript
 * revalidate({ ...data, name: newName }, false);
 * await trigger({ arg: { ... } });
 * await revalidate(); // Sync with server
 * \`\`\`
 * 
 * [... 200+ more lines of examples ...]
 */`}
          language="typescript"
        />

        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">
          Fetch Client Fixes (v5.0.0)
        </h3>

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Fixed Naming Conflicts
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Endpoint imports are now automatically aliased to prevent naming
          conflicts:
        </p>
        <CodeBlock
          code={`// Generated imports (aliased to avoid conflicts)
import {
  getPets as getPets_endpoint,
  getPetById as getPetById_endpoint,
  createPet as createPet_endpoint,
} from './endpoints';

// Generated functions (no conflict!)
export async function getPets() {
  const _url = getPets_endpoint;  // Uses aliased import
  return fetchAPI(_url, { method: 'GET' });
}

export async function getPetById(params: { url: { id: string } }) {
  const _url = getPetById_endpoint(params.url.id);  // Uses aliased import
  return fetchAPI(_url, { method: 'GET' });
}`}
          language="typescript"
        />

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          ESLint-Compliant Default Exports
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Default exports now use named variables, satisfying ESLint rules:
        </p>
        <CodeBlock
          code={`// v5.0.0 - ESLint compliant! ✅
const apiClient = {
  setApiConfig,
  getPets,
  getPetById,
  createPet,
};

export default apiClient;

// No more "Assign object to variable" ESLint warnings!`}
          language="typescript"
        />

        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">
          File Organization Improvements (v5.0.0)
        </h3>

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Non-Folder-Split Mode
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          When folder splitting is disabled, files are now generated directly at
          the root level:
        </p>
        <CodeBlock
          code={`api/
└── petstore/
    ├── clients.ts       # All API client functions
    ├── hooks.ts         # All React Query/SWR hooks  
    ├── endpoints.ts     # Endpoint definitions
    ├── types.ts         # TypeScript types
    └── validations.ts   # Validation schemas

# Clean, simple structure for smaller APIs!`}
          language="text"
        />

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Folder-Split Mode
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          With folder splitting, each tag gets its own folder with complete
          isolation:
        </p>
        <CodeBlock
          code={`api/
└── petstore/
    ├── clients.ts       # Aggregates all clients (Fetch/Axios)
    ├── hooks.ts         # Aggregates all hooks (React Query/SWR)
    ├── apis.ts          # Aggregates all APIs (RTK Query) + setupApiStore
    ├── pets/
    │   ├── client.ts    # Pet-specific client
    │   ├── hooks.ts     # Pet-specific hooks
    │   ├── api.ts       # Pet-specific RTK Query API
    │   ├── types.ts     # Pet-specific types
    │   └── endpoints.ts # Pet-specific endpoints
    └── users/
        ├── client.ts
        ├── hooks.ts
        ├── api.ts
        ├── types.ts
        └── endpoints.ts

# Perfect for large APIs with many endpoints!`}
          language="text"
        />

        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 dark:border-blue-500 p-4 rounded mt-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            <strong>💡 Migration Tip:</strong> To get all these improvements,
            simply regenerate your clients:
          </p>
          <CodeBlock
            code={`npx openapi-sync generate-client --type [your-type]`}
            language="bash"
          />
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 mb-0">
            All improvements are backwards compatible - your existing code will
            continue to work!
          </p>
        </div>
      </section>

      {/* CLI Usage */}
      <section id="cli-usage" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          CLI Usage
        </h2>

        <VideoTutorial
          videoId={getVideoTutorial("cliUsage")?.videoId || comingSoonId}
          title={
            getVideoTutorial("cliUsage")?.title || "CLI Commands & Options"
          }
          description={getVideoTutorial("cliUsage")?.description}
          duration={getVideoTutorial("cliUsage")?.duration}
        />

        <CodeBlock
          code={`# Sync API types and endpoints
npx openapi-sync

# Generate API client
npx openapi-sync generate-client --type react-query

# Run with custom refetch interval
npx openapi-sync --refreshinterval 30000
npx openapi-sync -ri 30000

# Get help
npx openapi-sync --help
npx openapi-sync generate-client --help`}
          language="bash"
        />

        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">
          Non-Interactive Project Initialization
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Initialize openapi-sync non-interactively without stdin prompts — ideal for CI/CD pipelines and AI agent automation. Configure spec authentication directly during initialization:
        </p>
        <CodeBlock
          code={`# Standard non-interactive setup
npx openapi-sync init --no-interactive \\
  --api-name petstore \\
  --api-url https://petstore3.swagger.io/api/v3/openapi.json \\
  --output-folder ./src/api \\
  --client-type react-query \\
  --validation-library zod \\
  --config-format typescript \\
  --json

# Initialize with authentication for protected specs
npx openapi-sync init --no-interactive \\
  --api-name backend \\
  --api-url https://api.example.com/openapi.json \\
  --auth-type bearer \\
  --auth-token '\${env.SPEC_TOKEN}' \\
  --preset react-query-zod \\
  --run-sync \\
  --json`}
          language="bash"
        />

        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">
          Zero-Config CLI Execution &amp; Config Overrides
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          You can run openapi-sync completely from terminal scripts without creating any configuration file on disk. Pass any property supported by the configuration file via CLI flags:
        </p>
        <CodeBlock
          code={`# Zero-config sync with preset
npx openapi-sync --api-url https://petstore3.swagger.io/api/v3/openapi.json --preset react-query-zod --folder ./src/api

# Zero-config sync with protected spec
npx openapi-sync --api-url https://api.example.com/openapi.json --auth-type bearer --auth-token "$MY_TOKEN" --preset next-fetch

# Multiple APIs via CLI
npx openapi-sync --api users=https://api.example.com/users.json --api billing=https://api.example.com/billing.json --preset axios-zod

# Override existing disk config properties on-the-fly
npx openapi-sync --folder ./dist/api --validation-lib yup --no-docs

# Raw JSON configuration via CLI
npx openapi-sync --config-json '{"api":{"main":"https://api.example.com/spec.json"},"preset":"react-query-zod"}'`}
          language="bash"
        />

        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 mt-8">
          CLI Improvements
        </h3>

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          CLI Arguments Override Config
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          CLI options now correctly override configuration file settings:
        </p>
        <CodeBlock
          code={`# Config file says type: "fetch"
# But CLI argument takes precedence:
npx openapi-sync generate-client --type rtk-query

# Result: Generates RTK Query (not Fetch) ✅

# This works for all options:
npx openapi-sync generate-client \\
  --type swr \\
  --base-url https://api.example.com \\
  --tags pets,users

# CLI values override config values!`}
          language="bash"
        />

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Streamlined Interactive Setup
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          The interactive setup wizard is now simpler - selecting folder
          splitting automatically enables tag-based organization:
        </p>
        <CodeBlock
          code={`# npx openapi-sync init

? Organize generated code into folders by OpenAPI tags? Yes
# ✅ Automatically enables byTags: true
# (No extra question needed!)

? Generate API client code? Yes
? Which client type would you like? React Query
# ... continues with setup`}
          language="bash"
        />

        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Machine-Readable Output (CI/CD &amp; Agent-Safe)
        </h4>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          All commands support <code>--json</code> for structured stdout output
          and <code>--silent</code> to suppress all logs. Ideal for scripting,
          CI pipelines, and AI agent integrations:
        </p>
        <CodeBlock
          code={`# Sync and get a structured JSON result
npx openapi-sync --json

# Validate config without writing files
npx openapi-sync validate --json

# List all endpoints as JSON
npx openapi-sync list-endpoints --json

# Page/search endpoint discovery for large specs
npx openapi-sync list-endpoints --api petstore --path-contains pet --limit 10 --offset 0 --json

# Inspect one endpoint in full detail
npx openapi-sync get-endpoint --api petstore --operation-id getPetById --json

# Read one generated TypeScript declaration
npx openapi-sync read-type --api petstore --type-name Pet --json

# Generate client with JSON output (great for agents)
npx openapi-sync generate-client --type react-query --json

# Silent mode (no stdout noise) — exit code tells you the result
npx openapi-sync --silent && echo "Sync OK!"`}
          language="bash"
        />
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 dark:border-blue-500 p-4 rounded mt-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Tip:</strong> The <code>--json</code> flag implies{" "}
            <code>--silent</code>. The process exit code is{" "}
            <code>0</code> on success and <code>1</code> on failure, so it
            works naturally in shell pipelines and CI checks.
          </p>
        </div>
      </section>

      {/* Diagnostic Doctor */}
      <section id="doctor" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <span>🩺</span> Diagnostic Doctor
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          The <code>doctor</code> command provides automated self-healing and environment diagnostics. It audits your configuration syntax, specification reachability over the network, installed validation peer dependencies (Zod, Yup, Joi), schema cache integrity, and filesystem write permissions.
        </p>

        <CodeBlock
          code={`# Run the human-readable diagnostic report
npx openapi-sync doctor

# Machine-readable output for CI/CD checks or AI agents
npx openapi-sync doctor --json`}
          language="bash"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Automated Health Checks Performed
        </h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-300 mb-6">
          <li><strong>Configuration File:</strong> Verifies that <code>openapi.sync.ts</code>, <code>.js</code>, or <code>.json</code> exists and parses without schema errors.</li>
          <li><strong>Spec Reachability:</strong> Pings remote URLs with configured authentication or verifies local spec file existence, confirming valid HTTP 200 responses and reachable paths.</li>
          <li><strong>Peer Dependencies:</strong> Checks whether your configured validation library (<code>zod</code>, <code>yup</code>, or <code>joi</code>) is installed in <code>node_modules</code> and reports version status.</li>
          <li><strong>Endpoint Cache:</strong> Inspects internal schema store cache integrity to ensure fast subsequent builds.</li>
          <li><strong>Folder Permissions:</strong> Verifies write access to the configured output directory (e.g. <code>./src/api</code>).</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Structured JSON Health Report
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-3">
          When run with <code>--json</code>, <code>doctor</code> outputs a pure JSON object ideal for pre-flight pipeline checks and AI assistants:
        </p>
        <CodeBlock
          code={`{
  "healthy": true,
  "checks": [
    { "name": "Configuration", "status": "ok", "message": "Valid openapi.sync.ts found" },
    { "name": "Spec Reachability: petstore", "status": "ok", "message": "HTTP 200 OK (20 endpoints discovered)" },
    { "name": "Peer Dependency: zod", "status": "ok", "message": "zod v3.23.8 installed" },
    { "name": "Output Directory", "status": "ok", "message": "./src/api is writable" }
  ],
  "recommendations": []
}`}
          language="json"
        />
      </section>

      {/* Stale File Purge */}
      <section id="purge" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <span>🧹</span> Stale File Purge
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          As your API evolves, endpoints and data models are frequently renamed or deprecated. Standard code generators leave obsolete files behind, causing dead code and broken imports. <code>openapi-sync</code> maintains a manifest at <code>.openapi-sync/manifest.json</code> to track all generated files, allowing you to safely detect and clean up orphaned files.
        </p>

        <CodeBlock
          code={`# Preview stale files without deleting anything
npx openapi-sync purge --dry-run

# Output preview as machine-readable JSON
npx openapi-sync purge --dry-run --json

# Delete stale files without interactive confirmation (CI & Agent-safe)
npx openapi-sync purge --yes

# Limit stale cleanup to a specific configured API
npx openapi-sync purge --api petstore --yes`}
          language="bash"
        />

        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-600 dark:border-emerald-500 p-4 rounded mt-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>💡 Pro-Tip:</strong> Run <code>npx openapi-sync purge --dry-run --json</code> inside your CI pipeline to alert developers when previously generated API files need pruning.
          </p>
        </div>
      </section>

      {/* Programmatic Usage */}
      <section id="programmatic-usage" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Programmatic Usage
        </h2>

        <VideoTutorial
          videoId={
            getVideoTutorial("programmaticUsage")?.videoId || comingSoonId
          }
          title={
            getVideoTutorial("programmaticUsage")?.title ||
            "Programmatic API Usage"
          }
          description={getVideoTutorial("programmaticUsage")?.description}
          duration={getVideoTutorial("programmaticUsage")?.duration}
        />

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          <code>openapi-sync</code> exports a complete suite of programmatic TypeScript functions for full automation in Node.js, scripts, build tools, and AI agents.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Synchronize &amp; Generate Clients
        </h3>
        <CodeBlock
          code={`import { Init, GenerateClient } from "openapi-sync";

// 1. Sync types, endpoints, and validation schemas
const syncResult = await Init({ silent: true });
if (syncResult.success) {
  console.log("Files written:", syncResult.filesWritten);
  console.log("Endpoints synchronized:", syncResult.endpointCount);
}

// 2. Generate a typed API client programmatically
const clientResult = await GenerateClient({
  type: "react-query", // "fetch" | "axios" | "react-query" | "swr" | "rtk-query"
  silent: true,
});
console.log("Client files written:", clientResult.filesWritten);`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Inspect, Query &amp; Validate Without Regenerating
        </h3>
        <CodeBlock
          code={`import {
  ValidateConfig,
  ListEndpoints,
  GetEndpointDetails,
  ReadGeneratedType,
} from "openapi-sync";

// Pre-flight validation (no files written)
const validation = await ValidateConfig({ silent: true });
console.log("Config valid?", validation.valid);

// Search & paginate endpoints
const endpoints = await ListEndpoints({
  apiName: "petstore",
  pathContains: "pet",
  limit: 10,
  offset: 0,
  silent: true,
});
console.log("Found endpoints:", endpoints.petstore);

// Deep inspection of a single endpoint
const detail = await GetEndpointDetails({
  apiName: "petstore",
  operationId: "getPetById",
  silent: true,
});
console.log("Method:", detail.endpoint.method);
console.log("Parameters:", detail.endpoint.parameters);

// Read exact generated TypeScript interface
const typeDecl = await ReadGeneratedType({
  apiName: "petstore",
  typeName: "Pet",
  silent: true,
});
console.log(typeDecl);`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Diagnostic Health Checks &amp; Stale Cleanup
        </h3>
        <CodeBlock
          code={`import { Doctor, Purge } from "openapi-sync";

// 1. Run diagnostic health checks
const report = await Doctor({ silent: true });
console.log("System healthy?", report.healthy);
if (!report.healthy) {
  console.warn("Recommendations:", report.recommendations);
}

// 2. Detect and purge stale generated files
const purgeReport = await Purge({ yes: true, silent: true });
console.log("Removed stale files:", purgeReport.purged);`}
          language="typescript"
        />
      </section>

      {/* MCP Integration */}
      <section id="mcp-integration" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          AI Agent Integration (MCP)
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          OpenAPI Sync ships with a built-in{" "}
          <strong>Model Context Protocol (MCP) server</strong>. This lets AI
          assistants like Claude Desktop, Cursor, GitHub Copilot, and other
          MCP-compatible agents safely call sync operations, browse endpoints
          with pagination and path filters, inspect deep endpoint details, and
          read generated TypeScript declarations — no shell scripts or custom
          wrappers needed.
        </p>

        <div className="bg-violet-50 dark:bg-violet-900/20 border-l-4 border-violet-600 dark:border-violet-500 p-4 rounded mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>🤖 How it works:</strong> Start the MCP server with{" "}
            <code>npx openapi-sync-mcp</code> and configure your AI client to
            connect to it. The agent can then trigger syncs, generate clients,
            validate configs, and list endpoints — all with full type-safety.
          </p>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Setup for Claude Desktop
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Add the following to your Claude Desktop configuration file at{" "}
          <code>
            ~/Library/Application Support/Claude/claude_desktop_config.json
          </code>
          :
        </p>
        <CodeBlock
          code={`{
  "mcpServers": {
    "openapi-sync": {
      "command": "npx",
      "args": ["-y", "openapi-sync-mcp"],
      "cwd": "/path/to/your/project"
    }
  }
}`}
          language="json"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Setup for Cursor
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Create or update <code>.cursor/mcp.json</code> in your project root:
        </p>
        <CodeBlock
          code={`{
  "mcpServers": {
    "openapi-sync": {
      "command": "npx",
      "args": ["-y", "openapi-sync-mcp"],
      "cwd": "\${workspaceFolder}"
    }
  }
}`}
          language="json"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Available MCP Tools
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Once connected, the agent has access to these tools:
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tool
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {[
                ["openapi_sync_read_config", "Read and parse the project's openapi-sync configuration file without executing sync"],
                ["openapi_sync_sync", "Run the main sync command — generates types, clients, and endpoints"],
                ["openapi_sync_validate", "Validate your config and OpenAPI specs without writing any files"],
                ["openapi_sync_doctor", "Run diagnostic health checks on config, specs, peer dependencies, cache, and permissions"],
                ["openapi_sync_list_endpoints", "List discovered endpoints with tags, pagination, path filtering, and optional cache reuse"],
                ["openapi_sync_get_endpoint_details", "Return the full stored schema for a single endpoint by operationId or name"],
                ["openapi_sync_read_generated_type", "Read the exact generated TypeScript interface or type declaration"],
                ["openapi_sync_generate_client", "Generate a typed API client for Fetch, Axios, React Query, SWR, or RTK Query"],
                ["openapi_sync_init", "Non-interactively initialise a new openapi-sync configuration"],
              ].map(([tool, desc]) => (
                <tr key={tool} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-violet-700 dark:text-violet-300">{tool}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Example Agent Prompt
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Once the MCP server is running, you can ask your AI agent:
        </p>
        <CodeBlock
          code={`# Ask Claude or Cursor:
"Sync my OpenAPI types, list the pet endpoints, inspect getPetById, and generate a React Query client"

# The agent will:
# 1. Call 'openapi_sync_sync' to pull the latest spec
# 2. Call 'openapi_sync_list_endpoints' with pagination/path filters
# 3. Call 'openapi_sync_get_endpoint_details' for the selected endpoint
# 4. Call 'openapi_sync_read_generated_type' for the related type
# 5. Call 'openapi_sync_generate_client' with --type react-query
# 6. Report back the result as structured JSON`}
          language="bash"
        />
      </section>

      {/* Error Code Reference */}
      <section id="error-codes" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <span>⚠️</span> Error Code Reference
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Every error emitted by <code>openapi-sync</code> belongs to a typed subclass of <code>OpenApiSyncError</code> with a stable machine-readable <code>code</code> string. Whether parsing CLI JSON output or handling errors in TypeScript, applications and AI agents can deterministically branch on error types:
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Error Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Error Class
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Description &amp; Suggested Remediation
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {[
                ["CONFIG_NOT_FOUND", "ConfigNotFoundError", "No openapi.sync config file found in cwd. Run `npx openapi-sync init -y` or pass `--api-url`."],
                ["CONFIG_PARSE_FAILED", "ConfigParseError", "Configuration file failed to evaluate or parse. Verify TypeScript syntax or ensure referenced environment variables exist."],
                ["CONFIG_INVALID", "ConfigValidationError", "Configuration contains invalid or missing required properties (e.g. empty `api` map)."],
                ["SPEC_FETCH_FAILED", "SpecFetchError", "Network error, DNS failure, or HTTP 401/403/404 response. Verify URL or supply credentials via `--auth-type`."],
                ["SPEC_READ_FAILED", "SpecReadError", "Local OpenAPI specification file could not be found or read. Check relative file path in configuration."],
                ["SPEC_PARSE_FAILED", "SpecParseError", "Specification is not a valid OpenAPI 3.x or Swagger 2.0 document. Verify syntax with Swagger Editor."],
                ["GENERATION_FAILED", "GenerationError", "Failed to write generated files to disk. Ensure the destination directory has write permissions."],
                ["UNKNOWN_API", "UnknownApiError", "Target API specified via `--api <name>` was not found in your configuration file."],
              ].map(([code, cls, desc]) => (
                <tr key={code} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-red-600 dark:text-red-400 font-semibold">{code}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300 text-xs">{cls}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Troubleshooting */}
      <section id="troubleshooting" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Troubleshooting
        </h2>

        <VideoTutorial
          videoId={getVideoTutorial("troubleshooting")?.videoId || comingSoonId}
          title={
            getVideoTutorial("troubleshooting")?.title ||
            "Common Issues & Troubleshooting"
          }
          description={getVideoTutorial("troubleshooting")?.description}
          duration={getVideoTutorial("troubleshooting")?.duration}
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Configuration File Not Found
        </h3>
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 dark:border-red-500 p-4 rounded mb-4">
          <p className="text-sm text-gray-900 dark:text-white mb-2">
            <strong>Error:</strong> No config found
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Solution:</strong> Ensure you have one of these files in
            your project root:
            <code className="text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-800 px-1 rounded">
              openapi.sync.json
            </code>
            ,{" "}
            <code className="text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-800 px-1 rounded">
              openapi.sync.ts
            </code>
            , or{" "}
            <code className="text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-800 px-1 rounded">
              openapi.sync.js
            </code>
          </p>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Network Timeout Errors
        </h3>
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 dark:border-red-500 p-4 rounded mb-4">
          <p className="text-sm text-gray-900 dark:text-white mb-2">
            <strong>Error:</strong> timeout of 60000ms exceeded
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Solution:</strong> The tool includes automatic retry with
            exponential backoff. Check your internet connection and verify the
            OpenAPI spec URL is accessible.
          </p>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          TypeScript Compilation Errors
        </h3>
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 dark:border-red-500 p-4 rounded mb-4">
          <p className="text-sm text-gray-900 dark:text-white mb-2">
            <strong>Error:</strong> Cannot find module
            &apos;./src/api/petstore/types&apos;
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Solution:</strong> Ensure the sync process completed
            successfully and check that the folder path in config is correct.
          </p>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          macOS Big Sur (11.x) - esbuild Installation Error
        </h3>
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 dark:border-red-500 p-4 rounded mb-4">
          <p className="text-sm text-gray-900 dark:text-white mb-2">
            <strong>Error:</strong> dyld: Symbol not found:
            _SecTrustCopyCertificateChain
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            <strong>Cause:</strong> The default esbuild version requires macOS
            12.0+ APIs that aren&apos;t available in Big Sur (darwin 20.x).
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            <strong>Solution 1:</strong> Install compatible esbuild first:
          </p>
          <CodeBlock
            code={`# Install compatible esbuild first
npm install esbuild@0.17.19

# Then install openapi-sync
npm install openapi-sync`}
            language="bash"
          />
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 mb-2">
            <strong>Solution 2:</strong> Add an override to your package.json:
          </p>
          <CodeBlock
            code={`{
  "overrides": {
    "esbuild": "0.17.19"
  }
}`}
            language="json"
          />
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-3">
            <strong>Note:</strong> This issue only affects macOS Big Sur. Users
            on macOS 12+ are not affected and will get the latest esbuild
            version automatically.
          </p>
        </div>
      </section>

      {/* API Reference */}
      <section id="api-reference" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          API Reference
        </h2>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Init(options?: InitOptions)
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Initializes OpenAPI sync with the specified configuration.
        </p>
        <CodeBlock
          code={`import { Init } from "openapi-sync";

await Init({ 
  refetchInterval: 10000 
});`}
          language="typescript"
        />

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">
          Exported Types
        </h3>
        <CodeBlock
          code={`import {
  IConfig,
  IOpenApiSpec,
  IOpenApSchemaSpec,
  IConfigReplaceWord,
  IConfigExclude,
  IConfigInclude,
  IConfigDoc
} from "openapi-sync/types";`}
          language="typescript"
        />
      </section>

      {/* Changelog */}
      <section id="changelog" className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Changelog
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Track the evolution of OpenAPI Sync with detailed release notes and
          version history.
        </p>

        <div className="space-y-6">
          {versionsData.slice(0, 5).map((release, index) => {
            const isLatest = index === 0;
            const containerClass = isLatest
              ? "border-l-4 border-green-600 dark:border-green-500 pl-4 bg-green-50 dark:bg-green-900/10 p-4 rounded-r"
              : `border-l-4 ${release.type === "major"
                ? "border-red-600 dark:border-red-500"
                : release.type === "minor"
                  ? "border-blue-600 dark:border-blue-500"
                  : "border-gray-300 dark:border-gray-700"
              } pl-4`;

            return (
              <div key={release.version} className={containerClass}>
                <div className="flex items-center gap-2 mb-2">
                  <h4
                    className={`${isLatest ? "font-bold text-lg" : "font-semibold"
                      } text-gray-900 dark:text-white`}
                  >
                    v{release.version}
                  </h4>
                  {isLatest && (
                    <span className="px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded-full">
                      LATEST
                    </span>
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {release.date}
                  </span>
                </div>
                {isLatest ? (
                  <>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      {release.changes[0]}
                    </p>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-4 list-disc">
                      {release.changes.slice(1).map((change, i) => (
                        <li key={i}>{change}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {release.changes[0]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 dark:border-blue-500 p-4 rounded">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>📖 Full Changelog:</strong> For complete release notes and
            detailed changes, visit the{" "}
            <a
              href="/changelog"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              dedicated Changelog page
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
