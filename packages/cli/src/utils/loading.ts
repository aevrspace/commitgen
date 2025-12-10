// ./src/utils/loading.ts
import chalk from "chalk";

export class LoadingIndicator {
  private frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private currentFrame = 0;
  private interval: NodeJS.Timeout | null = null;
  private message: string;

  constructor(message: string = "Loading...") {
    this.message = message;
  }

  start(): void {
    // Hide cursor
    process.stdout.write("\x1B[?25l");

    this.interval = setInterval(() => {
      const frame = this.frames[this.currentFrame];
      process.stdout.write(
        `\r${chalk.cyan(frame)} ${chalk.gray(this.message)}`
      );
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
  }

  updateMessage(message: string): void {
    this.message = message;
  }

  stop(finalMessage?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    // Clear the line
    process.stdout.write("\r\x1B[K");

    // Show cursor
    process.stdout.write("\x1B[?25h");

    if (finalMessage) {
      console.log(finalMessage);
    }
  }

  succeed(message: string): void {
    this.stop(chalk.green(`✓ ${message}`));
  }

  fail(message: string): void {
    this.stop(chalk.red(`✗ ${message}`));
  }

  warn(message: string): void {
    this.stop(chalk.yellow(`⚠ ${message}`));
  }
}

// Utility function for wrapping async operations with loading indicator
export async function withLoading<T>(
  message: string,
  operation: () => Promise<T>,
  successMessage?: string
): Promise<T> {
  const loader = new LoadingIndicator(message);
  loader.start();

  try {
    const result = await operation();
    if (successMessage) {
      loader.succeed(successMessage);
    } else {
      loader.stop();
    }
    return result;
  } catch (error) {
    loader.stop();
    throw error;
  }
}
