import fs from "fs";
import path from "path";
import { IConfig, IConfigClientGeneration } from "../types";
import {
  EndpointInfo,
  filterEndpoints,
  generateFetchClient,
  generateAxiosClient,
  generateReactQueryHooks,
  generateSWRHooks,
  generateRTKQuery,
} from "../client-generators";
import { mergeCustomCode } from "../helpers";

/**
 * Get folder name for an endpoint based on config
 */
const getFolderForEndpoint = (
  endpoint: EndpointInfo,
  config: IConfig
): string => {
  // Use custom folder function if provided
  if (config?.folderSplit?.customFolder) {
    const customFolder = config.folderSplit.customFolder({
      method: endpoint.method,
      path: endpoint.path,
      tags: endpoint.tags,
      operationId: endpoint.operationId,
      summary: endpoint.summary,
    });
    if (customFolder) return customFolder;
  }

  // Use tag-based splitting if enabled
  if (
    config?.folderSplit?.byTags &&
    endpoint.tags &&
    endpoint.tags.length > 0
  ) {
    return endpoint.tags[0].toLowerCase().replace(/\s+/g, "-");
  }

  // Default folder
  return "default";
};

/**
 * Generate API clients based on collected endpoint information
 *
 * Orchestrates the complete client generation process. Handles both single-file
 * and folder-split modes, generates appropriate client types (Fetch, Axios, React Query, etc.),
 * creates index files, README documentation, and root aggregators for folder-split mode.
 *
 * @param {EndpointInfo[]} endpoints - Complete array of endpoint information from OpenAPI spec
 * @param {IConfig} config - Full OpenAPI sync configuration
 * @param {IConfigClientGeneration} clientConfig - Specific client generation configuration
 * @param {string} apiName - Name of the API being generated
 * @param {string} outputFolder - Base output folder path for generated files
 * @returns {Promise<void>}
 * @throws {Error} When client generation or file writing fails
 *
 * @public
 */
