export interface AddBranding {
  tenantId: string;
  logoUrl: string;
  logoSmallUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  customCss: string;
  loginPageBackground: string;
  emailHeaderImage: string;
  invoiceTemplate: string;
  customHtml: { [key: string]: string };
}
