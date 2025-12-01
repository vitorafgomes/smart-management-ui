export interface Permission {
  id: string;
  tenantId: string;
  resource: string;
  action: string;
  displayName: string;
  description: string;
  category: string;
  isSystemPermission: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
}
