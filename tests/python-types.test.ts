import OpenapiSync from "../Openapi-sync";
import fs from "fs";
import SwaggerParser from "@apidevtools/swagger-parser";
import { IConfig } from "../types";

// Mock dependencies
jest.mock("axios");
jest.mock("@apidevtools/swagger-parser");
jest.mock("fs", () => ({
	existsSync: jest.fn().mockReturnValue(true),
	writeFileSync: jest.fn(),
	promises: {
		writeFile: jest.fn(),
		readFile: jest.fn(),
		mkdir: jest.fn(),
	},
}));
jest.mock("axios-retry");

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedSwaggerParser = SwaggerParser as jest.Mocked<typeof SwaggerParser>;

describe("Python Type Generation", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should generate python types with correct syntax", async () => {
		const mockConfig: IConfig = {
			language: "python",
			api: { petstore: "https://petstore3.swagger.io/api/v3/openapi.json" },
			folder: "src/api",
			validations: { disable: true },
		};

		// Use a small standard dictionary of petstore
		const mockSpec = {
			openapi: "3.0.0",
			info: { title: "Test API", version: "1.0.0" },
			paths: {
				"/pets": {
					get: {
						operationId: "getPets",
						responses: {
							"200": {
								description: "A list of pets.",
								content: {
									"application/json": {
										schema: {
											type: "array",
											items: {
												$ref: "#/components/schemas/Pet",
											},
										},
									},
								},
							},
						},
					},
				},
			},
			components: {
				schemas: {
					Pet: {
						type: "object",
						required: ["id", "name"],
						properties: {
							id: { type: "integer", format: "int64" },
							name: { type: "string" },
							tag: { type: "string" },
						},
					},
					Address: {
						type: "object",
						nullable: true,
						description: "An address.",
						properties: {
							street1: {
								type: "string",
								description:
									"The street1 field, limited to 40 characters. Use street2 for overflow.",
							},
						},
					},
				},
			},
		};

		// Overriding the local file path loading logic to mock it correctly.
		// Load spec from the requested local file and treat generated files as non-existing.
		(mockedFs.promises.readFile as jest.Mock).mockImplementation(
			(filePath: string) => {
				if (filePath.includes("mock_local_file.json")) {
					return Promise.resolve(JSON.stringify(mockSpec));
				}
				return Promise.reject(new Error("File not found"));
			},
		);
		mockedSwaggerParser.parse.mockResolvedValue(mockSpec as any);

		// Actually run sync on local mock file
		await OpenapiSync("mock_local_file.json", "petstore", mockConfig);

		// Filter calls mapped to write files for python
		const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock
			.calls as string[][];

		// Test check the python specific properties
		const sharedPyCall = writeCalls.find((c: any) =>
			(c[0] as string).endsWith("shared.py"),
		);
		expect(sharedPyCall).toBeDefined();

		if (sharedPyCall) {
			const content = sharedPyCall[1] as string;
			expect(content).toContain("from __future__ import annotations");
			expect(content).toContain("from dataclasses import dataclass");
			expect(content).not.toContain("from typing import");
			expect(content).not.toContain("Union");
			expect(content).toContain("@dataclass");
			expect(content).toContain("class IPet:");
			expect(content).toContain("class IAddress:");
			expect(content).toContain('    """\n    An address.');
			expect(content).toContain("    Attributes:");
			expect(content).toContain(
				"street1: The street1 field, limited to 40 characters. Use street2 for overflow.",
			);
			expect(content).not.toContain(" *  An address.");
			expect(content).not.toContain("class IAddress:\n    Optional[");
			expect(content).toContain("id: int");
			expect(content).toContain("name: str");
			expect(content).toContain("tag: str");
		}

		const indexPyCall = writeCalls.find((c: any) =>
			(c[0] as string).endsWith("index.py"),
		);
		expect(indexPyCall).toBeDefined();

		const endpointsPyCall = writeCalls.find((c: any) =>
			(c[0] as string).endsWith("endpoints.py"),
		);
		expect(endpointsPyCall).toBeDefined();

		if (indexPyCall) {
			const content = indexPyCall[1] as string;
			expect(content).toContain("from __future__ import annotations");
			expect(content).toContain("from dataclasses import dataclass");
			expect(content).toContain("from . import shared as Shared");
			expect(content).toContain("from typing import List");
			expect(content).not.toContain("Union");
			expect(content).toContain(
				"class IGetPets200Response:",
			);
			expect(content).toContain(
				"class IGetPets200Response:\n    value: List[Shared.IPet]",
			);
		}

		if (endpointsPyCall) {
			const content = endpointsPyCall[1] as string;
			expect(content).toContain("@dataclass");
			expect(content).toContain("class Endpoint:");
			expect(content).toContain("tags: List[str]");
			expect(content).toContain(
				'GetPets = Endpoint(\n    method="get",\n    operationId="getPets",\n    url="/pets",\n    tags=[]\n)',
			);
			expect(content).toContain('"""');
			expect(content).toContain("* **Method**: GET");
			expect(content).toContain("* **OperationId**: getPets");
			expect(content).toContain("```python");
			expect(content).toContain("```bash");
			expect(content).toContain("curl /pets -X GET");
			expect(content).not.toContain("undefined");
			expect(content).not.toContain("/**");
			expect(content).not.toContain("```typescript");
			expect(content).not.toContain("#:");
		}
	});
});
