import {
  FiRefreshCw,
  FiCode,
  FiSettings,
  FiShield,
  FiCheckCircle,
  FiBook,
  FiLayers,
  FiZap,
} from "react-icons/fi";

const features = [
  {
    icon: FiCheckCircle,
    title: "🔥 Powerful Runtime Validation",
    description:
      "Generate validation schemas using Zod, Yup, or Joi with full support for all OpenAPI data types, constraints, formats, and patterns.",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    icon: FiRefreshCw,
    title: "Real-time Synchronization",
    description:
      "Automatically fetches and syncs OpenAPI specifications from remote URLs with configurable refetch intervals.",
    color: "text-rose-600",
    bgColor: "bg-rose-100",
  },
  {
    icon: FiCode,
    title: "TypeScript Type Generation",
    description:
      "Generates TypeScript interfaces for all endpoints with support for complex nested objects, arrays, and unions.",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    icon: FiSettings,
    title: "Highly Configurable",
    description:
      "Customize naming conventions, exclude/include endpoints, folder splitting, and URL transformations.",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    icon: FiShield,
    title: "Enterprise Ready",
    description:
      "Network error handling with exponential backoff, schema validation, and environment-aware auto-sync.",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    icon: FiBook,
    title: "Rich Documentation",
    description:
      "Generates comprehensive JSDoc comments with cURL examples, security schemes, and type references.",
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
  {
    icon: FiLayers,
    title: "Folder Splitting",
    description:
      "Organize generated code by tags, custom logic, or method-based splitting for better code organization.",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
  {
    icon: FiZap,
    title: "Custom Code Preservation",
    description:
      "Add your own custom code that survives regeneration with special comment markers.",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Everything you need to keep your API documentation, TypeScript
            types, and validation schemas perfectly synchronized
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-red-300 dark:hover:border-red-700 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800"
            >
              <div
                className={`${feature.bgColor} ${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Benefits */}
        <div className="mt-16 bg-gradient-to-br from-red-50 to-rose-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-12 border-2 border-red-200 dark:border-red-900">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                3
              </div>
              <div className="text-gray-700 dark:text-gray-200 font-medium">
                Validation Libraries
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                Zod, Yup, and Joi - choose your favorite
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                100%
              </div>
              <div className="text-gray-700 dark:text-gray-200 font-medium">
                Type Safety
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                Full TypeScript support with comprehensive type definitions
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                Zero
              </div>
              <div className="text-gray-700 dark:text-gray-200 font-medium">
                Manual Work
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                Automated sync keeps everything up-to-date
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
