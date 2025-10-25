// Centralized video tutorial configuration
// Update this file with actual YouTube video IDs as they become available

export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoId?: string; // YouTube video ID (the part after v= in the URL)
  comingSoon?: boolean;
}

export const videoTutorials: Record<string, VideoTutorial> = {
  introduction: {
    id: "introduction",
    title: "Getting Started with OpenAPI Sync",
    description:
      "Learn the basics of OpenAPI Sync and how it can automate your API development workflow.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  installation: {
    id: "installation",
    title: "Installation & Setup",
    description:
      "Step-by-step guide to installing and configuring OpenAPI Sync in your project.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  quickStart: {
    id: "quick-start",
    title: "Quick Start Tutorial",
    description:
      "Get up and running with OpenAPI Sync in under 5 minutes with this quick start guide.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  basicConfig: {
    id: "basic-config",
    title: "Basic Configuration",
    description:
      "Learn how to configure OpenAPI Sync with JSON, TypeScript, or JavaScript config files.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  folderSplitting: {
    id: "folder-splitting",
    title: "Folder Splitting & Organization",
    description:
      "Organize your generated code by tags or custom logic for better project structure.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  validationSchemas: {
    id: "validation-schemas",
    title: "Runtime Validation with Zod, Yup & Joi",
    description:
      "Generate and use runtime validation schemas for type-safe API requests.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  customCode: {
    id: "custom-code",
    title: "Custom Code Preservation",
    description:
      "Learn how to add custom code that survives regeneration using special markers.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  endpointFiltering: {
    id: "endpoint-filtering",
    title: "Endpoint Filtering & Selection",
    description:
      "Filter endpoints by tags, paths, or regex patterns to control what gets generated.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  clientGenerationOverview: {
    id: "client-generation-overview",
    title: "API Client Generation Overview",
    description:
      "Introduction to generating fully-typed API clients from your OpenAPI specification.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  fetchClient: {
    id: "fetch-client",
    title: "Generating Fetch API Clients",
    description:
      "Generate native browser Fetch API clients with full TypeScript support and error handling.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  axiosClient: {
    id: "axios-client",
    title: "Generating Axios Clients",
    description:
      "Create Axios clients with interceptors, authentication, and custom configuration.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  reactQuery: {
    id: "react-query",
    title: "React Query / TanStack Query Hooks",
    description:
      "Generate React Query hooks for queries and mutations with full type safety.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  swrHooks: {
    id: "swr-hooks",
    title: "SWR Hooks Generation",
    description:
      "Create SWR hooks for data fetching with automatic caching and revalidation.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  rtkQuery: {
    id: "rtk-query",
    title: "RTK Query API Slices",
    description:
      "Generate Redux Toolkit Query API slices for seamless Redux integration.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  cliUsage: {
    id: "cli-usage",
    title: "CLI Commands & Options",
    description:
      "Master the OpenAPI Sync CLI with all available commands and options.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  programmaticUsage: {
    id: "programmatic-usage",
    title: "Programmatic API Usage",
    description:
      "Use OpenAPI Sync programmatically in your Node.js scripts and build tools.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  advancedConfig: {
    id: "advanced-config",
    title: "Advanced Configuration & Customization",
    description:
      "Deep dive into advanced configuration options, custom naming, and transformations.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
  troubleshooting: {
    id: "troubleshooting",
    title: "Common Issues & Troubleshooting",
    description:
      "Learn how to debug and resolve common issues when using OpenAPI Sync.",
    duration: "0:10",
    videoId: "", // Replace with actual video ID
    comingSoon: false,
  },
};

// Helper function to get video tutorial by ID
export function getVideoTutorial(id: string): VideoTutorial | undefined {
  return videoTutorials[id];
}

// Get all video tutorials
export function getAllVideoTutorials(): VideoTutorial[] {
  return Object.values(videoTutorials);
}

// Get available (published) video tutorials
export function getAvailableVideos(): VideoTutorial[] {
  return Object.values(videoTutorials).filter((video) => !video.comingSoon);
}

// Get coming soon video tutorials
export function getComingSoonVideos(): VideoTutorial[] {
  return Object.values(videoTutorials).filter((video) => video.comingSoon);
}
