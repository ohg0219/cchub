import chalk from 'chalk';
import { searchKits, NetworkError } from '../lib/api.js';
import { logger } from '../utils/logger.js';

export async function searchAction(query: string): Promise<void> {
  logger.blank();
  logger.info(`Searching for "${chalk.cyan(query)}"...`);

  let result;
  try {
    result = await searchKits(query);
  } catch (err) {
    if (err instanceof NetworkError) {
      logger.error(err.message);
    } else {
      logger.error(`Unexpected error: ${String(err)}`);
    }
    process.exit(1);
  }

  if (result.data.length === 0) {
    logger.blank();
    logger.info(`No kits found for "${query}"`);
    logger.blank();
    return;
  }

  logger.blank();
  console.log(chalk.gray(`${result.total} kit(s) found\n`));

  // 컬럼 너비 계산
  const slugWidth  = Math.max(24, ...result.data.map((k) => k.slug.length));
  const nameWidth  = Math.max(24, ...result.data.map((k) => k.name.length));
  const catWidth   = 10;
  const instWidth  = 8;
  const compWidth  = 14;

  const pad = (s: string, w: number) => s.padEnd(w);
  const divider = `${'─'.repeat(slugWidth + 2)}┼${'─'.repeat(nameWidth + 2)}┼${'─'.repeat(catWidth + 2)}┼${'─'.repeat(instWidth + 2)}┼${'─'.repeat(compWidth + 2)}`;

  // 헤더
  console.log(chalk.bold(
    `${pad('Slug', slugWidth)}  │ ${pad('Name', nameWidth)}  │ ${pad('Category', catWidth)}  │ ${pad('Installs', instWidth)}  │ Components`
  ));
  console.log(chalk.gray(divider));

  for (const kit of result.data) {
    const components = [
      kit.skills_count  > 0 ? `S:${kit.skills_count}`  : '',
      kit.hooks_count   > 0 ? `H:${kit.hooks_count}`   : '',
      kit.agents_count  > 0 ? `A:${kit.agents_count}`  : '',
      kit.has_claude_md       ? 'md'                     : '',
    ].filter(Boolean).join(' ');

    console.log(
      `${chalk.cyan(pad(kit.slug, slugWidth))}  │ ${pad(kit.name, nameWidth)}  │ ${pad(kit.category, catWidth)}  │ ${pad(String(kit.install_count), instWidth)}  │ ${components}`
    );
  }

  logger.blank();
  console.log(chalk.gray(`Install: npx cckit install <slug>`));
  logger.blank();
}
