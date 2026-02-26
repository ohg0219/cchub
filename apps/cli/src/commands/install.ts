import path from 'node:path';
import fs from 'node:fs/promises';
import ora from 'ora';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { fetchKit, trackInstall, KitNotFoundError, NetworkError } from '../lib/api.js';
import { installKit } from '../lib/installer.js';
import { logger } from '../utils/logger.js';

interface InstallCommandOptions {
  skipHooks?: boolean;
  skipAgents?: boolean;
  dryRun?: boolean;
}

export async function installAction(slug: string, options: InstallCommandOptions): Promise<void> {
  logger.blank();
  console.log(chalk.bold('  CCKit — Claude Code Starter Kit Hub'));
  logger.blank();

  const spinner = ora('Fetching kit info...').start();

  let kit;
  try {
    kit = await fetchKit(slug);
    spinner.succeed(`${chalk.bold(kit.name)} v${kit.version} found`);
  } catch (err) {
    spinner.fail();
    if (err instanceof KitNotFoundError) {
      logger.error(err.message);
    } else if (err instanceof NetworkError) {
      logger.error(err.message);
    } else {
      logger.error(`Unexpected error: ${String(err)}`);
    }
    process.exit(1);
  }

  // CLAUDE.md 덮어쓰기 확인
  let overwriteClaudeMd = true;
  const claudeMdPath = path.join(process.cwd(), 'CLAUDE.md');
  const claudeMdExists = await fs.access(claudeMdPath).then(() => true).catch(() => false);

  if (claudeMdExists && !options.dryRun) {
    logger.blank();
    const answer = await inquirer.prompt<{ overwrite: boolean }>([{
      type: 'confirm',
      name: 'overwrite',
      message: 'CLAUDE.md already exists. Overwrite?',
      default: false,
    }]);
    overwriteClaudeMd = answer.overwrite;
  }

  logger.blank();
  if (options.dryRun) {
    logger.warn('Dry run mode — no files will be written');
  }
  logger.info('Downloading files...');

  const { installedFiles, mergedHooks } = await installKit(
    kit,
    {
      skipHooks: options.skipHooks,
      skipAgents: options.skipAgents,
      dryRun: options.dryRun,
    },
    (msg) => logger.step(msg),
    overwriteClaudeMd
  );

  if (!options.dryRun) {
    await trackInstall(slug);
  }

  logger.blank();
  if (installedFiles.length === 0) {
    logger.warn('No files were installed.');
  } else {
    logger.success(chalk.bold('Installation complete!'));
    logger.step(`${installedFiles.length} file(s) installed to .claude/`);
    if (mergedHooks > 0) {
      logger.step(`${mergedHooks} hook(s) merged into .claude/settings.json`);
    }
  }
  logger.blank();
}
