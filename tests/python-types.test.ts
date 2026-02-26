import OpenapiSync from "../Openapi-sync";
import fs from "fs";
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
				},
			},
		};

		// Overriding the local file path loading logic to mock it correctly.
		// Instead of doing proper axios request, we simulate reading a local file.
		(mockedFs.promises.readFile as jest.Mock).mockResolvedValueOnce(
			JSON.stringify(mockSpec),
		);

		// Actually run sync on local mock file
		await OpenapiSync("mock_local_file.json", "petstore", mockConfig);

		// Filter calls mapped to write files for python
		const writeCalls = (mockedFs.promises.writeFile as jest.Mock).mock
			.calls as string[][];

		// Test check the python specific properties
		const sharedPyCall = writeCalls.find((c: any) =>
			(c[0] as string).endsWith("shared.py"),
		);
console.log("FILES WRITTEN:", writeCalls.map((c: any) => c[0]));
		expect(sharedPyCall).toBeDefined();

		if (sharedPyCall) {
			console.log("SHARED PY:", sharedPyCall[1]);
			const content = sharedPyCall[1] as string;
			expect(content).toContain(
				"from typing import Any, List, Dict, Union, Optional, Literal, TypedDict",
			);
			expect(content).toContain("class IPet(TypedDict, total=False):");
			expect(content).toContain("id: int");
			expect(content).toContain("name: str");
			expect(content).toContain("tag: Optional[str]");
		}

		const indexPyCall = writeCalls.find((c: any) =>
			(c[0] as string).endsWith("index.py"),
		);
		expect(indexPyCall).toBeDefined();

		const typesPyCall = writeCalls.find((c: any) =>
			(c[0] as string).endsWith("types.py"),
		);
		expect(typesPyCall).toBeDefined();

		if (typesPyCall) {
			console.log("TYPES PY:", typesPyCall[1]);
			const content = typesPyCall[1] as string;
			expect(content).toContain("from . import shared as Shared");
			expect(content).toContain(
				"class IGetPetsResponse(TypedDict, total=False):",
			);
			expect(content).toContain("List[Shared.IPet]");
		}
	});
});
