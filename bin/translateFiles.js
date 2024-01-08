"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateFiles = void 0;
const fs_1 = __importDefault(require("fs"));
const translateFile_1 = require("./translateFile");
const showHelp = () => {
    console.log(`ERROR: Could not read \`.translationrc\` file.
  
.translationrc should exist alongside translation files and have the format:

{
  "source": {
    "file": "en.json",
    "language": "English"
  },
  "destinations": [
    {
      "file": "de.json",
      "language": "German"
    },
    // and so on
  ],
  [optional] "extraPrompt": "More instructions for the LLM"
  [optional] "model": "gpt-3.5-turbo-1106"
}
  `);
};
const translateFiles = async (openAiKey) => {
    let fileMappings = {};
    try {
        fileMappings = JSON.parse(fs_1.default.readFileSync(".translationrc", "utf8"));
    }
    catch {
        showHelp();
    }
    if (!fileMappings.source || !fileMappings.destinations) {
        showHelp();
        process.exit(1);
    }
    for (const dest of fileMappings.destinations) {
        const sourceFile = fileMappings.source.file;
        const destFile = dest.file;
        const sourceLanguage = fileMappings.source.language;
        const destLanguage = dest.language;
        const extraPrompt = fileMappings.extraPrompt;
        const model = fileMappings.model || "gpt-3.5-turbo-1106";
        if (!sourceFile ||
            !destFile ||
            !sourceLanguage ||
            !destLanguage ||
            !model) {
            showHelp();
            process.exit(1);
        }
        if (!fs_1.default.existsSync(destFile)) {
            fs_1.default.writeFileSync(destFile, "{}");
        }
        console.log(`\n\nTranslating ${sourceFile} (${sourceLanguage}) to ${destFile} (${destLanguage})`);
        await (0, translateFile_1.translateFile)(sourceFile, destFile, sourceLanguage, destLanguage, openAiKey, model, extraPrompt);
    }
};
exports.translateFiles = translateFiles;