export const generateClients = async (
  endpoints: EndpointInfo[],
  config: IConfig,
  clientConfig: IConfigClientGeneration,
  apiName: string,
  outputFolder: string
): Promise<void> => {
  // Filter endpoints based on config
  const filteredEndpoints = filterEndpoints(endpoints, clientConfig);

  if (filteredEndpoints.length === 0) {
    console.log("⚠️  No endpoints match the filter criteria");
    return;
  }

  const clientType = clientConfig.type || "fetch";
  const clientOutputDir =
    clientConfig.outputDir || path.join(outputFolder, apiName, "client");

  // Check if folder splitting is enabled
  const isFolderSplitEnabled = !!(
    config?.folderSplit &&
    (config.folderSplit.byTags || config.folderSplit.customFolder)
  );

  console.log(
    `\n🚀 Generating ${clientType} client for ${filteredEndpoints.length} endpoint(s)...`
  );

  if (isFolderSplitEnabled) {
    // Group endpoints by folder
    const endpointsByFolder: Record<string, EndpointInfo[]> = {};
    filteredEndpoints.forEach((endpoint) => {
      const folderName = getFolderForEndpoint(endpoint, config);
      if (!endpointsByFolder[folderName]) {
        endpointsByFolder[folderName] = [];
      }
      endpointsByFolder[folderName].push(endpoint);
    });

    // Generate clients for each folder (directly in tag folders, not in subfolders)
    const folderNames = Object.keys(endpointsByFolder);
    for (const [folderName, folderEndpoints] of Object.entries(
      endpointsByFolder
    )) {
      // Generate client.ts and hooks.ts directly in the tag folder
      const tagFolderPath = path.join(outputFolder, apiName, folderName);
      await fs.promises.mkdir(tagFolderPath, { recursive: true });

      console.log(
        `\n📁 Generating ${clientType} client for folder "${folderName}" (${folderEndpoints.length} endpoints)...`
      );

      await generateClientForFolder(
        folderEndpoints,
        config,
        clientConfig,
        tagFolderPath,
        clientType,
        folderName,
        true // isFolderSplit
      );
    }

    // Generate root clients.ts file at API folder level (not in subfolder)
    const apiFolderPath = path.join(outputFolder, apiName);
    await generateRootAggregatorClient(
      apiFolderPath,
      folderNames,
      clientType,
      config
    );

    if (clientType === "rtk-query") {
      console.log(`\n✅ Generated RTK Query APIs: ${apiFolderPath}/apis.ts`);
    } else {
      console.log(
        `\n✅ Generated centralized clients: ${apiFolderPath}/clients.ts`
      );
      if (clientType === "react-query" || clientType === "swr") {
        console.log(
          `✅ Generated root hooks aggregator: ${apiFolderPath}/hooks.ts`
        );
      }
    }

    console.log(`\n✨ Client generation complete!\n`);
    return;
  }

  // Non-folder-split mode: Generate single clients.ts and hooks.ts at API folder level
  const apiFolderPath = path.join(outputFolder, apiName);
  await fs.promises.mkdir(apiFolderPath, { recursive: true });

  // Generate based on type
  switch (clientType) {
    case "fetch":
      let fetchContent = generateFetchClient(filteredEndpoints, clientConfig);
      // Update import paths to be relative to the same directory
      fetchContent = fetchContent
        .replace(`} from '../types';`, `} from './types';`)
        .replace(`} from '../endpoints';`, `} from './endpoints';`);
      await writeClientFile(
        path.join(apiFolderPath, "clients.ts"),
        fetchContent,
        config
      );
      console.log(`✅ Generated fetch client: ${apiFolderPath}/clients.ts`);
      break;

    case "axios":
      let axiosContent = generateAxiosClient(
        filteredEndpoints,
        clientConfig,
        false
      );
      // Update import paths to be relative to the same directory
      axiosContent = axiosContent
        .replace(`} from '../types';`, `} from './types';`)
        .replace(`} from '../endpoints';`, `} from './endpoints';`);
      await writeClientFile(
        path.join(apiFolderPath, "clients.ts"),
        axiosContent,
        config
      );
      console.log(`✅ Generated axios client: ${apiFolderPath}/clients.ts`);
      break;

    case "react-query":
      // Generate axios client first
      let rqClientContent = generateAxiosClient(
        filteredEndpoints,
        clientConfig,
        false
      );
      // Update import paths to be relative to the same directory
      rqClientContent = rqClientContent
        .replace(`} from '../types';`, `} from './types';`)
        .replace(`} from '../endpoints';`, `} from './endpoints';`);
      await writeClientFile(
        path.join(apiFolderPath, "clients.ts"),
        rqClientContent,
        config
      );
      console.log(`✅ Generated axios client: ${apiFolderPath}/clients.ts`);

      // Then generate React Query hooks
      let rqHooksContent = generateReactQueryHooks(
        filteredEndpoints,
        clientConfig
      );
      // Update imports to use same directory and clients.ts instead of client.ts
      rqHooksContent = rqHooksContent
        .replace(`} from '../types';`, `} from './types';`)
        .replace(`} from '../endpoints';`, `} from './endpoints';`)
        .replace(
          `import apiClient from './client';`,
          `import apiClient from './clients';`
        );
      await writeClientFile(
        path.join(apiFolderPath, "hooks.ts"),
        rqHooksContent,
        config
      );
      console.log(`✅ Generated React Query hooks: ${apiFolderPath}/hooks.ts`);
      break;

    case "swr":
      // Generate axios client first
      let swrClientContent = generateAxiosClient(
        filteredEndpoints,
        clientConfig,
        false
      );
      // Update import paths to be relative to the same directory
      swrClientContent = swrClientContent
        .replace(`} from '../types';`, `} from './types';`)
        .replace(`} from '../endpoints';`, `} from './endpoints';`);
      await writeClientFile(
        path.join(apiFolderPath, "clients.ts"),
        swrClientContent,
        config
      );
      console.log(`✅ Generated axios client: ${apiFolderPath}/clients.ts`);

      // Then generate SWR hooks
      let swrHooksContent = generateSWRHooks(filteredEndpoints, clientConfig);
      // Update imports to use same directory and clients.ts instead of client.ts
      swrHooksContent = swrHooksContent
        .replace(`} from '../types';`, `} from './types';`)
        .replace(`} from '../endpoints';`, `} from './endpoints';`)
        .replace(
          `import apiClient from './client';`,
          `import apiClient from './clients';`
        );
      await writeClientFile(
        path.join(apiFolderPath, "hooks.ts"),
        swrHooksContent,
        config
      );
      console.log(`✅ Generated SWR hooks: ${apiFolderPath}/hooks.ts`);
      break;

    case "rtk-query":
      let rtkContent = generateRTKQuery(filteredEndpoints, clientConfig);
      // Update import paths to be relative to the same directory
      rtkContent = rtkContent
        .replace(`} from '../types';`, `} from './types';`)
        .replace(`} from '../endpoints';`, `} from './endpoints';`);
      await writeClientFile(
        path.join(apiFolderPath, "api.ts"),
        rtkContent,
        config
      );
      console.log(`✅ Generated RTK Query API: ${apiFolderPath}/api.ts`);
      break;

    default:
      throw new Error(`Unknown client type: ${clientType}`);
  }

  console.log(`\n✨ Client generation complete!\n`);
};

