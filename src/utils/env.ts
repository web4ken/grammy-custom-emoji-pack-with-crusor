export function env(
  variable: string,
  opts: { required: false }
): string | undefined;
export function env(variable: string, opts: { required: true }): string;
export function env(variable: string, opts: { required: boolean }) {
  const value = process.env[variable] || undefined;

  if (opts.required && value == null) {
    throw new Error(`No ${variable} present`);
  }

  return value;
}
