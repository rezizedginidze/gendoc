import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import type { Arguments, CommandBuilder } from "yargs";
import {
  techSpecTemplateFileName,
  adrTemplateFileName,
} from "../constants/constants";
import {
  getAbsoluteDecisionDirectoryFromConfig,
  getAbsoluteTechSpecDirectoryFromConfig,
} from "../utils/config";
import { logger } from "../utils/logger";
import { handler as index } from "./index";

type Options = {
  option: string;
  title: string;
};

export const command = "gen <option> <title>";
export const desc =
  "Create a new document with the given title based on the template";

export const builder: CommandBuilder<Options> = (yargs) =>
  yargs
    .positional("option", {
      type: "string",
      describe: "Options to choose from: adr or spec",
      choices: ["adr", "spec"],
    })
    .positional("title", {
      type: "string",
      describe: "The title of the new document",
    });

export const handler = (args: Arguments<Options>): void => {
  try {
    const directory =
      args.option === "adr"
        ? getAbsoluteDecisionDirectoryFromConfig()
        : getAbsoluteTechSpecDirectoryFromConfig();
    const templateFilePath = resolve(
      directory,
      args.option === "adr" ? adrTemplateFileName : techSpecTemplateFileName,
    );

    if (!existsSync(templateFilePath)) {
      logger.error(`MADR template file '${templateFilePath}' not present!`);
      process.exit(1);
    }

    const newMadrFileName = `${getNextId(directory)}-${args.title
      .toLowerCase()
      .replace(/[^0-9a-z\s\-_]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-{2,}/g, "-")}.md`;

    writeFileSync(
      join(directory, newMadrFileName),
      readFileSync(templateFilePath, { encoding: "utf-8" }).replace(
        /^# .*$/m,
        `# ${args.title}`,
      ),
      {
        encoding: "utf-8",
      },
    );
    index();
    logger.ok(
      `Successfully created MADR file ${newMadrFileName}. You can start editing it now.`,
    );
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

const getNextId: (directory: string) => string = (directory) =>
  `${
    readdirSync(directory)
      .filter((filename) => filename.match(/^\d{4}/))
      .map((filename) => parseInt(filename.substring(0, 4)))
      .reduce(
        (previousValue, currentValue) => Math.max(previousValue, currentValue),
        -1,
      ) + 1
  }`.padStart(4, "0");
