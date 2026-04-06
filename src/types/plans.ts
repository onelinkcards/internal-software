export type MaintenanceOption = {
  id: string;
  label: string;
  price: number;
};

export type PlanRow = {
  id: string;
  name: string;
  orderAmount: number;
  maintenanceOptions: MaintenanceOption[];
};

export type BulkTier = { minQty: number; percent: number };

export type PlansReference = {
  currency: string;
  gstRatePercent: number;
  plans: PlanRow[];
  bulkDiscountTiers: BulkTier[];
  addOns: unknown[];
};
