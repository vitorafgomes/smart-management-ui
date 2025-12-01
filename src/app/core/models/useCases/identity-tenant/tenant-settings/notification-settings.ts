import { NotificationChannel } from './notification-channel';

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  webhookNotifications: boolean;
  notificationLanguage: string;
  channels: { [key: string]: NotificationChannel };
}
