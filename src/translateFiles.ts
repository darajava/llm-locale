import fs from "fs";
import { translateFile } from "./translateFile";

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

export const translateFiles = async (openAiKey: string) => {
  let fileMappings: any = {};
  try {
    fileMappings = JSON.parse(fs.readFileSync(".translationrc", "utf8"));
  } catch {
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

    if (
      !sourceFile ||
      !destFile ||
      !sourceLanguage ||
      !destLanguage ||
      !model
    ) {
      showHelp();
      process.exit(1);
    }

    if (!fs.existsSync(destFile)) {
      fs.writeFileSync(destFile, "{}");
    }

    console.log(
      `\n\nTranslating ${sourceFile} (${sourceLanguage}) to ${destFile} (${destLanguage})`
    );

    await translateFile(
      sourceFile,
      destFile,
      sourceLanguage,
      destLanguage,
      openAiKey,
      model,
      extraPrompt
    );
  }
};
