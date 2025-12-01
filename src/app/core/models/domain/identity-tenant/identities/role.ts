import { Permission } from './permission';

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  normalizedName: string;
  description: string;
  keycloakRoleId: string;
  isComposite: boolean; // Indica se é uma role composta (contém outras roles)
  isSystemRole: boolean; // Roles padrão do sistema (não podem ser deletadas)
  isActive: boolean;
  userCount: number; // Quantidade de usuários com esta role
  priority: number; // Para ordenação/hierarquia
  createdAt: string;
  updatedAt?: string;
  createdByUserId?: string;
  permissions?: Permission[]; // Permissions associadas a esta role
}
