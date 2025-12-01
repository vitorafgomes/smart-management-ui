import { NumberFormatSettings } from '../number-format-settings';
import { TaxSettings } from '../tax-settings';
import { InvoiceSettings } from '../invoice-settings';
import { EmailSettings } from '../email-settings';
import { NotificationSettings } from '../notification-settings';
import { SecuritySettings } from '../security-settings';
import { UiSettings } from '../ui-settings';
import { IntegrationConfig } from '../integration-config';

export interface TenantSettings {
  id: string;
  tenantId: string;

  // Configurações Regionais
  defaultLanguage: string;
  supportedLanguages: string[];
  defaultCurrency: string;
  supportedCurrencies: string[];
  defaultTimezone: string;
  countryCode: string;

  // Formatos
  dateFormat: string;
  timeFormat: string;
  fiscalYearStart: string;
  weekStartDay: number; // 0 = Sunday, 1 = Monday

  // Formato de Números
  numberFormat: NumberFormatSettings;

  // Sistema de Medidas
  measurementSystem: string; // metric, imperial
  temperatureUnit: string; // celsius, fahrenheit

  // Configurações Financeiras
  taxSettings: TaxSettings;
  invoiceSettings: InvoiceSettings;

  // Email
  emailSettings: EmailSettings;

  // Notificações
  notificationSettings: NotificationSettings;

  // Segurança
  securitySettings: SecuritySettings;

  // Interface
  theme: string;
  uiSettings: UiSettings;

  // Integrations
  integrations: Record<string, IntegrationConfig>;

  // Localização Específica por País
  countrySpecificSettings: Record<string, any>;
  customSettings: Record<string, any>;

  createdAt: string;
  updatedAt?: string;
}
