import * as fs from "fs";
import OpenAI from "openai";

export const translateFile = async (
  sourceFile: string,
  destFile: string,
  sourceLanguage: string,
  destLanguage: string,
  openAiKey: string
) => {
  let source: any, dest: any, destCopy: any;

  const openai = new OpenAI({
    apiKey: openAiKey,
  });

  const translate = async (translationObject: string) => {
    let attempts = 0;
    do {
      let response = await openai.chat.completions.create({
        messages: [
          {
            role: "user",
            // content: `Translate the following json object from ${sourceLanguage} into ${destLanguage}. Do not translate the keys, only the values.\n${translationObject}`,
            content: `Translate the following json object from ${sourceLanguage} into ${destLanguage}. Do not translate the keys keep them as-is, only translate the values. Very important, leave the keys as they were in the new object. i.e. the keys must be the same in both objects at the end.\n${translationObject}`,
          },
        ],
        max_tokens: 900,
        temperature: 0.7,
        response_format: { type: "json_object" },
        // top_p: 1,
        presence_penalty: 0,
        frequency_penalty: 0,
        n: 1,
        stream: false,
        model: "gpt-3.5-turbo-1106",
      });

      // check that translationObject keys has the same keys as response keys
      const translationObjectKeys = Object.keys(JSON.parse(translationObject));
      const responseKeys = Object.keys(
        JSON.parse(response.choices[0].message.content || "{}")
      );

      const eqSet = (xs, ys) =>
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
      console.error(`ERROR: Could not read dest translation file: ${destFile}`);
      process.exit(1);
    }

    if (!destCopy) {
      destCopy = fs.readFileSync(destFile, "utf8");
    }

    const mainKeys = new Set(Object.keys(source));
    const destKeys = new Set(Object.keys(dest));

    const missingSource = [...destKeys].filter((x) => !mainKeys.has(x));
    const missingDest = [...mainKeys].filter((x) => !destKeys.has(x));

    if (missingSource.length > 0) {
      console.error();
      console.error(
        `ERROR: Missing keys in source translation file: ${missingSource.join(
          ", "
        )}`
      );
      console.error(
        `ERROR: The dest file should have no keys that are not in the main file`
      );
      console.error();
      process.exit(1);
    }

    return missingDest;
  };

  try {
    const missingInDest = getNeededKeys();

    if (missingInDest.length === 0) {
      console.log("Dest file is already translated. Nice!");
      return;
    }

    let translationBatch: any = {};

    const translateBatch = async (translationBatch: any) => {
      const translation = await translate(JSON.stringify(translationBatch));
      for (const key of Object.keys(translation!)) {
        dest[key] = translation![key];
        console.log(`Translated ${key}: ${translation![key]}`);
      }
      fs.writeFileSync(destFile, JSON.stringify(dest, null, 2));
    };

    for (const key of missingInDest) {
      if (source[key] !== dest[key]) {
        if (key.startsWith("@")) {
          continue;
        }
        if (typeof source[key] !== "string") {
          continue;
        }

        translationBatch[key] = source[key];

        if (Object.keys(translationBatch).length >= 20) {
          await translateBatch(translationBatch);
          translationBatch = {};
        }
      }
    }
    await translateBatch(translationBatch);

    const finalCheck = getNeededKeys();

    if (finalCheck.length > 0) {
      console.error();
      console.error(
        `ERROR: there are still missing keys in the dest file: ${finalCheck.join()}, reverting changes.`
      );
      console.error();
      fs.writeFileSync(destFile, destCopy);
      process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
