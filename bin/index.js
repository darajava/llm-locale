#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const translateFiles_1 = require("./translateFiles");
const openAiKey = process.argv[2];
if (process.argv.length === 3) {
    setTimeout(() => {
        // I'm getting a ridiculous "punycode" warning which makes the output so noisy...
        // If someone is reading this, please help!
        console.log();
        console.log();
        (0, translateFiles_1.translateFiles)(openAiKey);
    }, 1000);
}
else {
    console.error("Usage: npx llm-locale <openAiKey>");
    process.exit(1);
}
