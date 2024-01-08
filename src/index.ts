#!/usr/bin/env node
import { translateFile } from "./translateFile";
import { translateFiles as translateAllFiles } from "./translateFiles";

const openAiKey = process.argv[2];

if (process.argv.length === 3) {
  setTimeout(() => {
    // I'm getting a ridiculous "punycode" warning which makes the output so noisy...
    // If someone is reading this, please help!
    console.log();
    console.log();
    translateAllFiles(openAiKey);
  }, 1000);
} else {
  console.error("Usage: npx llm-locale <openAiKey>");
  process.exit(1);
}
