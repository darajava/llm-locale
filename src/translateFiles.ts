import fs from "fs";
import { translateFile } from "./translateFile";

const showHelp = () => {
  console.log(`ERROR: Could not read .filemappings file.
  
.filemappings should exist alongside translation files and have the format:

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
  ]
}
  `);
};

export const translateFiles = async (openAiKey: string) => {
  let fileMappings: any = {};
  try {
    fileMappings = JSON.parse(fs.readFileSync(".filemappings", "utf8"));
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

    if (!sourceFile || !destFile || !sourceLanguage || !destLanguage) {
      showHelp();
      process.exit(1);
    }

    if (!fs.existsSync(destFile)) {
      fs.writeFileSync(destFile, "{}");
    }

    console.log(
      `Translating ${sourceFile} (${sourceLanguage}) to ${destFile} (${destLanguage})`
    );

    await translateFile(
      sourceFile,
      destFile,
      sourceLanguage,
      destLanguage,
      openAiKey
    );
  }
};
