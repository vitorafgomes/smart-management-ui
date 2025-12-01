export interface SubscriptionFeatures {
  hasInvoicing: boolean;
  hasInventory: boolean;
  hasHr: boolean;
  hasCrm: boolean;
  hasReports: boolean;
  hasApiAccess: boolean;
  hasWhiteLabel: boolean;
  hasPrioritySupport: boolean;
  hasMultiCurrency: boolean;
  maxInvoicesPerMonth: number;
  maxProductsPerTenant: number;
}
