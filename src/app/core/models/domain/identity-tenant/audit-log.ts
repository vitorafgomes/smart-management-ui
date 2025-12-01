export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  userName: string;
  action: string; // LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW
  resource: string; // user, invoice, product, tenant
  resourceId?: string;
  resourceName: string;
  ipAddress: string;
  userAgent: string;
  method: string; // GET, POST, PUT, DELETE
  endpoint: string;
  statusCode?: number;
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  metadata: Record<string, any>;
  isSuccess: boolean;
  errorMessage: string;
  durationMs: number; // Duração da operação em ms
  timestamp: string;
}
