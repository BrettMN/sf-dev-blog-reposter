export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, ...args: unknown[]): void {
    console.log(
      `[${new Date().toISOString()}] [${this.context}] INFO:`,
      message,
      ...args,
    );
  }

  error(message: string, error?: unknown): void {
    console.error(
      `[${new Date().toISOString()}] [${this.context}] ERROR:`,
      message,
    );
    if (error) {
      console.error(error);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(
      `[${new Date().toISOString()}] [${this.context}] WARN:`,
      message,
      ...args,
    );
  }

  debug(message: string, ...args: unknown[]): void {
    console.debug(
      `[${new Date().toISOString()}] [${this.context}] DEBUG:`,
      message,
      ...args,
    );
  }
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
  logger?: Logger,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        if (logger) {
          logger.warn(
            `Attempt ${attempt} failed, retrying in ${delayMs}ms...`,
            error,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  throw lastError;
}
