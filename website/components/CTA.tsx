import Link from "next/link";
import { FiArrowRight, FiGithub, FiPackage } from "react-icons/fi";
import routes from "@/lib/routes";

export default function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-red-600 via-red-700 to-rose-600 dark:from-red-900 dark:via-red-950 dark:to-rose-900">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
          Ready to Sync Your API?
        </h2>
        <p className="text-xl text-red-100 mb-12 max-w-3xl mx-auto">
          Join thousands of developers who have streamlined their API workflow
          with OpenAPI Sync. Generate types, fully-typed API clients, validation
          schemas, and comprehensive documentation in less than 5 minutes—now
          with v5.0.0 improvements!
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
          <Link
            href={"/#installation"}
            className="w-full sm:w-auto bg-white text-red-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            <FiPackage />
            <span>Install Now</span>
            <FiArrowRight />
          </Link>
          <a
            href="https://github.com/akintomiwa-fisayo/openapi-sync"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-red-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-red-900 transition-all flex items-center justify-center space-x-2"
          >
            <FiGithub />
            <span>Star on GitHub</span>
          </a>
        </div>

        {/* Quick Command */}
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <p className="text-red-100 text-sm mb-2">Quick Start</p>
          <code className="text-white text-lg font-mono">npx openapi-sync</code>
        </div>

        {/* Features Highlight */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-white font-semibold mb-2">Lightning Fast</h3>
            <p className="text-red-100 text-sm">
              Generate thousands of types in seconds with optimized performance
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-white font-semibold mb-2">Type Safe</h3>
            <p className="text-red-100 text-sm">
              100% TypeScript with full type safety and IntelliSense support
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-white font-semibold mb-2">Zero Config</h3>
            <p className="text-red-100 text-sm">
              Works out of the box with sensible defaults, customize when needed
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
