export interface Group {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  keycloakGroupId: string;
  parentGroupId?: string; // Para grupos hierárquicos
  isSystemGroup: boolean;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}
