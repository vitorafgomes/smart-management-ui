import { TenantStatus } from './tenant-status';

export interface Tenant {
  id: string;
  companyName: string;
  subdomain: string;
  customDomain: string; // ex: app.mycompany.com
  keycloakRealmId: string;
  keycloakRealmName: string;
  status: TenantStatus;
  logoUrl?: string; // URL da logo do tenant

  // Internacionalização
  defaultLanguage: string; // en-US, pt-BR, es-ES, fr-FR, de-DE, zh-CN, ja-JP
  defaultCurrency: string; // USD, EUR, BRL, GBP, JPY, CNY
  defaultTimezone: string; // America/New_York, Europe/London, Asia/Tokyo
  countryCode: string; // US, BR, GB, FR, DE, CN, JP (ISO 3166-1 alpha-2)
  regionCode: string; // NAM (North America), EUR (Europe), APAC (Asia-Pacific), LATAM (Latin America)

  // Compliance & Privacy
  gdprCompliant: boolean; // Para Europa
  lgpdCompliant: boolean; // Para Brasil
  ccpaCompliant: boolean; // Para Califórnia
  dataResidencyRegion: string; // us-east-1, eu-west-1, ap-southeast-1
  allowDataTransfer: boolean; // Permitir transferência internacional de dados

  // Configurações Regionais
  dateFormat: string; // MM/DD/YYYY (US), DD/MM/YYYY (BR/EU), YYYY-MM-DD (ISO)
  timeFormat: string; // 12h, 24h
  decimalSeparator: string; // "." (US), "," (BR/EU)
  thousandsSeparator: string; // "," (US), "." (BR/EU)
  measurementSystem: string; // metric, imperial

  // Configurações Fiscais/Contábeis
  fiscalYearStart: string; // 01-01, 04-01 (UK), 07-01 (Australia)
  weekStartDay: number; // Sunday (US), Monday (EU/BR)

  // Contato Internacional
  phoneCountryCode: string; // +1 (US), +55 (BR), +44 (UK), +81 (JP)
  postalCodeFormat: string; // 00000-000 (BR), 00000 (US), 00000-0000 (JP)

  // Multi-Language Support
  supportedLanguages: string; // ["en-US", "pt-BR", "es-ES"]
  supportedCurrencies: string; // ["USD", "BRL", "EUR"]

  // Timestamps
  createdAt: string;
  createdBy: string;
  activatedAt?: string;
  suspendedAt?: string;
  modifiedAt?: string;
  modifiedBy: string;
  deletedAt?: string;
  isDeleted: boolean;
  suspensionReason: string;
}
