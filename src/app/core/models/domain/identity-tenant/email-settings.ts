import { SmtpSettings } from './smtp-settings';

export interface EmailSettings {
  fromName: Record<string, string>; // Multi-language
  fromEmail: string;
  replyToEmail: string;
  footer: Record<string, string>; // Multi-language
  smtpSettings: SmtpSettings;
}
