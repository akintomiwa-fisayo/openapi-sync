/**
 * Progress logger for CLI and programmatic APIs.
 * Writes to stderr so stdout stays clean for `--json` output.
 */
export type ProgressLogger = {
  log: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

export const makeLogger = (silent: boolean): ProgressLogger => ({
  log: (...args: unknown[]) => {
    if (!silent) console.error(...args);
  },
  info: (...args: unknown[]) => {
    if (!silent) console.error(...args);
  },
  warn: (...args: unknown[]) => {
    if (!silent) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (!silent) console.error(...args);
  },
});
