export interface UserNotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  browser: boolean;
  categories: Record<string, boolean>;
}
