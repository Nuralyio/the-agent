export interface CLIConfig {
  adapter: 'playwright' | 'puppeteer' | 'selenium';
  browser: string;
  headless: boolean;
  timeout: number;
  retries: number;
  ai: {
    provider: string;
    model: string;
    baseUrl?: string;
    apiKey?: string;
  };
  screenshots: {
    enabled: boolean;
    path: string;
  };
}

export interface RunOptions {
  adapter: 'playwright' | 'puppeteer' | 'selenium';
  browser: string;
  headless: boolean;
  output?: string;
  config?: string;
  timeout?: number;
  retries?: number;
  aiProvider?: string;
  aiModel?: string;
  aiApiKey?: string;
  aiBaseUrl?: string;
  installBrowsers?: boolean;
  checkBrowsers?: boolean;
}

export interface InitOptions {
  force?: boolean;
  template?: string;
}

export interface TestOptions {
  filter?: string;
  headless?: boolean;
  reporter?: string;
  timeout?: number;
}

export interface ConfigOptions {
  global?: boolean;
  list?: boolean;
  get?: string;
  set?: string;
  value?: string;
}
