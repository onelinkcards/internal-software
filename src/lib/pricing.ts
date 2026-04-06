import type { BulkTier, MaintenanceOption, PlanRow } from "../types/plans";
import { round2 } from "./gst";

export function bulkDiscountPercent(quantity: number, tiers: BulkTier[]): number {
  if (quantity < 1 || tiers.length === 0) return 0;
  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);
  let pct = 0;
  for (const t of sorted) {
    if (quantity >= t.minQty) pct = t.percent;
  }
  return pct;
}

export function getMaintenance(
  plan: PlanRow,
  maintenanceId: string | undefined,
): MaintenanceOption {
  const m =
    plan.maintenanceOptions.find((o) => o.id === maintenanceId) ??
    plan.maintenanceOptions[0];
  return m;
}

/** Per-seat GST-inclusive unit = plan order + selected maintenance. */
export function unitInclusiveCatalog(plan: PlanRow, maintenanceId: string | undefined): number {
  const m = getMaintenance(plan, maintenanceId);
  return plan.orderAmount + m.price;
}

export function catalogueGrossSubtotal(
  plan: PlanRow,
  maintenanceId: string | undefined,
  quantity: number,
): number {
  const unit = unitInclusiveCatalog(plan, maintenanceId);
  return round2(unit * Math.max(1, quantity));
}

export type DiscountPipelineInput = {
  grossInclusive: number;
  quantity: number;
  tiers: BulkTier[];
  extraDiscountPercent: number;
  extraDiscountFixed: number;
  overrideTotal: number | null;
};

export type DiscountPipelineResult = {
  gross: number;
  bulkPercent: number;
  bulkAmount: number;
  afterBulk: number;
  extraPercentAmount: number;
  afterExtraPercent: number;
  fixedAmount: number;
  beforeOverride: number;
  finalInclusive: number;
  usedOverride: boolean;
};

/**
 * Apply bulk on gross, then optional % on afterBulk, then fixed ₹, then optional override.
 */
export function applyDiscountPipeline(input: DiscountPipelineInput): DiscountPipelineResult {
  const gross = round2(Math.max(0, input.grossInclusive));
  const qty = Math.max(1, input.quantity);
  const bulkPct = bulkDiscountPercent(qty, input.tiers);
  const bulkAmount = round2(gross * (bulkPct / 100));
  const afterBulk = round2(gross - bulkAmount);

  const ep = Math.min(100, Math.max(0, input.extraDiscountPercent));
  const extraPercentAmount = round2(afterBulk * (ep / 100));
  const afterExtraPercent = round2(afterBulk - extraPercentAmount);

  const fixedAmount = round2(Math.max(0, input.extraDiscountFixed));
  const beforeOverride = round2(Math.max(0, afterExtraPercent - fixedAmount));

  const usedOverride =
    input.overrideTotal != null &&
    Number.isFinite(input.overrideTotal) &&
    input.overrideTotal >= 0;
  const finalInclusive = usedOverride
    ? round2(input.overrideTotal as number)
    : beforeOverride;

  return {
    gross,
    bulkPercent: bulkPct,
    bulkAmount,
    afterBulk,
    extraPercentAmount,
    afterExtraPercent,
    fixedAmount,
    beforeOverride,
    finalInclusive,
    usedOverride,
  };
}
