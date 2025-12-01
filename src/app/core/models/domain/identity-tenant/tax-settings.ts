import { TaxRate } from './tax-rate';

export interface TaxSettings {
  defaultTaxRate: number;
  taxType: string; // VAT, GST, Sales Tax, IVA
  taxInclusivePricing: boolean;
  taxNumber: string;
  multiTaxRates: TaxRate[];
  reversedChargeApplicable: boolean; // Para transações intra-EU
}
