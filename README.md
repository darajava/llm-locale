# llm-locale

#### A command-line utility to automatically generate and edit localization files

## Functionality

Localization files stored in a folder alongside a `.translationrc` file can be automatically generated and edited with this script. Within `.translationrc`, a mandatory source file is set, along with a list of target languages.

```
{
  "source": {
    "file": "en.json", "language": "English"
  },
  "destinations": [
    {
      "file": "fr.json", "language": "French"
    },
    // and so on...
  ],
  "extraPrompt": "Please do not translate LOGORAMA, and keep it in all-caps.", // optional
  "model": "gpt-4" // optional, defaults to "gpt-3.5-turbo-1106"
}
```

`llm-locale` reads the rc file, and for each destination it checks which keys are missing, batches them, and sends them to OpenAI to return a JSON object with the values translated.

Before:

```
en.json                   de.json                      ko.json

{                         {                            (does not exist)
  "hello": "Hello",         "hello": "Hallo",
  "world": "world",         "world": "Welt"
  "hiName": "Hi {name}"   }
}
```

After:

```
en.json                    de.json                      ko.json

{                         {                            {
  "hello": "Hello",         "hello": "Hallo",            "hello": "안녕",
  "world": "world",         "world": "Welt",             "world": "세계",
  "hiName": "Hi {name}"     "hiName": "Hallo {name}"     "hiName": "안녕 {name}"
}                         }                            }
```

The source file never gets altered. The values in generated files are designed to be editable, but the keys should be reliant on the source file. If there is a key in the destination file which is not in the source file, it will be deleted in the destination file. If there is a key in the destination file which is also in the source file, then its value will not be modified to allow for manual editing of the translation values.

The base prompt that we send to OpenAI is:

```
Translate the following json object from ${sourceLanguage} into ${destLanguage}. Do not translate the keys, only the values.
```

We can add as much as we want to this prompt in the `.translationrc` file. See the "Caveats" section for examples of prompts to add.

Keys starting with `@` are ignored, i.e. `"@hello": "world"` would be ignored.

Keys with non-string values are also ignored.

## Use cases

#### Adding new languages

Add a key to `destinations` in `.translationsrc` with a filename and a language, and `llm-locale` will automatially create and populate the file. I suggest only adding 1/2 languages at a time to verify the syntax of templated values.

#### Adding a value

Add a key/value pair(s) to the source file. Running the script will translate and add to all destination files.

#### Removing a value

Remove a key/value pair(s) from the source file. Running the script will remove that key from all destination files.

#### Editing a value in the source file

This one is a bit hacky - remove the key and run `llm-locale` to remove it in all destination files, and then re-add it to the source file with the new value and run the script again.

## Installation

`npm -g llm-local`

Requires `node` (tested on v21.2.0)

### Usage

`llm-locale <OPENAI_KEY>`

Run this in the directory where your source translation file and `.translationrc` are.

### Updating

`npm -g update llm-locale`

## Gotchas

Some translation files allow templating by wrapping identifiers in braces.

The following prompt added to `extraPrompt` helps prevent the LLM from translating identifiers:

```
Any identifier within {} is a variable and should not be translated.
```

---

When testing on Flutter's (fairly weird) pluralizing syntax, I did get it to help, but it still needed some manual tweaking due to the complexity of the expression. Adding this prompt made it better:

```
When translating plurals please use the following syntax: {count, plural, =0{TRANSLATION} =1{TRANSLATION} other{TRANSLATION}}. TRANSLATION can include a variable name in braces, which should not be translated, but also do not translate the token 'plural', or the initial to another language. Make sure the braces balance correctly.
```

Example of Flutter's plural syntax:

```
"yearPlural": "{count, plural, =0{in 0 years} =1{in 1 year} other{in {count} years}}",
```

---

Languages like Hindi and Georgian take up a lot of tokens due to their script and seem to be quite slow. The script batches keys in groups of 5 and we have a max token output of 4096 for this reason.
