export enum BusinessType {
  None = 0,

  // Brasil
  Mei = 1,                    // Microempreendedor Individual
  Ei = 2,                     // Empresário Individual
  Eireli = 3,                 // Empresa Individual de Responsabilidade Limitada
  SociedadeLimitada = 4,      // Sociedade Limitada (Ltda)
  SociedadeAnonima = 5,       // Sociedade Anônima (S.A.)

  // Estados Unidos
  SoleProprietorship = 10,    // Sole Proprietorship
  Partnership = 11,           // Partnership
  Llc = 12,                   // Limited Liability Company
  Corporation = 13,           // Corporation
  SCorporation = 14,          // S-Corporation
  NonProfit = 15,             // Non-Profit Organization

  // Reino Unido
  SoleTrader = 20,            // Sole Trader
  LimitedCompany = 21,        // Limited Company (Ltd)
  PublicLimitedCompany = 22,  // Public Limited Company (PLC)
  LimitedLiabilityPartnership = 23, // LLP

  // Europa
  GmbH = 30,                  // Gesellschaft mit beschränkter Haftung (Alemanha)
  Ag = 31,                    // Aktiengesellschaft (Alemanha, Suíça)
  Sarl = 32,                  // Société à Responsabilité Limitée (França)
  Sa = 33,                    // Société Anonyme (França)
  Srl = 34,                   // Società a Responsabilità Limitata (Itália)
  SpA = 35,                   // Società per Azioni (Itália)
  Bv = 36,                    // Besloten Vennootschap (Holanda)
  Nv = 37,                    // Naamloze Vennootschap (Holanda)

  // Ásia
  Kk = 40,                    // Kabushiki Kaisha (株式会社) - Japan
  Gk = 41,                    // Godo Kaisha (合同会社) - Japan
  PtyLtd = 42,                // Proprietary Limited (Australia)
  PvtLtd = 43,                // Private Limited (Índia)

  // América Latina
  SrlLatam = 50,             // Sociedad de Responsabilidad Limitada
  SaLatam = 51,              // Sociedad Anónima

  Other = 999
}
