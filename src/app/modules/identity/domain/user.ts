import { IdentityEntity } from './identity-entity';

export interface User extends IdentityEntity {
  readonly userName: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly isActive: boolean;
  readonly emailVerified: boolean;
  readonly phoneNumber?: string;
  readonly lastLoginAt?: string;
  readonly roleIds: readonly string[];
}

/** What the create form produces. Identity and timestamps belong to whoever stores the record. */
export interface NewUser {
  readonly userName: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phoneNumber?: string;
  readonly isActive: boolean;
  readonly emailVerified: boolean;
  readonly roleIds: readonly string[];
}

export type UserEdit = NewUser;

export function fullName(user: User): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

/**
 * The listing search. Legacy sent `userName` and `email` as two `Contains` filters, which the
 * API OR-ed together; matching the full name as well is the same intent expressed once.
 */
export function matchesUser(user: User, term: string): boolean {
  const search = term.trim().toLowerCase();
  if (!search) {
    return true;
  }

  return [user.userName, user.email, fullName(user)].some((field) =>
    field.toLowerCase().includes(search),
  );
}

/**
 * A username is unique per tenant. The rule lives here rather than in the adapter because it is
 * what makes a create fail, and the failure has to read the same whichever adapter enforces it.
 */
export function isUserNameTaken(
  users: readonly User[],
  userName: string,
  excludingId?: string,
): boolean {
  const candidate = userName.trim().toLowerCase();

  return users.some((user) => user.id !== excludingId && user.userName.toLowerCase() === candidate);
}
