export type InvoiceTemplateConfig = {
  logoPath?: string;
  defaultPaymentMode?: string;
  defaultUpiText?: string;
  termsParagraph?: string;
  thankYouLine?: string;
  /** Short bold line above footer contact (e.g. contract reference). */
  footerContractLine?: string;
  /** For UPI QR / Pay now (e.g. merchant@upi). */
  upiId?: string;
  upiPayeeName?: string;
};

export type CompanyConfig = {
  legalName: string;
  tradeBrand: string;
  constitution: string;
  cin: string;
  gstin: string;
  state: string;
  stateCode: string;
  addressLines: string[];
  contact: { email: string; phoneDisplay: string };
  invoiceTemplate?: InvoiceTemplateConfig;
};

