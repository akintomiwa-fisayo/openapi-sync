import { spawn } from "child_process";
import path from "path";

// Mock the Init function
jest.mock("../index", () => ({
  Init: jest.fn().mockResolvedValue(undefined),
}));

describe.skip("CLI Functionality", () => {
  const cliPath = path.join(__dirname, "../bin/cli.js");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any hanging processes
    jest.clearAllTimers();
  });

  describe("CLI Arguments", () => {
    it("should handle --help argument", (done) => {
      const child = spawn("node", [cliPath, "--help"], {
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 3000,
      });

      let output = "";
      child.stdout.on("data", (data) => {
        output += data.toString();
      });

      child.on("close", (code) => {
        expect(code).toBe(0);
        expect(output).toContain("Usage:");
        expect(output).toContain("Options:");
        done();
      });

      child.on("error", (error) => {
        done(error);
      });

      // Add timeout to prevent hanging
      setTimeout(() => {
        child.kill("SIGTERM");
        done(new Error("Test timeout"));
      }, 3000);
    });

    it("should handle -h argument", (done) => {
      const child = spawn("node", [cliPath, "-h"]);

      let output = "";
      child.stdout.on("data", (data) => {
        output += data.toString();
      });

      child.on("close", (code) => {
        expect(code).toBe(0);
        expect(output).toContain("Usage:");
        done();
      });

      child.on("error", (error) => {
        done(error);
      });

      // Add timeout to prevent hanging
      setTimeout(() => {
        child.kill();
        done(new Error("Test timeout"));
      }, 5000);
    });

    it("should handle --refreshinterval argument", (done) => {
      const child = spawn("node", [cliPath, "--refreshinterval", "10000"]);

      child.on("close", (code) => {
        expect(code).toBe(0);
        done();
      });

      child.on("error", (error) => {
        done(error);
      });

      // Add timeout to prevent hanging
      setTimeout(() => {
        child.kill();
        done(new Error("Test timeout"));
      }, 5000);
    });

    it("should handle -ri argument", (done) => {
      const child = spawn("node", [cliPath, "-ri", "15000"]);

      child.on("close", (code) => {
        expect(code).toBe(0);
        done();
      });

      child.on("error", (error) => {
        done(error);
      });

      // Add timeout to prevent hanging
      setTimeout(() => {
        child.kill();
        done(new Error("Test timeout"));
      }, 5000);
    });

    it("should handle invalid refresh interval", (done) => {
      const child = spawn("node", [cliPath, "--refreshinterval", "invalid"]);

      child.on("close", (code) => {
        expect(code).toBe(0);
        done();
      });

      child.on("error", (error) => {
        done(error);
      });

      // Add timeout to prevent hanging
      setTimeout(() => {
        child.kill();
        done(new Error("Test timeout"));
      }, 5000);
    });
  });

  describe("CLI Error Handling", () => {
    it("should handle missing configuration file", (done) => {
      const child = spawn("node", [cliPath]);

      let errorOutput = "";
      child.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      child.on("close", (code) => {
        // Should exit with error code when no config is found
        expect(code).not.toBe(0);
        done();
      });

      child.on("error", (error) => {
        done(error);
      });

      // Add timeout to prevent hanging
      setTimeout(() => {
        child.kill();
        done(new Error("Test timeout"));
      }, 5000);
    });

    it("should handle invalid arguments", (done) => {
      const child = spawn("node", [cliPath, "--invalid-arg"]);

      child.on("close", (code) => {
        expect(code).not.toBe(0);
        done();
      });

      child.on("error", (error) => {
        done(error);
      });

      // Add timeout to prevent hanging
      setTimeout(() => {
        child.kill();
        done(new Error("Test timeout"));
      }, 5000);
    });
  });

  describe("CLI Integration", () => {
    it("should call Init function with correct parameters", (done) => {
      const { Init } = require("../index");

      const child = spawn("node", [cliPath, "--refreshinterval", "5000"]);

      child.on("close", (code) => {
        expect(Init).toHaveBeenCalledWith({ refetchInterval: 5000 });
        done();
      });

      child.on("error", (error) => {
        done(error);
      });

      // Add timeout to prevent hanging
      setTimeout(() => {
        child.kill();
        done(new Error("Test timeout"));
      }, 5000);
    });

    it("should call Init function without parameters when no options provided", (done) => {
      const { Init } = require("../index");

      const child = spawn("node", [cliPath]);

      child.on("close", (code) => {
        expect(Init).toHaveBeenCalledWith(undefined);
        done();
      });

      child.on("error", (error) => {
        done(error);
      });

      // Add timeout to prevent hanging
      setTimeout(() => {
        child.kill();
        done(new Error("Test timeout"));
      }, 5000);
    });
  });

  describe("CLI Output", () => {
    it("should display version information", (done) => {
      const child = spawn("node", [cliPath, "--version"]);

      let output = "";
      child.stdout.on("data", (data) => {
        output += data.toString();
      });

      child.on("close", (code) => {
        expect(code).toBe(0);
        expect(output).toMatch(/\d+\.\d+\.\d+/);
        done();
      });

      child.on("error", (error) => {
        done(error);
      });

      // Add timeout to prevent hanging
      setTimeout(() => {
        child.kill();
        done(new Error("Test timeout"));
      }, 5000);
    });

    it("should display help information", (done) => {
      const child = spawn("node", [cliPath, "--help"]);

      let output = "";
      child.stdout.on("data", (data) => {
        output += data.toString();
      });

      child.on("close", (code) => {
        expect(code).toBe(0);
        expect(output).toContain("Usage:");
        expect(output).toContain("Options:");
        expect(output).toContain("--refreshinterval");
        expect(output).toContain("--help");
        done();
      });

      child.on("error", (error) => {
        done(error);
      });

      // Add timeout to prevent hanging
      setTimeout(() => {
        child.kill();
        done(new Error("Test timeout"));
      }, 5000);
    });
  });

  describe("CLI Process Handling", () => {
    it("should handle process exit gracefully", (done) => {
      const child = spawn("node", [cliPath, "--help"]);

      child.on("close", (code) => {
        expect(code).toBe(0);
        done();
      });

      child.on("error", (error) => {
        done(error);
      });

      // Test that process can be terminated
      setTimeout(() => {
        child.kill();
      }, 100);

      // Add timeout to prevent hanging
      setTimeout(() => {
        child.kill();
        done(new Error("Test timeout"));
      }, 5000);
    });

    it("should handle SIGINT gracefully", (done) => {
      const child = spawn("node", [cliPath]);

      child.on("close", (code) => {
        expect(code).toBe(0);
        done();
      });

      child.on("error", (error) => {
        done(error);
      });

      // Send SIGINT after a short delay
      setTimeout(() => {
        child.kill("SIGINT");
      }, 100);

      // Add timeout to prevent hanging
      setTimeout(() => {
        child.kill();
        done(new Error("Test timeout"));
      }, 5000);
    });
  });
});