/**
 * Write client file with custom code preservation
 *
 * Writes generated client code to a file while preserving any custom code sections.
 * Handles merging of existing custom code with newly generated content.
 *
 * @param {string} filePath - Absolute path to the file to write
 * @param {string} content - Newly generated client code
 * @param {IConfig} config - OpenAPI sync configuration with custom code settings
 * @returns {Promise<void>}
 * @throws {Error} When file write operations fail
 *
 * @internal
 */
const writeClientFile = async (
  filePath: string,
  content: string,
  config: IConfig
): Promise<void> => {
  const customCodeEnabled = config?.customCode?.enabled !== false;

  if (!customCodeEnabled) {
    await fs.promises.writeFile(filePath, content);
    return;
  }

  // Read existing file if it exists
  let existingContent: string | null = null;
  try {
    existingContent = await fs.promises.readFile(filePath, "utf-8");
  } catch (error) {
    // File doesn't exist yet
  }

  // Merge with custom code
  const finalContent = mergeCustomCode(content, existingContent, {
    position: config?.customCode?.position || "bottom",
    markerText: config?.customCode?.markerText,
    includeInstructions: config?.customCode?.includeInstructions,
  });

  await fs.promises.writeFile(filePath, finalContent);
};

/**
 * Generate index file for easy imports
 *
 * Creates an index.ts file that re-exports the generated client code,
 * providing a convenient single import point for consumers.
 *
 * @param {string} outputDir - Directory where the index file should be created
 * @param {string} clientType - Type of client being generated (fetch, axios, react-query, etc.)
 * @param {IConfig} config - OpenAPI sync configuration
 * @returns {Promise<void>}
 * @throws {Error} When file write operations fail
 *
 * @internal
 */
const generateIndexFile = async (
  outputDir: string,
  clientType: string,
  config: IConfig
): Promise<void> => {
  let content = `// Generated API Client Exports\n`;
  content += `// This file was auto-generated.\n\n`;

  switch (clientType) {
    case "fetch":
    case "axios":
      content += `export * from './client';\n`;
      content += `export { default } from './client';\n`;
      break;

    case "react-query":
    case "swr":
      content += `export * from './client';\n`;
      content += `export * from './hooks';\n`;
      break;

    case "rtk-query":
      content += `export * from './api';\n`;
      break;
  }

  await writeClientFile(path.join(outputDir, "index.ts"), content, config);
};

/**
 * Generate README with usage instructions
 *
 * Creates a README.md file with comprehensive usage examples and instructions
 * for the generated client. Includes client-specific examples and configuration guidance.
 *
 * @param {string} outputDir - Directory where the README should be created
 * @param {string} clientType - Type of client (fetch, axios, react-query, swr, rtk-query)
 * @param {number} endpointCount - Number of endpoints in the generated client
 * @param {IConfig} config - OpenAPI sync configuration
 * @returns {Promise<void>}
 * @throws {Error} When file write operations fail
 *
 * @internal
 */
