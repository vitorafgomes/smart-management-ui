export interface UpdateUserRequest {
  id: string;
  tenantId: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  displayName?: string;
  phoneCountryCode?: string;
  phone?: string;
  mobile?: string;
  avatarUrl?: string;
  preferredLanguage?: string;
  preferredTimezone?: string;
  preferredCurrency?: string;
  preferredDateFormat?: string;
  preferredTimeFormat?: string;
  countryCode?: string;
  city?: string;
  stateProvince?: string;
  spokenLanguages?: string;
  workingHours?: string;
  password?: string;
  confirmPassword?: string;
}
