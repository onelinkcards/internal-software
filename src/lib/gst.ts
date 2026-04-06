/**
 * GST @ 18% inclusive pricing: split total GST-inclusive amount into taxable + tax.
 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const GST_FACTOR = 1.18;

export function splitGstInclusive(inclusive: number): {
  taxable: number;
  gst: number;
  inclusive: number;
} {
  const safe = Math.max(0, inclusive);
  const taxable = round2(safe / GST_FACTOR);
  const gst = round2(safe - taxable);
  return { taxable, gst, inclusive: safe };
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
  const { taxable, gst } = splitGstInclusive(finalInclusive);
  const intra = buyerStateCode === sellerStateCode;
  if (intra) {
    const half = round2(gst / 2);
    return { taxable, cgst: half, sgst: half, igst: 0, isIntra: true };
  }
  return { taxable, cgst: 0, sgst: 0, igst: gst, isIntra: false };
}
