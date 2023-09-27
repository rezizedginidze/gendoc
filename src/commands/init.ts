import { copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join, resolve } from "path";
import type { Arguments, CommandBuilder } from "yargs";
import {
  adrTemplateFileName,
  techSpecTemplateFileName,
} from "../constants/constants";
import { defaultConfig, saveConfig } from "../utils/config";
import { logger } from "../utils/logger";

type Options = {
  option: string;
  index: string;
};

export const command = "init <option>";
export const desc = "Initialize a document generator";

export const builder: CommandBuilder<Options> = (yargs) =>
  yargs
    .positional("option", {
      type: "string",
      describe: "Options to choose from: adr or spec",
      choices: ["adr", "spec"],
    })
    .option("index", {
      alias: "i",
      describe: `By default the decision log is written to a file called '${defaultConfig.indexFileName}'. It is possible to change this filename by setting this option`,
      choices: [defaultConfig.indexFileName, "readme.md"],
      default: defaultConfig.indexFileName,
    });

export const handler = (args: Arguments<Options>): void => {
  try {
    const path =
      args.option === "adr"
        ? defaultConfig.decisionDirectory
        : defaultConfig.techSpecDirectory;
    const templateName =
      args.option === "adr" ? adrTemplateFileName : techSpecTemplateFileName;
    const absolutePath = resolve(process.cwd(), path);
    const assetsPath = resolve(__dirname, "../../assets");

    if (existsSync(absolutePath)) {
      if (existsSync(absolutePath) && readdirSync(absolutePath).length) {
        logger.error(
          `The specified gendoc directory '${absolutePath}' already exists and is not empty!`,
        );
        process.exit(1);
      }
    } else {
      mkdirSync(absolutePath, { recursive: true });
    }

    copyFileSync(
      join(assetsPath, templateName),
      join(absolutePath, templateName),
    );
    saveConfig(
      {
        decisionDirectory: defaultConfig.decisionDirectory,
        techSpecDirectory: defaultConfig.techSpecDirectory,
        indexFileName: args.index,
      },
      { noErrorOnMissingConfig: true },
    );

    logger.ok(`gendoc directory '${path}' successfully initialized.`);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};
