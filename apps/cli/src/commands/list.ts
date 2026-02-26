import chalk from 'chalk';
import { readInstalledManifest } from '../lib/installer.js';
import { logger } from '../utils/logger.js';

export async function listAction(): Promise<void> {
  logger.blank();
  const manifest = await readInstalledManifest();

  if (manifest.kits.length === 0) {
    logger.info('No kits installed yet.');
    logger.blank();
    console.log(chalk.gray('Install a kit: npx cckit install <slug>'));
    logger.blank();
    return;
  }

  logger.info(`${manifest.kits.length} kit(s) installed\n`);

  for (const kit of manifest.kits) {
    const date = new Date(kit.installedAt).toLocaleDateString();
    console.log(`${chalk.bold.cyan(kit.slug)} ${chalk.gray(`v${kit.version}`)}  ${chalk.gray(date)}`);
    for (const f of kit.files) {
      logger.step(f);
    }
    logger.blank();
  }
}
