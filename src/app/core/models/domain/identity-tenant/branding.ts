export interface Branding {
  id: string;
  tenantId: string;
  logoUrl: string;
  logoSmallUrl: string; // Para mobile/favicon
  faviconUrl: string;
  primaryColor: string; // #6366f1
  secondaryColor: string; // #8b5cf6
  accentColor: string; // #f43f5e
  backgroundColor: string;
  textColor: string;
  fontFamily: string; // Inter, Roboto, Poppins
  customCss: string;
  loginPageBackground: string; // URL da imagem
  emailHeaderImage: string;
  invoiceTemplate: string; // modern, classic, minimal
  customHtml: Record<string, string>; // header, footer, etc
  createdAt: string;
  updatedAt?: string;
}
