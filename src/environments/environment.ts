import { Environment } from './environment.model';

// Development configuration - used by `ng serve`, `ng test` and the Playwright `webServer`.
// Auth stays on here so the full app, including every login/register/protected-route suite,
// keeps working unchanged. The production build replaces this file via angular.json
// fileReplacements; this one is never swapped out.
export const environment: Environment = {
  authEnabled: true,
};
