import chalk from 'chalk';

export interface Logger {
  info(message: string): void;
  success(message: string): void;
  error(message: string): void;
  warn(message: string): void;
  debug(message: string): void;
}

export function createLogger(): Logger {
  return {
    info: (message: string) => console.log(chalk.blue('ℹ'), message),
    success: (message: string) => console.log(chalk.green('✅'), message),
    error: (message: string) => console.error(chalk.red('❌'), message),
    warn: (message: string) => console.warn(chalk.yellow('⚠️'), message),
    debug: (message: string) => console.log(chalk.gray('🐛'), message)
  };
}
