/**
 * What a repository rejects with. Every port failure is one of these, so the facades have a
 * typed failure to translate into a user-visible message (root Rule G) instead of inspecting an
 * `unknown` and guessing at its shape - which is what the legacy screens did with `err?.error?.detail`.
 */
export type IdentityErrorKind = 'not-found' | 'conflict' | 'validation' | 'unavailable';

export class IdentityError extends Error {
  constructor(
    readonly kind: IdentityErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'IdentityError';
  }
}

/**
 * The single place a caught `unknown` becomes something renderable. An unrecognised failure gets
 * a generic message rather than leaking a stack trace or an empty string into the UI.
 */
export function toUserMessage(cause: unknown, fallback: string): string {
  if (cause instanceof IdentityError) {
    return cause.message;
  }

  return fallback;
}
