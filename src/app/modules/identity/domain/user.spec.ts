import { fullName, isUserNameTaken, matchesUser, User } from './user';

function aUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-01',
    tenantId: 'smart-management',
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-01-15T09:00:00.000Z',
    userName: 'ada',
    email: 'ada.lovelace@smart-management.local',
    firstName: 'Ada',
    lastName: 'Lovelace',
    isActive: true,
    emailVerified: true,
    roleIds: [],
    ...overrides,
  };
}

describe('fullName', () => {
  it('joins the given and family names', () => {
    expect(fullName(aUser())).toBe('Ada Lovelace');
  });

  it('leaves no trailing space when a name part is blank', () => {
    expect(fullName(aUser({ lastName: '' }))).toBe('Ada');
  });
});

describe('matchesUser', () => {
  it('keeps every user when the term is blank', () => {
    expect(matchesUser(aUser(), '   ')).toBe(true);
  });

  it('matches on the username', () => {
    expect(matchesUser(aUser(), 'AD')).toBe(true);
  });

  it('matches on the email', () => {
    expect(matchesUser(aUser(), 'lovelace@smart')).toBe(true);
  });

  it('matches on the full name across the two name fields', () => {
    expect(matchesUser(aUser(), 'ada love')).toBe(true);
  });

  it('rejects a term that appears nowhere', () => {
    expect(matchesUser(aUser(), 'hopper')).toBe(false);
  });
});

describe('isUserNameTaken', () => {
  const users = [aUser(), aUser({ id: 'user-02', userName: 'grace' })];

  it('reports a clash regardless of case', () => {
    expect(isUserNameTaken(users, 'ADA')).toBe(true);
  });

  it('does not count the record being edited as its own clash', () => {
    expect(isUserNameTaken(users, 'ada', 'user-01')).toBe(false);
  });

  it('reports a free username', () => {
    expect(isUserNameTaken(users, 'alan')).toBe(false);
  });
});
