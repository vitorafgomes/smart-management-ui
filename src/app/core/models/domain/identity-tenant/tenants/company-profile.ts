import { TaxIdType } from '../tax-id-type';
import { BusinessType } from './business-type';
import { CompanySize } from '../company-size';

export interface CompanyProfile {
  id: string;
  tenantId: string;

  // Identificação Internacional
  taxIdType: TaxIdType; // CNPJ, CPF, EIN, VAT, ABN, etc.
  taxId: string; // Número do documento fiscal
  secondaryTaxId: string; // Para países com múltiplos IDs
  vatNumber: string; // VAT/IVA Number (Europa)
  companyRegistrationNumber: string; // Companies House (UK), SIRET (FR), etc.

  // Nomes da Empresa (Multi-idioma)
  legalName: string; // Razão Social / Legal Name
  tradeName: string; // Nome Fantasia / Trading Name
  legalNameLocal: string; // Nome em alfabeto local (Kanji, Cirílico, etc.)
  tradeNameLocal: string;

  // Tipo de Empresa
  businessType: BusinessType;
  industry: string; // NAICS, ISIC, CNAE codes
  companySize: CompanySize;

  // Endereço Principal (Suporta formatos internacionais)
  address: string; // JSON com endereço completo
  city: string;
  stateProvince: string; // State (US), Province (CA), Prefecture (JP)
  postalCode: string;
  countryCode: string; // ISO 3166-1 alpha-2
  countryName: string;

  // Contato
  phoneCountryCode: string; // +1, +55, +44
  phone: string;
  mobile: string;
  fax: string;
  email: string;
  website: string;

  // Informações Corporativas
  foundationDate?: string;
  incorporationDate?: string;
  incorporationCountry: string;
  annualRevenue?: number;
  revenueCurrency: string;
  employeeCount?: number;

  // Informações Bancárias (Multi-país)
  bankAccounts: string; // Array de contas bancárias

  // Informações Adicionais
  description: string; // Multi-language descriptions
  socialMedia: string;

  // Pessoa de Contato
  contactPersonName: string;
  contactPersonTitle: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  contactPersonLanguage: string;

  // Verificação
  isVerified: boolean;
  verifiedAt?: string;
  verifiedByUserId?: string;
  verificationNotes: string;

  // Documentos de Verificação
  verificationDocuments: string; // URLs de documentos

  // Compliance
  complianceCertifications: string; // ISO, SOC2, etc.

  createdAt: string;
  updatedAt?: string;
}
