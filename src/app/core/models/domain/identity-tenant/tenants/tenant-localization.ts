export interface TenantLocalization {
  id: string;
  tenantId: string;
  languageCode: string; // en-US, pt-BR, es-ES, fr-FR
  resourceKey: string; // company_description, welcome_message, etc.
  translatedValue: string;
  createdAt: string;
  updatedAt?: string;
  translatedByUserId?: string;
}
