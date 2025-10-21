import Link from "next/link";
import { FiGithub, FiTwitter, FiMail } from "react-icons/fi";
import routes from "@/lib/routes";

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-300 dark:text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-rose-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="font-bold text-xl text-white dark:text-gray-100">
                OpenAPI Sync
              </span>
            </div>
            <p className="text-gray-400 dark:text-gray-500 mb-4 max-w-md">
              Automate TypeScript types, validation schemas (Zod/Yup/Joi), and
              endpoint generation with OpenAPI Sync. Keep your codebase in
              perfect sync with your API specifications.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com/akintomiwa-fisayo/openapi-sync"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiGithub className="text-2xl" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiTwitter className="text-2xl" />
              </a>
              <a
                href="mailto:support@openapi-sync.dev"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiMail className="text-2xl" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white dark:text-gray-200 font-semibold mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={"/#features"}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href={"/#installation"}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Installation
                </Link>
              </li>
              <li>
                <Link
                  href={"/#examples"}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Examples
                </Link>
              </li>
              <li>
                <Link
                  href={routes.docs().url}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white dark:text-gray-200 font-semibold mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/akintomiwa-fisayo/openapi-sync"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://www.npmjs.com/package/openapi-sync"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  NPM Package
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/akintomiwa-fisayo/openapi-sync/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Report Issue
                </a>
              </li>
              <li>
                <Link
                  href={routes.changelog().url}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Changelog
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 dark:border-gray-900 mt-8 pt-8 text-center text-gray-400 dark:text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} OpenAPI Sync. Licensed under ISC
            License.
          </p>
        </div>
      </div>
    </footer>
  );
}
