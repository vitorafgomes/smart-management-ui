import { SmtpSettings } from './smtp-settings';

export interface EmailSettings {
  fromName: { [key: string]: string };
  fromEmail: string;
  replyToEmail: string;
  footer: { [key: string]: string };
  smtpSettings: SmtpSettings;
}
