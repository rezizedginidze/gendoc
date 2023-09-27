import { existsSync, lstatSync, readFileSync, writeFileSync } from "fs";
import { parse, resolve } from "path";
import { configFileName } from "../constants/constants";

export interface GenDocToolsConfig {
  decisionDirectory: string;
  techSpecDirectory: string;
  indexFileName: string;
}

export const defaultConfig: GenDocToolsConfig = {
  decisionDirectory: "docs/adrs",
  techSpecDirectory: "docs/tech-specs",
  indexFileName: "index.md",
};

export const getConfig: (options?: {
  noErrorOnMissingConfig?: boolean;
  configPath?: string;
}) => GenDocToolsConfig = ({
  noErrorOnMissingConfig = false,
  configPath,
} = {}) => {
  const configPathToCheck = configPath || getConfigPath(noErrorOnMissingConfig);
  const storedConfig =
    existsSync(configPathToCheck) && lstatSync(configPathToCheck).isFile()
      ? JSON.parse(readFileSync(configPathToCheck, { encoding: "utf-8" }))
      : {};

  return { ...defaultConfig, ...storedConfig };
};

export const saveConfig: (
  partialConfig: Partial<GenDocToolsConfig>,
  options?: { noErrorOnMissingConfig?: boolean },
) => void = (partialConfig, { noErrorOnMissingConfig = false } = {}) => {
  writeFileSync(
    getConfigPath(noErrorOnMissingConfig),
    JSON.stringify(
      { ...getConfig({ noErrorOnMissingConfig }), ...partialConfig },
      null,
      2,
    ),
    "utf-8",
  );
};

export const getAbsoluteDecisionDirectoryFromConfig: () => string = () => {
  const projectRoot = getProjectRoot();
  return resolve(
    projectRoot,
    getConfig({ configPath: resolve(projectRoot, configFileName) })
      .decisionDirectory,
  );
};

export const getAbsoluteTechSpecDirectoryFromConfig: () => string = () => {
  const projectRoot = getProjectRoot();
  return resolve(
    projectRoot,
    getConfig({ configPath: resolve(projectRoot, configFileName) })
      .techSpecDirectory,
  );
};

const getConfigPath = (forceInCwd = false) => {
  if (forceInCwd) {
    return resolve(process.cwd(), configFileName);
  }

  return resolve(getProjectRoot(), configFileName);
};

export const getProjectRoot: (possibleProjectRoot?: string) => string = (
  possibleProjectRoot,
) => {
  const pathToCheck = possibleProjectRoot || process.cwd();

  if (existsSync(resolve(pathToCheck, configFileName))) {
    return pathToCheck;
  } else {
    if (parse(pathToCheck).root === pathToCheck) {
      throw Error(
        "Could not determine project root from current working directory. Are you within the correct project and did you run gendoc init?",
      );
    }

    return getProjectRoot(resolve(pathToCheck, ".."));
  }
};
