export interface TaxRate {
  name: string;
  rate: number;
  isDefault: boolean;
  applicableFrom?: string;
  applicableTo?: string;
}
