#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const distPath = path.join(__dirname, "..", "dist");

function getFileSizeInKB(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2);
}

function analyzeDirectory(dirPath, indent = "") {
  const files = fs.readdirSync(dirPath);
  const results = [];

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      console.log(`${indent}📁 ${file}/`);
      analyzeDirectory(filePath, indent + "  ");
    } else {
      const size = getFileSizeInKB(filePath);
      const ext = path.extname(file);
      const icon =
        ext === ".map"
          ? "🗺️"
          : ext === ".d.ts" || ext === ".d.mts"
          ? "📘"
          : "📄";
      console.log(`${indent}${icon} ${file} - ${size} KB`);

      // Track non-map, non-declaration files
      if (!file.endsWith(".map") && !file.includes(".d.")) {
        results.push({ file, size: parseFloat(size) });
      }
    }
  });

  return results;
}

console.log("\n📦 OpenAPI-Sync Bundle Analysis\n");
console.log("=".repeat(60));
console.log("\n📊 Distribution Files:\n");

const allFiles = analyzeDirectory(distPath);

console.log("\n" + "=".repeat(60));
console.log("\n🎯 Main Bundles Summary:\n");

// Group by type
const cjsFiles = allFiles.filter((f) => f.file.endsWith(".js"));
const esmFiles = allFiles.filter((f) => f.file.endsWith(".mjs"));

console.log("CommonJS (CJS):");
cjsFiles.forEach((f) => console.log(`  • ${f.file}: ${f.size} KB`));

console.log("\nES Modules (ESM):");
esmFiles.forEach((f) => console.log(`  • ${f.file}: ${f.size} KB`));

const totalCJS = cjsFiles.reduce((sum, f) => sum + f.size, 0);
const totalESM = esmFiles.reduce((sum, f) => sum + f.size, 0);

console.log("\n" + "=".repeat(60));
console.log("\n📈 Size Summary:\n");
console.log(`  Total CJS Size: ${totalCJS.toFixed(2)} KB`);
console.log(`  Total ESM Size: ${totalESM.toFixed(2)} KB`);
console.log(
  `  Main Entry (CJS): ${
    cjsFiles.find((f) => f.file === "index.js")?.size || 0
  } KB`
);
console.log(
  `  Main Entry (ESM): ${
    esmFiles.find((f) => f.file === "index.mjs")?.size || 0
  } KB`
);

// Calculate total dist size
const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);
console.log(
  `\n  Total Bundle Size (excluding maps & types): ${totalSize.toFixed(2)} KB`
);

console.log("\n" + "=".repeat(60));
console.log("\n✅ Analysis Complete!\n");