const generateClientReadme = async (
  outputDir: string,
  clientType: string,
  endpointCount: number,
  config: IConfig
): Promise<void> => {
  let content = `# Generated API Client\n\n`;
  content += `This client was automatically generated by openapi-sync.\n\n`;
  content += `**Client Type:** ${clientType}\n`;
  content += `**Endpoints:** ${endpointCount}\n\n`;

  content += `## Usage\n\n`;

  switch (clientType) {
    case "fetch":
      content += `### Fetch Client\n\n`;
      content += `\`\`\`typescript\n`;
      content += `import { setApiConfig, getPetById } from './client';\n\n`;
      content += `// Configure the client\n`;
      content += `setApiConfig({\n`;
      content += `  baseURL: 'https://api.example.com',\n`;
      content += `  auth: { token: 'your-token' },\n`;
      content += `});\n\n`;
      content += `// Use the client\n`;
      content += `const pet = await getPetById({ petId: '123' });\n`;
      content += `\`\`\`\n\n`;
      break;

    case "axios":
      content += `### Axios Client\n\n`;
      content += `\`\`\`typescript\n`;
      content += `import apiClient from './client';\n\n`;
      content += `// Configure the client\n`;
      content += `apiClient.updateConfig({\n`;
      content += `  baseURL: 'https://api.example.com',\n`;
      content += `  headers: {\n`;
      content += `    'Authorization': 'Bearer your-token',\n`;
      content += `  },\n`;
      content += `});\n\n`;
      content += `// Use the client\n`;
      content += `const pet = await apiClient.getPetById({ petId: '123' });\n`;
      content += `\`\`\`\n\n`;
      break;

    case "react-query":
      content += `### React Query Hooks\n\n`;
      content += `\`\`\`typescript\n`;
      content += `import { QueryClient, QueryClientProvider } from '@tanstack/react-query';\n`;
      content += `import { useGetPetById, useCreatePet } from './hooks';\n`;
      content += `import apiClient from './client';\n\n`;
      content += `// Setup QueryClient\n`;
      content += `const queryClient = new QueryClient();\n\n`;
      content += `// Configure API client\n`;
      content += `apiClient.updateConfig({\n`;
      content += `  baseURL: 'https://api.example.com',\n`;
      content += `  headers: {\n`;
      content += `    'Authorization': 'Bearer your-auth-token',\n`;
      content += `  },\n`;
      content += `});\n\n`;
      content += `function App() {\n`;
      content += `  return (\n`;
      content += `    <QueryClientProvider client={queryClient}>\n`;
      content += `      <YourComponent />\n`;
      content += `    </QueryClientProvider>\n`;
      content += `  );\n`;
      content += `}\n\n`;
      content += `// Use in component\n`;
      content += `function YourComponent() {\n`;
      content += `  // GET with path/query parameters\n`;
      content += `  const { data, isLoading } = useGetPetById({\n`;
      content += `    url: { petId: '123' },      // Path parameters\n`;
      content += `    query: { include: 'owner' } // Query parameters (if any)\n`;
      content += `  });\n\n`;
      content += `  // Mutation hook for POST/PUT/DELETE\n`;
      content += `  const createPet = useCreatePet({\n`;
      content += `    onSuccess: () => console.log('Created!'),\n`;
      content += `  });\n\n`;
      content += `  const handleCreate = () => {\n`;
      content += `    createPet.mutate({\n`;
      content += `      data: { name: 'Fluffy', species: 'cat' } // Request body\n`;
      content += `    });\n`;
      content += `  };\n\n`;
      content += `  return <div>{/* Your UI */}</div>;\n`;
      content += `}\n`;
      content += `\`\`\`\n\n`;
      break;

    case "swr":
      content += `### SWR Hooks\n\n`;
      content += `\`\`\`typescript\n`;
      content += `import { SWRConfig } from 'swr';\n`;
      content += `import { useGetPetById, useCreatePet } from './hooks';\n`;
      content += `import apiClient from './client';\n\n`;
      content += `// Configure API client\n`;
      content += `apiClient.updateConfig({\n`;
      content += `  baseURL: 'https://api.example.com',\n`;
      content += `  headers: {\n`;
      content += `    'Authorization': 'Bearer your-auth-token',\n`;
      content += `  },\n`;
      content += `});\n\n`;
      content += `// Use in component\n`;
      content += `function YourComponent() {\n`;
      content += `  // GET with path/query parameters\n`;
      content += `  const { data, error, isLoading } = useGetPetById({\n`;
      content += `    url: { petId: '123' },      // Path parameters\n`;
      content += `    query: { include: 'owner' } // Query parameters (if any)\n`;
      content += `  });\n\n`;
      content += `  // Mutation hook\n`;
      content += `  const { trigger } = useCreatePet();\n\n`;
      content += `  const handleCreate = async () => {\n`;
      content += `    await trigger({\n`;
      content += `      arg: { data: { name: 'Fluffy', species: 'cat' } } // Request body\n`;
      content += `    });\n`;
      content += `  };\n\n`;
      content += `  return <div>{/* Your UI */}</div>;\n`;
      content += `}\n`;
      content += `\`\`\`\n\n`;
      break;

    case "rtk-query":
      content += `### RTK Query\n\n`;
      content += `\`\`\`typescript\n`;
      content += `import { configureStore } from '@reduxjs/toolkit';\n`;
      content += `import apiApi from './api';\n\n`;
      content += `// Setup store\n`;
      content += `export const store = configureStore({\n`;
      content += `  reducer: {\n`;
      content += `    [apiApi.reducerPath]: apiApi.reducer,\n`;
      content += `  },\n`;
      content += `  middleware: (getDefaultMiddleware) =>\n`;
      content += `    getDefaultMiddleware().concat(apiApi.middleware),\n`;
      content += `});\n\n`;
      content += `// Use in component - import hooks or use default export\n`;
      content += `import { useGetPetByIdQuery, useCreatePetMutation } from './api';\n`;
      content += `// Or: import apiApi from './api';\n\n`;
      content += `function YourComponent() {\n`;
      content += `  // GET with path/query parameters\n`;
      content += `  const { data, isLoading } = useGetPetByIdQuery({\n`;
      content += `    url: { petId: '123' },      // Path parameters\n`;
      content += `    query: { include: 'owner' } // Query parameters (if any)\n`;
      content += `  });\n\n`;
      content += `  const [createPet] = useCreatePetMutation();\n\n`;
      content += `  const handleCreate = async () => {\n`;
      content += `    await createPet({\n`;
      content += `      data: { name: 'Fluffy', species: 'cat' } // Request body\n`;
      content += `    });\n`;
      content += `  };\n\n`;
      content += `  return <div>{/* Your UI */}</div>;\n`;
      content += `}\n`;
      content += `\`\`\`\n\n`;
      break;
  }

  content += `## Custom Code\n\n`;
  content += `You can add custom code to the generated files. Your custom code will be preserved during regeneration if placed within the marked sections:\n\n`;
  content += `\`\`\`typescript\n`;
  content += `// ============================================================\n`;
  content += `// 🔒 CUSTOM CODE START\n`;
  content += `// Add your custom code below this line\n`;
  content += `// This section will be preserved during regeneration\n`;
  content += `// ============================================================\n\n`;
  content += `// Your custom code here\n\n`;
  content += `// 🔒 CUSTOM CODE END\n`;
  content += `// ============================================================\n`;
  content += `\`\`\`\n\n`;

  content += `## Regeneration\n\n`;
  content += `To regenerate the client, run:\n\n`;
  content += `\`\`\`bash\n`;
  content += `npx openapi-sync generate-client --type ${clientType}\n`;
  content += `\`\`\`\n`;

  // Don't use custom code preservation for README
  await fs.promises.writeFile(path.join(outputDir, "README.md"), content);
};

