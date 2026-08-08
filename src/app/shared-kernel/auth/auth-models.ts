/**
 * Mock auth contract. Shaped like the session the real identity provider will hand back so the
 * swap is a service change rather than a consumer change, but nothing here is real: no tokens,
 * no refresh, no expiry. See vault/pages/decisions/0002-mock-first-auth-and-data.md.
 */
export interface AuthUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly initials: string;
}

export interface AuthSession {
  readonly user: AuthUser;
  readonly issuedAt: number;
}

export interface Credentials {
  readonly username: string;
  readonly password: string;
}

export interface Registration {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

export type LoginResult = { readonly ok: true } | { readonly ok: false; readonly reason: string };

export type RegisterResult =
  { readonly ok: true } | { readonly ok: false; readonly reason: string };
