export enum TaxIdType {
  None = 0,

  // Brasil
  Cnpj = 1,           // Cadastro Nacional de Pessoa Jurídica
  Cpf = 2,            // Cadastro de Pessoa Física
  Ie = 3,             // Inscrição Estadual
  Im = 4,             // Inscrição Municipal

  // Estados Unidos
  Ein = 10,           // Employer Identification Number
  Ssn = 11,           // Social Security Number

  // Europa
  Vat = 20,           // Value Added Tax Number
  Eori = 21,          // Economic Operators Registration and Identification

  // Reino Unido
  Utr = 30,           // Unique Taxpayer Reference
  CompanyNumber = 31, // Companies House Number

  // França
  Siret = 40,         // Système d'Identification du Répertoire des Établissements
  Siren = 41,         // Système d'Identification du Répertoire des Entreprises

  // Alemanha
  StNr = 50,          // Steuernummer (Tax Number)
  UStIdNr = 51,       // Umsatzsteuer-Identifikationsnummer (VAT ID)

  // Austrália
  Abn = 60,           // Australian Business Number
  Acn = 61,           // Australian Company Number
  Tfn = 62,           // Tax File Number

  // Canadá
  Bn = 70,            // Business Number
  Sin = 71,           // Social Insurance Number

  // China
  Usci = 80,          // Unified Social Credit Identifier

  // Japão
  Cn = 90,            // Corporate Number (法人番号)

  // Índia
  Gst = 100,          // Goods and Services Tax Identification Number
  Pan = 101,          // Permanent Account Number

  // México
  Rfc = 110,          // Registro Federal de Contribuyentes

  // Outros
  Other = 999
}
