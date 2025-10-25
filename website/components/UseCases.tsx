import {
  FiServer,
  FiSmartphone,
  FiPackage,
  FiUsers,
  FiCode,
  FiGlobe,
} from "react-icons/fi";

const useCases = [
  {
    icon: FiServer,
    title: "Backend API Development",
    description:
      "Generate TypeScript types and validation schemas for your Node.js/Express backend. Ensure type safety across your entire API layer.",
    features: [
      "Request/Response type safety",
      "Runtime validation with Zod/Yup/Joi",
      "Automatic endpoint mapping",
    ],
    color: "blue",
  },
  {
    icon: FiSmartphone,
    title: "Frontend Applications",
    description:
      "Keep your React, Vue, or Angular frontend in sync with your API. No more manual type definitions or outdated interfaces.",
    features: [
      "Auto-generated API client types",
      "Form validation schemas",
      "API endpoint constants",
    ],
    color: "cyan",
  },
  {
    icon: FiPackage,
    title: "Microservices",
    description:
      "Synchronize multiple microservices with their OpenAPI specs. Maintain consistent types across your entire service mesh.",
    features: [
      "Multi-API support",
      "Service-specific configurations",
      "Shared type definitions",
    ],
    color: "purple",
  },
  {
    icon: FiUsers,
    title: "Team Collaboration",
    description:
      "Ensure everyone on your team works with the latest API definitions. Automated sync keeps all developers on the same page.",
    features: [
      "Git-friendly generated code",
      "CI/CD integration",
      "Custom code preservation",
    ],
    color: "green",
  },
  {
    icon: FiCode,
    title: "SDK Development",
    description:
      "Build type-safe SDKs and client libraries for your APIs. Generate consistent interfaces for all your API consumers.",
    features: [
      "Client library scaffolding",
      "Documentation generation",
      "Version-specific types",
    ],
    color: "orange",
  },
  {
    icon: FiGlobe,
    title: "Third-Party API Integration",
    description:
      "Integrate external APIs with confidence. Generate types from public OpenAPI specs for popular services.",
    features: [
      "External API support",
      "Type-safe integrations",
      "Automatic updates",
    ],
    color: "pink",
  },
];

const colorClasses = {
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    border: "border-blue-300",
  },
  cyan: {
    bg: "bg-cyan-100",
    text: "text-cyan-600",
    border: "border-cyan-300",
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-600",
    border: "border-purple-300",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-600",
    border: "border-green-300",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    border: "border-orange-300",
  },
  pink: {
    bg: "bg-pink-100",
    text: "text-pink-600",
    border: "border-pink-300",
  },
};

export default function UseCases() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Perfect For Every Use Case
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Whether you&apos;re building backends, frontends, or microservices,
            OpenAPI Sync generates types, validation schemas, and endpoints for
            every use case
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => {
            const colors =
              colorClasses[useCase.color as keyof typeof colorClasses];
            return (
              <div
                key={index}
                className={`bg-white dark:bg-gray-900 rounded-xl border-2 ${colors.border} dark:border-opacity-50 p-6 hover:shadow-xl transition-all duration-300`}
              >
                <div
                  className={`${colors.bg} ${colors.text} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}
                >
                  <useCase.icon className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {useCase.description}
                </p>
                <ul className="space-y-2">
                  {useCase.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className={`${colors.text} mr-2`}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Testimonial/Stats Section */}
        <div className="mt-16 bg-white dark:bg-gray-900 rounded-2xl p-8 md:p-12 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Trusted by Developers Worldwide
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Join thousands of developers who have streamlined their API
              workflow
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                10K+
              </div>
              <div className="text-gray-600 dark:text-gray-400">Downloads</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                500+
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                GitHub Stars
              </div>
            </div>

            <div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                100%
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                Open Source
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
