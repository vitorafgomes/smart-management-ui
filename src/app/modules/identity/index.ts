import { Provider } from '@angular/core';
import { Routes } from '@angular/router';

import {
  PERMISSION_REPOSITORY,
  ROLE_REPOSITORY,
  USER_REPOSITORY,
} from './application/identity-ports';
import { IdentityMockConfig } from './infrastructure/identity-mock-config';
import { InMemoryPermissionRepository } from './infrastructure/in-memory-permission-repository';
import { InMemoryRoleRepository } from './infrastructure/in-memory-role-repository';
import { InMemoryUserRepository } from './infrastructure/in-memory-user-repository';
import { IDENTITY_SCREEN_ROUTES } from './ui/identity.routes';

/**
 * The identity module's public API. Everything the shell may know about this module is on this
 * page; nothing outside it imports a path inside `modules/identity/`
 * ([[vault/pages/invariants/module-boundaries]]).
 *
 * This file is also the module's composition root - the one place allowed to name both a port and
 * an adapter. Going live against a real API is three `useClass` lines here and nothing else:
 * `domain/`, `application/` and `ui/` never learn which adapter they got (ADR 0002).
 */
const IDENTITY_PROVIDERS: readonly Provider[] = [
  IdentityMockConfig,
  { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
  { provide: ROLE_REPOSITORY, useClass: InMemoryRoleRepository },
  { provide: PERMISSION_REPOSITORY, useClass: InMemoryPermissionRepository },
];

/** Lazy-loaded by the shell under the authenticated layout. */
export const identityRoutes: Routes = [
  {
    path: '',
    providers: [...IDENTITY_PROVIDERS],
    children: IDENTITY_SCREEN_ROUTES,
  },
];
