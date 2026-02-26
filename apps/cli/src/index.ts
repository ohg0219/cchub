#!/usr/bin/env node
import { Command } from 'commander';
import { installAction } from './commands/install.js';
import { searchAction } from './commands/search.js';
import { listAction } from './commands/list.js';
import { config } from './utils/config.js';

const program = new Command();

program
  .name('cchub')
  .description('Claude Code Starter Kit 설치 도구')
  .version(config.cliVersion);

program
  .command('install <slug>')
  .description('스타터 킷을 현재 프로젝트에 설치합니다')
  .option('-s, --skip-hooks',  'Hooks 설치 제외')
  .option('-a, --skip-agents', 'Agents 설치 제외')
  .option('-d, --dry-run',     '실제 설치 없이 미리보기만')
  .action(installAction);

program
  .command('search <query>')
  .description('킷을 검색합니다')
  .action(searchAction);

program
  .command('list')
  .description('설치된 킷 목록을 표시합니다')
  .action(listAction);

program.parse(process.argv);