/**
 * Generate client for a specific folder
 *
 * Creates client code for a specific folder in folder-split mode. Generates
 * the main client file and hooks file (if applicable) for endpoints grouped
 * into this folder.
 *
 * @param {string} folderName - Name of the folder being generated
 * @param {EndpointInfo[]} folderEndpoints - Endpoints assigned to this folder
 * @param {string} clientOutputDir - Base output directory for clients
 * @param {string} clientType - Type of client to generate
 * @param {IConfigClientGeneration} clientConfig - Client generation configuration
 * @param {IConfig} config - Full OpenAPI sync configuration
 * @param {boolean} isFolderSplit - Whether folder splitting is enabled
 * @returns {Promise<void>}
 * @throws {Error} When file generation or write operations fail
 *
 * @internal
 */
const generateClientForFolder = async (
  endpoints: EndpointInfo[],
  config: IConfig,
  clientConfig: IConfigClientGeneration,
  outputDir: string,
  clientType: string,
  folderName: string,
  isFolderSplit: boolean = false
): Promise<void> => {
  let clientContent = "";
  let hooksContent = "";

  // Determine the correct import path for types and endpoints
  // If folder split: files are in the same folder, so use './types'
  // If not folder split: use '../types'
  const typesImportPath = isFolderSplit ? "./types" : "../types";
  const endpointsImportPath = isFolderSplit ? "./endpoints" : "../endpoints";

  // Generate based on type
  switch (clientType) {
    case "fetch":
      clientContent = generateFetchClient(
        endpoints,
        clientConfig,
        isFolderSplit
      );
      // Update the import paths
      clientContent = clientContent
        .replace(`} from '../types';`, `} from '${typesImportPath}';`)
        .replace(`} from '../endpoints';`, `} from '${endpointsImportPath}';`);
      await writeClientFile(
        path.join(outputDir, "client.ts"),
        clientContent,
        config
      );
      console.log(`  ✅ client.ts`);
      break;

    case "axios":
      clientContent = generateAxiosClient(
        endpoints,
        clientConfig,
        isFolderSplit
      );
      // Update the import paths
      clientContent = clientContent
        .replace(`} from '../types';`, `} from '${typesImportPath}';`)
        .replace(`} from '../endpoints';`, `} from '${endpointsImportPath}';`);
      await writeClientFile(
        path.join(outputDir, "client.ts"),
        clientContent,
        config
      );
      console.log(`  ✅ client.ts`);
      break;

    case "react-query":
      // Generate axios client first
      clientContent = generateAxiosClient(
        endpoints,
        clientConfig,
        isFolderSplit
      );
      // Update the import paths
      clientContent = clientContent
        .replace(`} from '../types';`, `} from '${typesImportPath}';`)
        .replace(`} from '../endpoints';`, `} from '${endpointsImportPath}';`);
      await writeClientFile(
        path.join(outputDir, "client.ts"),
        clientContent,
        config
      );
      console.log(`  ✅ client.ts`);

      // Then generate React Query hooks
      hooksContent = generateReactQueryHooks(endpoints, clientConfig);
      // Update the import paths
      hooksContent = hooksContent
        .replace(`} from '../types';`, `} from '${typesImportPath}';`)
        .replace(`} from '../endpoints';`, `} from '${endpointsImportPath}';`);

      // When folder-split, import from centralized clients
      if (isFolderSplit) {
        const safeFolderName = folderName.replace(/-/g, "_");
        hooksContent = hooksContent.replace(
          `import apiClient from './client';`,
          `import { ${safeFolderName}Client as apiClient } from '../clients';`
        );
      }

      await writeClientFile(
        path.join(outputDir, "hooks.ts"),
        hooksContent,
        config
      );
      console.log(`  ✅ hooks.ts`);
      break;

    case "swr":
      // Generate axios client first
      clientContent = generateAxiosClient(
        endpoints,
        clientConfig,
        isFolderSplit
      );
      // Update the import paths
      clientContent = clientContent
        .replace(`} from '../types';`, `} from '${typesImportPath}';`)
        .replace(`} from '../endpoints';`, `} from '${endpointsImportPath}';`);
      await writeClientFile(
        path.join(outputDir, "client.ts"),
        clientContent,
        config
      );
      console.log(`  ✅ client.ts`);

      // Then generate SWR hooks
      hooksContent = generateSWRHooks(endpoints, clientConfig);
      // Update the import paths
      hooksContent = hooksContent
        .replace(`} from '../types';`, `} from '${typesImportPath}';`)
        .replace(`} from '../endpoints';`, `} from '${endpointsImportPath}';`);

      // When folder-split, import from centralized clients
      if (isFolderSplit) {
        const safeFolderName = folderName.replace(/-/g, "_");
        hooksContent = hooksContent.replace(
          `import apiClient from './client';`,
          `import { ${safeFolderName}Client as apiClient } from '../clients';`
        );
      }

      await writeClientFile(
        path.join(outputDir, "hooks.ts"),
        hooksContent,
        config
      );
      console.log(`  ✅ hooks.ts`);
      break;

    case "rtk-query":
      // For folder-split mode, use folder name as API name to ensure unique reducerPaths
      const folderApiConfig = isFolderSplit
        ? {
            ...clientConfig,
            rtkQuery: {
              ...clientConfig.rtkQuery,
              apiName: folderName.replace(/-/g, "_"),
            },
          }
        : clientConfig;

      hooksContent = generateRTKQuery(endpoints, folderApiConfig);
      // Update the import paths
      hooksContent = hooksContent
        .replace(`} from '../types';`, `} from '${typesImportPath}';`)
        .replace(`} from '../endpoints';`, `} from '${endpointsImportPath}';`);
      await writeClientFile(
        path.join(outputDir, "api.ts"),
        hooksContent,
        config
      );
      console.log(`  ✅ api.ts`);
      break;

    default:
      throw new Error(`Unknown client type: ${clientType}`);
  }
};

