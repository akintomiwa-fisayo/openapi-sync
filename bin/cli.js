#!/usr/bin/env node

const OpenApisync = require("../dist/index");

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

// Setup yargs
const argv = yargs(hideBin(process.argv))
  .option("refreshinterval", {
    alias: "ri",
    type: "number",
    description: "Interval at which to refetch specifiations",
  })
  .help().argv;

// Use the flags
OpenApisync.Init({
  refetchInterval: argv.refreshinterval,
});
