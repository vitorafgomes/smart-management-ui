export interface BankAccount {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  routingNumber: string;       // US
  sortCode: string;            // UK
  iban: string;                // Europa
  swiftBic: string;            // Internacional
  bsb: string;                 // Australia
  ifsc: string;                // India
  branchCode: string;
  countryCode: string;
  currency: string;
  isPrimary: boolean;
}
