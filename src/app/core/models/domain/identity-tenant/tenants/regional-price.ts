export interface RegionalPrice {
  region: string;      // US, EU, BR, APAC
  price: number;
  currency: string;
  taxRate?: number;
}
