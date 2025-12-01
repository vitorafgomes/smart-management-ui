import { DashboardWidget } from './dashboard-widget';
import { UserNotificationPreferences } from './user-notification-preferences';
import { TableSettings } from './table-settings';

export interface UserPreferences {
  id: string;
  userId: string;
  tenantId: string;
  theme: string; // light, dark, auto
  language: string;
  timezone: string;
  dashboardLayout: DashboardWidget[];
  notificationPreferences: UserNotificationPreferences;
  tableSettings: Record<string, TableSettings>;
  customSettings: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}
