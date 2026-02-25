#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('cckit')
  .description('Claude Code Starter Kit 설치 도구')
  .version('0.1.0');

program
  .command('install <slug>')
  .description('스타터 킷을 현재 프로젝트에 설치합니다')
  .option('--skip-hooks', 'Hooks 설치 제외')
  .option('--skip-agents', 'Agents 설치 제외')
  .option('--dry-run', '실제 설치 없이 미리보기만')
  .action(() => {
    console.log('Coming soon — cckit-cli 단계에서 구현됩니다.');
  });

program
  .command('search <query>')
  .description('킷을 검색합니다')
  .action(() => {
    console.log('Coming soon — cckit-cli 단계에서 구현됩니다.');
  });

program
  .command('list')
  .description('설치된 킷 목록을 표시합니다')
  .action(() => {
    console.log('Coming soon — cckit-cli 단계에서 구현됩니다.');
  });

program.parse(process.argv);
