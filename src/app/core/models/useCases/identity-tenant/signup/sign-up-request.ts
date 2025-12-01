export interface SignUpRequest {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  tenant?: string;
  countryCode?: string;
}