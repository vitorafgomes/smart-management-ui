import { KeycloakCredential } from './keycloak-credential';

export interface KeycloakUser {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  createdTimestamp: number;
  attributes: Record<string, string[]>;
  requiredActions: string[];
  credentials: KeycloakCredential[];
  realmRoles: string[];
  clientRoles: Record<string, string[]>;
}
