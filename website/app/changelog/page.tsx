export const metadata = {
  title: "Changelog - OpenAPI Sync",
  description: "Version history and release notes for OpenAPI Sync",
};

import versionsData from "../../lib/changelog-data.json";

const versions = versionsData;

const typeColors = {
  major: "bg-red-100 text-red-700 border-red-300",
  minor: "bg-blue-100 text-blue-700 border-blue-300",
  patch: "bg-green-100 text-green-700 border-green-300",
};

export default function ChangelogPage() {
  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Changelog
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Track all notable changes to OpenAPI Sync. We follow{" "}
            <a
              href="https://semver.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 dark:text-red-400 hover:underline"
            >
              Semantic Versioning
            </a>
            .
          </p>
        </div>

        {/* Version List */}
        <div className="space-y-8">
          {versions.map((release, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Version Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    v{release.version}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      typeColors[release.type as keyof typeof typeColors]
                    }`}
                  >
                    {release.type}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {release.date}
                </span>
              </div>

              {/* Changes List */}
              <ul className="space-y-2">
                {release.changes.map((change, idx) => (
                  <li
                    key={idx}
                    className="flex items-start text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-red-600 dark:text-red-400 mr-2 mt-1">
                      •
                    </span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 bg-red-50 dark:bg-gray-800 rounded-lg p-6 border border-red-100 dark:border-red-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Stay Updated
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Follow the project on GitHub to get notified about new releases and
            updates.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://github.com/akintomiwa-fisayo/openapi-sync"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
            >
              <span>View on GitHub</span>
            </a>
            <a
              href="https://www.npmjs.com/package/openapi-sync"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-all"
            >
              <span>NPM Package</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
