// noinspection JSUnusedGlobalSymbols
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import type { CommandBuilder } from "yargs";
import {
  getAbsoluteDecisionDirectoryFromConfig,
  getAbsoluteTechSpecDirectoryFromConfig,
  getConfig,
  getProjectRoot,
} from "../utils/config";
import { logger } from "../utils/logger";

const generatedContentMarker = "<!-- Autogenerated content below -->";
const defaultHeader = `# AoT Log\n\nThis log lists all ADRs and Tech Specs of Tango.\n\n`;

export const command = "index";
export const desc = "Create or update index file based on markdown files";

export const builder: CommandBuilder = (yargs) => yargs;

export const handler = (): void => {
  try {
    const techSpecDirectory = getAbsoluteTechSpecDirectoryFromConfig();
    const adrDirectory = getAbsoluteDecisionDirectoryFromConfig();
    const { indexFileName } = getConfig();
    const indexFilePath = resolve(getProjectRoot(), indexFileName);

    let header = defaultHeader;

    if (existsSync(indexFilePath)) {
      const originalFileContent = readFileSync(indexFilePath, {
        encoding: "utf-8",
      });
      const indexOfGeneratedContentMarker = originalFileContent.indexOf(
        generatedContentMarker,
      );

      header =
        indexOfGeneratedContentMarker >= 0
          ? originalFileContent.substring(0, indexOfGeneratedContentMarker)
          : `${originalFileContent}\n`;
    }

    writeFileSync(
      indexFilePath,
      `${header}\nADRs:\n${generateIndex(
        adrDirectory,
      )}\n\nTech Specs:\n${generateIndex(techSpecDirectory)}`,
      {
        encoding: "utf-8",
      },
    );

    logger.ok(`Successfully generated tech spec in ${indexFileName}`);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

const generateIndex: (techSpecDirectory: string) => string = (
  techSpecDirectory,
) =>
  `${generatedContentMarker}\n${getLinks(techSpecDirectory)
    .map((link) => `* ${link}`)
    .join("\n")}`;

const getLinks: (directory: string) => Array<string> = (directory) =>
  readdirSync(directory)
    .filter((filename) => filename.match(/^\d{4}/))
    .map(
      (filename) =>
        `[SPEC-${filename.substring(0, 4)}](./${filename}) - ${getTitleText(
          resolve(directory, filename),
        )}`,
    );

const getTitleText: (file: string) => string = (file) =>
  (
    readFileSync(file, { encoding: "utf-8" })
      .split("\n")
      .find((line) => /^# .*$/.test(line)) || ""
  ).substring(2);
