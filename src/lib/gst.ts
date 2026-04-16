/**
 * GST @ 18% inclusive pricing: split total GST-inclusive amount into taxable + tax.
 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const GST_FACTOR = 1.18;

export type GSTInclusiveResult = {
  taxableValue: number;
  cgst: number;
  sgst: number;
  total: number;
};

/**
 * GST-inclusive calculation.
 *
 * Rules:
 * - Do not add GST on top of total; total already includes GST
 * - For 50%, split the total first, then reverse-calculate GST on that half
 * - Always round to 2 decimals
 * - Ensure taxable + cgst + sgst = total exactly
 */
export function calculateGSTInclusive(
  totalAmount: number,
  percentage: 50 | 100 = 100,
): GSTInclusiveResult {
  const baseTotal = round2(Math.max(0, totalAmount) * (percentage / 100));
  const taxableValue = round2(baseTotal / GST_FACTOR);
  const gstAmount = round2(baseTotal - taxableValue);
  const cgst = round2(gstAmount / 2);
  const sgst = round2(baseTotal - taxableValue - cgst);

  return {
    taxableValue,
    cgst,
    sgst,
    total: round2(taxableValue + cgst + sgst),
  };
}

export function splitGstInclusive(inclusive: number): {
  taxable: number;
  gst: number;
  inclusive: number;
} {
  const safe = round2(Math.max(0, inclusive));
  const { taxableValue, cgst, sgst, total } = calculateGSTInclusive(safe, 100);
  return { taxable: taxableValue, gst: round2(cgst + sgst), inclusive: total };
}

/** Intra-state (buyer state === seller 01): CGST 9% + SGST 9%. Else IGST 18%. */
export function taxColumnsForInvoice(
  finalInclusive: number,
  buyerStateCode: string,
  sellerStateCode: string,
): {
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  isIntra: boolean;
} {
  const safe = round2(Math.max(0, finalInclusive));
  const { taxableValue, cgst, sgst, total } = calculateGSTInclusive(safe, 100);
  const intra = buyerStateCode === sellerStateCode;
  if (intra) {
    return { taxable: taxableValue, cgst, sgst, igst: 0, isIntra: true };
  }
  const igst = round2(total - taxableValue);
  return { taxable: taxableValue, cgst: 0, sgst: 0, igst, isIntra: false };
}
