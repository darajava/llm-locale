import { translateFile } from "./translateFile";
import { translateFiles as translateAllFiles } from "./translateFiles";

if (process.argv.length < 3) {
  console.error(
    "Usage: npx llm-locale <openAiKey> [<sourceFile.json> <destFile.json> <sourceLanguage> <destLanguage>]"
  );
  process.exit(1);
}

const openAiKey = process.argv[2];
const sourceFile = process.argv[3];
const destFile = process.argv[4];
const sourceLanguage = process.argv[5];
const destLanguage = process.argv[6];

if (!sourceFile || !destFile || !sourceLanguage || !destLanguage) {
  translateAllFiles(openAiKey);
} else if (sourceFile && destFile && sourceLanguage && destLanguage) {
  translateFile(sourceFile, destFile, sourceLanguage, destLanguage, openAiKey);
} else {
  console.error(
    "Usage: npx llm-locale <openAiKey> [<sourceFile.json> <destFile.json> <language>]"
  );
  process.exit(1);
}
