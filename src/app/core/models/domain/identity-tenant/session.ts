import { DeviceInfo } from './device-info';

export interface Session {
  id: string;
  tenantId: string;
  userId: string;
  sessionId: string; // Gerado pela aplicação
  keycloakSessionId: string;
  accessToken: string;
  refreshToken: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo: DeviceInfo;
  isActive: boolean;
  lastActivity: string;
  createdAt: string;
  expiresAt: string;
}
