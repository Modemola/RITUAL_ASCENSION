export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === "object" && error) {
    const maybeError = error as { code?: unknown; message?: unknown; reason?: unknown };
    if (typeof maybeError.message === "string" && maybeError.message) return maybeError.message;
    if (typeof maybeError.reason === "string" && maybeError.reason) return maybeError.reason;
    if (maybeError.code === 4001) return "The wallet request was rejected.";
  }

  if (typeof error === "string" && error) return error;

  return fallback;
}
