export interface UserRole {
  userId: string;
  roleId: string;
  roleName: string;
  roleDescription?: string;
  isSystemRole: boolean;
  assignedAt: string;
  assignedByUserId?: string;
  expiresAt?: string;
}