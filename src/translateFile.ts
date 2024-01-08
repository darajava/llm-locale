import * as fs from "fs";
import OpenAI from "openai";

export const translateFile = async (
  sourceFile: string,
  destFile: string,
  sourceLanguage: string,
  destLanguage: string,
  openAiKey: string,
  model: string,
  extraPrompt?: string
) => {
  let source: any, dest: any;

  const openai = new OpenAI({
    apiKey: openAiKey,
  });

  const translate = async (translationObject: string) => {
    if (translationObject === "{}") {
      return {};
    }

    let attempts = 0;
    do {
      const prompt = `Translate the following json object from ${sourceLanguage} into ${destLanguage}. Do not translate the keys, only the values.\n${
        extraPrompt ? extraPrompt + "\n" : ""
      }  
      ${translationObject}`;
      let response = await openai.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 4096,
        temperature: 0.7,
        response_format: { type: "json_object" },
        // top_p: 1,
        presence_penalty: 0,
        frequency_penalty: 0,
        n: 1,
        stream: false,
        model,
      });

      // check that translationObject keys has the same keys as response keys
      const translationObjectKeys = Object.keys(JSON.parse(translationObject));
      const responseKeys = Object.keys(
        JSON.parse(response.choices[0].message.content || "{}")
      );

      const eqSet = (xs: Set<string>, ys: Set<string>) =>
        xs.size === ys.size && [...xs].every((x) => ys.has(x));

      if (!eqSet(new Set(translationObjectKeys), new Set(responseKeys))) {
        console.log("Keys mismatch, retrying");
        continue;
      }

      return JSON.parse(response.choices[0].message.content || "{}");
    } while (attempts++ < 3);

    if (attempts >= 3) {
      console.error("Failed to translate, exiting");
      process.exit(1);
    }
  };

  const getNeededKeys = () => {
    try {
      source = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
    } catch (error) {
      console.error(
        `ERROR: Could not read source translation file: ${sourceFile}`
      );
      process.exit(1);
    }

    try {
      dest = JSON.parse(fs.readFileSync(destFile, "utf8"));
    } catch (error) {
      console.error(
        `ERROR: Could not read destination translation file: ${destFile}`
      );
      process.exit(1);
    }

    const mainKeys = new Set(Object.keys(source));
    const destKeys = new Set(Object.keys(dest));

    const missingSource = [...destKeys].filter(
      (x) => !mainKeys.has(x) && !x.startsWith("@")
    );
    const missingDest = [...mainKeys].filter(
      (x) => !destKeys.has(x) && !x.startsWith("@")
    );

    return [missingDest, missingSource];
  };

  try {
    const [missingInDest, missingInSource] = getNeededKeys();

    if (missingInDest.length === 0 && missingInSource.length === 0) {
      console.log(`${destFile} is already translated. Nice!`);
      return;
    }

    console.log(`${missingInSource.length} keys to remove from ${destFile}`);
    console.log(
      `${missingInDest.length} keys to translate and add to ${destFile}`
    );

    if (missingInSource.length > 0) {
      // delete from dest
      for (const key of missingInSource) {
        console.log(`Deleting ${key} from ${destFile}`);
        delete dest[key];
      }
    }

    let translationBatch: any = {};

    const translateBatch = async (translationBatch: any) => {
      const translation = await translate(JSON.stringify(translationBatch));
      for (const key of Object.keys(translation!)) {
        dest[key] = translation![key];
      }
      fs.writeFileSync(destFile, JSON.stringify(dest, null, 2));
    };

    const totalBatches = Math.ceil(missingInDest.length / 5);

    for (const key of missingInDest) {
      if (source[key] !== dest[key]) {
        if (key.startsWith("@")) {
          continue;
        }
        if (typeof source[key] !== "string") {
          continue;
        }

        translationBatch[key] = source[key];

        if (Object.keys(translationBatch).length >= 5) {
          const batchNumber = Math.floor(
            Object.keys(translationBatch).length / 5
          );
          console.log(
            `Translating batch ${batchNumber} of ${totalBatches} for ${destFile}`
          );
          await translateBatch(translationBatch);
          translationBatch = {};
        }
      }
    }

    console.log(
      `Translating batch ${totalBatches} of ${totalBatches} for ${destFile}`
    );
    await translateBatch(translationBatch);

    const [destMissingFinal, sourceMissingFinal] = getNeededKeys();

    if (destMissingFinal.length > 0 || sourceMissingFinal.length > 0) {
      console.error();
      console.error(
        `ERROR: There are still missing keys in the destination file ${destFile}: ${destMissingFinal.join()}.`
      );
      console.error(
        `ERROR: There are still missing keys in the source file ${sourceFile}: ${sourceMissingFinal.join()}.`
      );
      console.error("Please check these files manually.");
      console.error();
      process.exit(1);
    } else {
      console.log(`SUCCESS: ${destFile} is now translated!`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
