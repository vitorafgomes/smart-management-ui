import { Environment } from './environment.model';

// Production configuration: the published site is landing-only for this release, per the
// product decision to ship login and the back office in a later version. Flip this back to
// `true` to re-enable auth for a future release - that one line is the whole rollback.
export const environment: Environment = {
  authEnabled: false,
};
