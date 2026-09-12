import { spawn } from "child_process";
import path from "path";
import http from "http";
import net from "net";

const fs = jest.requireActual("fs") as typeof import("fs");

describe("OAS-11: init --run-sync failure handling", () => {
  const rootDir = path.resolve(__dirname, "..");
  const testDir = path.join(__dirname, "temp-oas11-test");
  const sampleSpecPath = path.join(rootDir, "sample_spec.json");
  const sampleSpec = JSON.parse(fs.readFileSync(sampleSpecPath, "utf-8"));

  let server: http.Server;
  let serverPort: number;
  let specUrl: string;
  const openSockets = new Set<net.Socket>();

  function runCli(
    args: string[],
    cwd: string
  ): Promise<{ stdout: string; stderr: string; status: number }> {
    return new Promise((resolve) => {
      const proc = spawn("node", [path.join(rootDir, "bin/cli.js"), ...args], { cwd });
      let stdout = "";
      let stderr = "";
      proc.stdout.on("data", (d) => {
        stdout += d.toString();
      });
      proc.stderr.on("data", (d) => {
        stderr += d.toString();
      });
      proc.on("close", (status) => {
        resolve({ stdout, stderr, status: status ?? 0 });
      });
    });
  }

  beforeAll((done) => {
    server = http.createServer((req, res) => {
      res.setHeader("Connection", "close");
      if (req.url === "/api-json") {
        const auth = req.headers["authorization"];
        if (auth === "Bearer secret-token-123") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(sampleSpec));
        } else {
          res.writeHead(401, {
            "Content-Type": "application/json",
            "WWW-Authenticate": 'Bearer realm="OpenAPI Spec"',
          });
          res.end(
            JSON.stringify({
              statusCode: 401,
              error: "Unauthorized",
              message: "Authentication required to access OpenAPI specification.",
            })
          );
        }
        return;
      }
      res.writeHead(404);
      res.end();
    });

    server.on("connection", (socket) => {
      openSockets.add(socket);
      socket.on("close", () => openSockets.delete(socket));
    });

    server.listen(0, "127.0.0.1", () => {
      serverPort = (server.address() as any).port;
      specUrl = `http://127.0.0.1:${serverPort}/api-json`;
      done();
    });
  });

  afterAll((done) => {
    for (const socket of openSockets) {
      try {
        socket.destroy();
      } catch {}
    }
    openSockets.clear();
    if (server) {
      server.close(() => done());
    } else {
      done();
    }
  });

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("CLI init --run-sync --json against 401 spec exits 1, outputs success: false and SPEC_FETCH_FAILED", async () => {
    const { stdout, status } = await runCli(
      [
        "init",
        "--no-interactive",
        "--api-name",
        "backend",
        "--api-url",
        specUrl,
        "--preset",
        "fetch-zod",
        "--run-sync",
        "--json",
      ],
      testDir
    );

    expect(status).toBe(1);

    const parsed = JSON.parse(stdout.trim());
    expect(parsed.success).toBe(false);
    expect(parsed.configFile).toBe("openapi.sync.ts");
    expect(parsed.errors.length).toBeGreaterThan(0);
    expect(parsed.errors[0]).toContain("401");
    expect(parsed.errors[0]).toContain("SPEC_FETCH_FAILED");
    expect(parsed.message).toContain("initial sync failed");

    // Config file should have been written to testDir
    const writtenConfig = path.join(testDir, "openapi.sync.ts");
    expect(fs.existsSync(writtenConfig)).toBe(true);
  });

  it("CLI init --run-sync (human mode) against 401 spec exits 1 and logs error", async () => {
    const { stderr, status } = await runCli(
      [
        "init",
        "--no-interactive",
        "--api-name",
        "backend",
        "--api-url",
        specUrl,
        "--preset",
        "fetch-zod",
        "--run-sync",
      ],
      testDir
    );

    expect(status).toBe(1);
    expect(stderr).toContain("initial sync failed");
  });

  it("CLI init --run-sync --json with successful local spec exits 0 and reports success: true", async () => {
    const { stdout, status } = await runCli(
      [
        "init",
        "--no-interactive",
        "--api-name",
        "petstore",
        "--api-file",
        sampleSpecPath,
        "--preset",
        "fetch-zod",
        "--run-sync",
        "--json",
      ],
      testDir
    );

    expect(status).toBe(0);

    const parsed = JSON.parse(stdout.trim());
    expect(parsed.success).toBe(true);
    expect(parsed.configFile).toBe("openapi.sync.ts");
    expect(parsed.errors).toEqual([]);
    expect(parsed.message).toContain("Files generated successfully");

    // Files should exist
    const clientPath = path.join(testDir, "petstore/clients.ts");
    expect(fs.existsSync(clientPath)).toBe(true);
  });

  it("CLI init --run-sync --json with valid auth against protected spec exits 0 and reports success: true", async () => {
    const { stdout, status } = await runCli(
      [
        "init",
        "--no-interactive",
        "--api-name",
        "backend",
        "--api-url",
        specUrl,
        "--auth-type",
        "bearer",
        "--auth-token",
        "secret-token-123",
        "--preset",
        "fetch-zod",
        "--run-sync",
        "--json",
      ],
      testDir
    );

    expect(status).toBe(0);

    const parsed = JSON.parse(stdout.trim());
    expect(parsed.success).toBe(true);
    expect(parsed.configFile).toBe("openapi.sync.ts");
    expect(parsed.errors).toEqual([]);
    expect(parsed.message).toContain("Files generated successfully");

    const clientPath = path.join(testDir, "backend/clients.ts");
    expect(fs.existsSync(clientPath)).toBe(true);
  });
});
