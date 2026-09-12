import { generateFetchClient } from "../client-generators";
import { PRESETS } from "../Openapi-sync/presets";
import { EndpointInfo } from "../client-generators";
import { IConfigClientGeneration } from "../types";

describe("OAS-8: Next-aware fetch client", () => {
  const mockEndpoints: EndpointInfo[] = [
    {
      name: "getPetById",
      method: "get",
      path: "/pet/{petId}",
      parameters: [
        {
          name: "petId",
          in: "path",
          required: true,
          type: "string",
        },
      ],
      responseType: "IPet",
      summary: "Find pet by ID",
      tags: ["pet"],
    },
    {
      name: "listPets",
      method: "get",
      path: "/pets",
      responseType: "IPet[]",
      summary: "List all pets",
      tags: ["pet"],
    },
  ];

  it("next-fetch preset config has next: true", () => {
    const preset = PRESETS["next-fetch"];
    expect(preset).toBeDefined();
    expect(preset.clientGeneration?.enabled).toBe(true);
    expect(preset.clientGeneration?.type).toBe("fetch");
    expect(preset.clientGeneration?.next).toBe(true);
  });

  it("generates Next-aware fetch client when next: true is configured", () => {
    const config: IConfigClientGeneration = {
      enabled: true,
      type: "fetch",
      next: true,
      baseURL: "https://api.example.com",
    };

    const client = generateFetchClient(mockEndpoints, config);

    expect(client).toContain("Generated Next.js Fetch Client");
    expect(client).toContain("export interface NextFetchRequestConfig");
    expect(client).toContain("revalidate?: number | false");
    expect(client).toContain("tags?: string[]");
    expect(client).toContain("export interface NextFetchOptions");
    expect(client).toContain("cache?: RequestCache");
    expect(client).toContain("next?: NextFetchRequestConfig");
    expect(client).toContain("options?: NextFetchOptions");
    expect(client).toContain("next: nextConfig");
    expect(client).toContain("cache: cacheConfig");
    // Ensure no hard dependency on Next.js package
    expect(client).not.toContain("from 'next");
    expect(client).not.toContain('from "next');
  });

  it("generates Next-aware fetch client when type is next-fetch", () => {
    const config: any = {
      enabled: true,
      type: "next-fetch",
    };

    const client = generateFetchClient(mockEndpoints, config);

    expect(client).toContain("Generated Next.js Fetch Client");
    expect(client).toContain("revalidate?: number | false");
    expect(client).toContain("options?: NextFetchOptions");
  });

  it("plain fetch client stays generic without Next.js types or options", () => {
    const config: IConfigClientGeneration = {
      enabled: true,
      type: "fetch",
    };

    const client = generateFetchClient(mockEndpoints, config);

    expect(client).toContain("Generated Fetch API Client");
    expect(client).not.toContain("NextFetchRequestConfig");
    expect(client).not.toContain("NextFetchOptions");
    expect(client).not.toContain("revalidate");
    expect(client).toContain("options?: RequestInit");
  });
});
