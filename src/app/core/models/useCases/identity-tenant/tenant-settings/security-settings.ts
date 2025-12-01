export interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSpecialChar: boolean;
  passwordExpiryDays?: number;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  requireTwoFactor: boolean;
  allowedTwoFactorMethods: string[];
  ipWhitelist: string[];
  ipBlacklist: string[];
  allowedCountries: string[];
}
