export interface InternationalAddress {
  addressLine1: string;        // Rua + Número / Street + Number
  addressLine2: string;        // Complemento / Apt, Suite
  addressLine3: string;        // Referência adicional
  neighborhood: string;        // Bairro (BR) / District
  city: string;
  stateProvince: string;       // Estado/Província/Prefecture
  stateProvinceCode: string;   // SP, CA, TYO
  postalCode: string;
  countryCode: string;         // ISO 3166-1 alpha-2
  countryName: string;
  latitude?: number;
  longitude?: number;
  formattedAddress: string;    // Endereço formatado completo
}