/**
 * Generate root client aggregator that imports all folder clients
 *
 * Creates a centralized clients.ts file at the API root that imports all
 * individual folder client classes, instantiates them, and provides a
 * unified configuration function. Also creates a hooks.ts aggregator for
 * React Query and SWR.
 *
 * @param {string} outputDir - Root directory where clients.ts should be created
 * @param {string[]} folderNames - Array of folder names containing clients
 * @param {string} clientType - Type of client being generated
 * @param {IConfig} config - Full OpenAPI sync configuration
 * @returns {Promise<void>}
 * @throws {Error} When file generation or write operations fail
 *
 * @internal
 */
const generateRootAggregatorClient = async (
  outputDir: string,
  folderNames: string[],
  clientType: string,
  config: IConfig
): Promise<void> => {
  // Special handling for RTK Query - generate apis.ts
  if (clientType === "rtk-query") {
    let apisContent = `// Generated RTK Query APIs\n`;
    apisContent += `// This file was auto-generated.\n`;
    apisContent += `// Aggregates all API slices for easy Redux store setup\n\n`;

    // Import all API slices
    folderNames.forEach((folderName) => {
      const safeFolderName = folderName.replace(/-/g, "_");
      apisContent += `import ${safeFolderName}Api from './${folderName}/api';\n`;
    });

    apisContent += `\n// Export all API slices\n`;
    folderNames.forEach((folderName) => {
      const safeFolderName = folderName.replace(/-/g, "_");
      apisContent += `export { default as ${safeFolderName}Api } from './${folderName}/api';\n`;
    });

    // Generate helper to configure store with minimal code
    apisContent += `\n/**\n`;
    apisContent += ` * Configure Redux store with all API slices\n`;
    apisContent += ` * \n`;
    apisContent += ` * @example\n`;
    apisContent += ` * import { configureStore } from '@reduxjs/toolkit';\n`;
    apisContent += ` * import { setupApiStore } from './apis';\n`;
    apisContent += ` * \n`;
    apisContent += ` * export const store = configureStore({\n`;
    apisContent += ` *   reducer: setupApiStore.reducer,\n`;
    apisContent += ` *   middleware: (getDefaultMiddleware) =>\n`;
    apisContent += ` *     getDefaultMiddleware().concat(setupApiStore.middleware),\n`;
    apisContent += ` * });\n`;
    apisContent += ` */\n`;
    apisContent += `export const setupApiStore = {\n`;
    apisContent += `  reducer: {\n`;
    folderNames.forEach((folderName) => {
      const safeFolderName = folderName.replace(/-/g, "_");
      apisContent += `    [${safeFolderName}Api.reducerPath]: ${safeFolderName}Api.reducer,\n`;
    });
    apisContent += `  },\n`;
    apisContent += `  middleware: [\n`;
    folderNames.forEach((folderName) => {
      const safeFolderName = folderName.replace(/-/g, "_");
      apisContent += `    ${safeFolderName}Api.middleware,\n`;
    });
    apisContent += `  ],\n`;
    apisContent += `};\n`;

    await writeClientFile(path.join(outputDir, "apis.ts"), apisContent, config);
    return;
  }

  // Generate clients.ts that imports all clients
  let clientContent = `// Generated API Clients\n`;
  clientContent += `// This file was auto-generated.\n`;
  clientContent += `// Centralized client instances and configuration\n\n`;

  // Import all folder clients
  if (clientType === "fetch") {
    // For Fetch clients, import and re-export the default objects
    folderNames.forEach((folderName) => {
      const safeFolderName = folderName.replace(/-/g, "_");
      clientContent += `export { default as ${safeFolderName}Client } from './${folderName}/client';\n`;
    });
  } else {
    // For Axios clients, import the classes
    folderNames.forEach((folderName) => {
      const safeFolderName = folderName.replace(/-/g, "_");
      const className = `${
        safeFolderName.charAt(0).toUpperCase() + safeFolderName.slice(1)
      }ApiClient`;
      clientContent += `import ${className} from './${folderName}/client';\n`;
    });

    // Create instances from classes
    clientContent += `\n// Create client instances\n`;
    folderNames.forEach((folderName) => {
      const safeFolderName = folderName.replace(/-/g, "_");
      const className = `${
        safeFolderName.charAt(0).toUpperCase() + safeFolderName.slice(1)
      }ApiClient`;
      clientContent += `export const ${safeFolderName}Client = new ${className}();\n`;
    });
  }

  // For Fetch, import the clients again for the aggregate object
  if (clientType === "fetch") {
    clientContent += `\n// Import clients for aggregation\n`;
    folderNames.forEach((folderName) => {
      const safeFolderName = folderName.replace(/-/g, "_");
      clientContent += `import ${safeFolderName}_client from './${folderName}/client';\n`;
    });
  }

  clientContent += `\n// Aggregate all client instances\n`;
  clientContent += `export const clients = {\n`;
  folderNames.forEach((folderName) => {
    const safeFolderName = folderName.replace(/-/g, "_");
    if (clientType === "fetch") {
      clientContent += `  ${safeFolderName}: ${safeFolderName}_client,\n`;
    } else {
      clientContent += `  ${safeFolderName}: ${safeFolderName}Client,\n`;
    }
  });
  clientContent += `};\n\n`;

  // Generate centralized configuration functions
  if (clientType === "axios") {
    clientContent += `\n/**\n`;
    clientContent += ` * Configure all API clients at once\n`;
    clientContent += ` * @param config - Configuration to apply to all clients\n`;
    clientContent += ` */\n`;
    clientContent += `export const configureAllClients = (config: {\n`;
    clientContent += `  baseURL?: string;\n`;
    clientContent += `  headers?: Record<string, string>;\n`;
    clientContent += `  timeout?: number;\n`;
    clientContent += `}) => {\n`;
    folderNames.forEach((folderName) => {
      const safeFolderName = folderName.replace(/-/g, "_");
      clientContent += `  ${safeFolderName}Client.updateConfig(config);\n`;
    });
    clientContent += `};\n\n`;
  } else if (clientType === "fetch") {
    clientContent += `\n/**\n`;
    clientContent += ` * Configure all API clients at once\n`;
    clientContent += ` * @param config - Configuration to apply to all clients\n`;
    clientContent += ` */\n`;
    clientContent += `export const configureAllClients = (config: {\n`;
    clientContent += `  baseURL?: string;\n`;
    clientContent += `  headers?: Record<string, string>;\n`;
    clientContent += `  auth?: { token?: string };\n`;
    clientContent += `}) => {\n`;
    folderNames.forEach((folderName) => {
      const safeFolderName = folderName.replace(/-/g, "_");
      clientContent += `  ${safeFolderName}_client.setApiConfig(config);\n`;
    });
    clientContent += `};\n\n`;
  }

  clientContent += `// Example usage:\n`;
  clientContent += `// import { configureAllClients, clients } from './clients';\n`;
  clientContent += `//\n`;
  clientContent += `// // Configure all clients at once\n`;
  clientContent += `// configureAllClients({\n`;
  clientContent += `//   baseURL: 'https://api.example.com',\n`;
  clientContent += `//   timeout: 10000,\n`;
  clientContent += `// });\n`;
  clientContent += `//\n`;
  clientContent += `// // Use specific client\n`;
  clientContent += `// const data = await clients.${folderNames[0]?.replace(
    /-/g,
    "_"
  )}.someMethod(...);\n`;

  await writeClientFile(
    path.join(outputDir, "clients.ts"),
    clientContent,
    config
  );

  // Generate hooks.ts aggregator if using React Query or SWR
  if (clientType === "react-query" || clientType === "swr") {
    let hooksContent = `// Generated Hooks Aggregator\n`;
    hooksContent += `// This file was auto-generated.\n`;
    hooksContent += `// Aggregates all folder-split hooks\n\n`;

    folderNames.forEach((folderName) => {
      hooksContent += `export * from './${folderName}/hooks';\n`;
    });

    hooksContent += `\n// Example usage:\n`;
    hooksContent += `// import { useGetSomething } from './hooks';\n`;

    await writeClientFile(
      path.join(outputDir, "hooks.ts"),
      hooksContent,
      config
    );
  }
};

