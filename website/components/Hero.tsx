import Link from "next/link";
import { FiArrowRight, FiDownload, FiGithub } from "react-icons/fi";

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-red-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <span>⚡</span>
            <span>Auto-Sync OpenAPI to TypeScript in Real-Time</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6">
            Sync Your API
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500 dark:from-red-400 dark:to-rose-400">
              Effortlessly
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            Automate TypeScript type generation, runtime validation schemas
            (Zod, Yup, Joi), endpoint definitions, and comprehensive
            documentation from your OpenAPI specifications. Keep your code in
            perfect sync.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
            <Link
              href={"/#installation"}
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-rose-500 text-white px-8 py-4 rounded-lg font-semibold hover:from-red-700 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <FiDownload />
              <span>Get Started</span>
              <FiArrowRight />
            </Link>
            <a
              href="https://github.com/akintomiwa-fisayo/openapi-sync"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-lg font-semibold border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-all flex items-center justify-center space-x-2"
            >
              <FiGithub />
              <span>View on GitHub</span>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">
                4.0.0
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Latest Version
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">
                10K+
              </div>
              <div className="text-gray-600 dark:text-gray-400">Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">
                3
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Validation Libraries
              </div>
            </div>
          </div>
        </div>

        {/* Code Preview */}
        <div className="mt-20">
          <div className="bg-gray-900 dark:bg-gray-950 rounded-xl shadow-2xl overflow-hidden border border-gray-800 dark:border-gray-700">
            <div className="bg-gray-800 dark:bg-gray-900 px-4 py-3 flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 text-gray-400 text-sm">
                openapi.sync.json
              </span>
            </div>
            <pre className="p-6 overflow-x-auto">
              <code className="text-sm text-gray-300">
                {`{
  "refetchInterval": 5000,
  "folder": "./src/api",
  "api": {
    "petstore": "https://petstore3.swagger.io/api/v3/openapi.json"
  },
  "validations": {
    "library": "zod"
  }
}`}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
