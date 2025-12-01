export interface AddUserRequest {
  tenantId: string;
  keycloakUserId?: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  displayName?: string;
  phoneCountryCode?: string;
  phone?: string;
  mobile?: string;
  avatarUrl?: string;
  isAdmin: boolean;
  isActive: boolean;
  preferredLanguage?: string;
  preferredTimezone?: string;
  preferredCurrency?: string;
  countryCode?: string;
  city?: string;
  stateProvince?: string;
}