/**
 * Get endpoint name from config or use default
 *
 * Determines the function name for a generated endpoint method. Uses custom
 * name formatting if configured, falls back to snake_case or camelCase based
 * on configuration, and ultimately falls back to the provided default name.
 *
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - API endpoint path
 * @param {string} summary - OpenAPI operation summary
 * @param {string} operationId - OpenAPI operation ID
 * @param {string[]} [tags] - OpenAPI tags associated with the endpoint
 * @param {IConfigClientGeneration} config - Client generation configuration
 * @param {string} defaultName - Default name to use if no custom formatting applies
 * @returns {string} The determined function name for the endpoint
 *
 * @public
 */
export const getClientFunctionName = (
  method: string,
  path: string,
  summary: string,
  operationId: string,
  tags: string[] | undefined,
  config: IConfigClientGeneration,
  defaultName: string
): string => {
  // Try custom format function first
  if (config.name?.format) {
    const customName = config.name.format(
      {
        method: method as any,
        path,
        summary,
        operationId,
        tags,
      },
      defaultName
    );
    if (customName) return customName;
  }

  // Use operation ID if configured
  if (config.name?.useOperationId && operationId) {
    return operationId;
  }

  // Apply prefix and suffix
  let name = defaultName;
  if (config.name?.prefix) {
    name = config.name.prefix + name;
  }
  if (config.name?.suffix) {
    name = name + config.name.suffix;
  }

  return name;
};
