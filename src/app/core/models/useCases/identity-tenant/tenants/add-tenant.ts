import { TenantStatus } from './tenant-status';
import { DayOfWeek } from '../tenant-settings/day-of-week';

export interface AddTenant {
  companyName: string;
  subdomain: string;
  customDomain: string;
  keycloakRealmId: string;
  keycloakRealmName: string;
  status: TenantStatus;
  defaultLanguage: string;
  defaultCurrency: string;
  defaultTimezone: string;
  countryCode: string;
  regionCode: string;
  gdprCompliant: boolean;
  lgpdCompliant: boolean;
  ccpaCompliant: boolean;
  dataResidencyRegion: string;
  allowDataTransfer: boolean;
  dateFormat: string;
  timeFormat: string;
  decimalSeparator: string;
  thousandsSeparator: string;
  measurementSystem: string;
  fiscalYearStart: string;
  weekStartDay: DayOfWeek;
  phoneCountryCode: string;
  postalCodeFormat: string;
  supportedLanguages: string;
  supportedCurrencies: string;
}
