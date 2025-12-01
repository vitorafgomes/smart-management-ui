import { TaxRate } from './tax-rate';

export interface TaxSettings {
  defaultTaxRate: number;
  taxType: string;
  taxInclusivePricing: boolean;
  taxNumber: string;
  multiTaxRates: TaxRate[];
  reversedChargeApplicable: boolean;
}
