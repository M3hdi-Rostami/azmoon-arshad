import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { APP_UPDATE_REPO } from "./azmoon-app-version.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

/** Local clone used to push update metadata (HTML + version JSON). */
export const RELEASE_DIR_NAME = ".release-repo";
export const releaseDir = process.env.AZMOON_ARSHAD_RELEASE_DIR
  ? path.resolve(process.env.AZMOON_ARSHAD_RELEASE_DIR)
  : path.join(rootDir, RELEASE_DIR_NAME);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || rootDir,
    encoding: "utf8",
    stdio: options.quiet ? "pipe" : "inherit",
    env: options.env || process.env,
  });
  if ((result.status ?? 1) !== 0) {
    const stderr = (result.stderr || "").trim();
    throw new Error(stderr || `${command} ${args.join(" ")} failed`);
  }
  return (result.stdout || "").trim();
}

export function runGit(args, options = {}) {
  return run("git", args, { ...options, cwd: options.cwd || releaseDir });
}

export function ensureReleaseRepo() {
  fs.mkdirSync(path.dirname(releaseDir), { recursive: true });

  const gitDir = path.join(releaseDir, ".git");
  const remoteUrl = `https://github.com/${APP_UPDATE_REPO.repoOwner}/${APP_UPDATE_REPO.repoName}.git`;

  if (!fs.existsSync(gitDir)) {
    console.log(`Cloning update metadata repo → ${path.relative(rootDir, releaseDir) || RELEASE_DIR_NAME}/ ...`);
    run("git", ["clone", "--branch", APP_UPDATE_REPO.branch, "--single-branch", remoteUrl, releaseDir]);
    return;
  }

  try {
    runGit(["remote", "get-url", "origin"], { quiet: true });
  } catch {
    runGit(["remote", "add", "origin", remoteUrl]);
  }

  runGit(["fetch", "origin", APP_UPDATE_REPO.branch]);
  runGit(["checkout", APP_UPDATE_REPO.branch]);
  try {
    runGit(["pull", "--ff-only", "origin", APP_UPDATE_REPO.branch]);
  } catch {
    console.warn("Could not fast-forward release repo; continuing with local state.");
  }
}

export function getReleaseRemoteUrl() {
  try {
    return runGit(["remote", "get-url", "origin"], { quiet: true });
  } catch {
    return "";
  }
}

export { rootDir };
