import { NumberFormatSettings } from './number-format-settings';
import { TaxSettings } from './tax-settings';
import { InvoiceSettings } from './invoice-settings';
import { EmailSettings } from './email-settings';
import { NotificationSettings } from './notification-settings';
import { SecuritySettings } from './security-settings';
import { UiSettings } from './ui-settings';
import { IntegrationConfig } from './integration-config';

export interface AddTenantSettings {
  tenantId: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  defaultCurrency: string;
  supportedCurrencies: string[];
  defaultTimezone: string;
  countryCode: string;
  dateFormat: string;
  timeFormat: string;
  fiscalYearStart: string;
  weekStartDay: number;
  numberFormat: NumberFormatSettings;
  measurementSystem: string;
  temperatureUnit: string;
  taxSettings: TaxSettings;
  invoiceSettings: InvoiceSettings;
  emailSettings: EmailSettings;
  notificationSettings: NotificationSettings;
  securitySettings: SecuritySettings;
  theme: string;
  uiSettings: UiSettings;
  integrations: { [key: string]: IntegrationConfig };
  countrySpecificSettings: any;
  customSettings: any;
}
