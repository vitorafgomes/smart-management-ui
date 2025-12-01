export interface KeycloakRole {
  id: string;
  name: string;
  description: string;
  composite: boolean;
  clientRole: boolean;
  containerId: string;
  attributes: Record<string, string[]>;
}
