import type { SharePayload } from "./shareInvoice";
import { coerceSharePayload } from "./shareInvoice";

const MAP_KEY = "onelink-inv-short-v1";

type MapShape = Record<string, SharePayload>;

function readMap(): MapShape {
  try {
    const r = localStorage.getItem(MAP_KEY);
    return r ? (JSON.parse(r) as MapShape) : {};
  } catch {
    return {};
  }
}

function writeMap(m: MapShape) {
  localStorage.setItem(MAP_KEY, JSON.stringify(m));
}

/** URL-safe slug from customer name (path segment). */
export function customerNameSlug(name: string): string {
  const s = (name.trim() || "customer")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
  return s || "customer";
}

function storageKey(customerSlug: string, invoiceNo: string) {
  return `${customerSlug.toLowerCase()}|${invoiceNo.trim()}`;
}

/**
 * Canonical host for short links (production marketing site or single domain).
 * Example: https://www.onelink.cards — must serve `/api/invoice-share/public` and host or proxy `/i/*` to the billing app.
 */
function publicInvoiceOrigin(): string {
  const fromEnv = import.meta.env.VITE_PUBLIC_INVOICE_HOST as string | undefined;
  if (fromEnv?.trim()) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/** Short public path only (no origin). */
export function getShortSharePath(payload: SharePayload): string {
  const slug = customerNameSlug(payload.buyerName);
  const enc = encodeURIComponent(payload.invoiceNo.trim());
  return `/i/${slug}/${enc}`;
}

/** Full URL customers open (one domain in production). */
export function getShortShareUrl(payload: SharePayload): string {
  const origin = publicInvoiceOrigin();
  return `${origin}${getShortSharePath(payload)}`;
}

function persistLocal(payload: SharePayload): void {
  const slug = customerNameSlug(payload.buyerName);
  const inv = payload.invoiceNo.trim();
  const map = readMap();
  map[storageKey(slug, inv)] = payload;
  writeMap(map);
}

/**
 * Sync payload to Supabase via your Next.js API (server holds service role).
 * Set VITE_INVOICE_SYNC_URL + VITE_ONELINK_INVOICE_SECRET in the billing app build.
 */
export async function syncSharePayloadToServer(payload: SharePayload): Promise<boolean> {
  const url = (import.meta.env.VITE_INVOICE_SYNC_URL as string | undefined)?.trim();
  const secret = (import.meta.env.VITE_ONELINK_INVOICE_SECRET as string | undefined)?.trim();
  if (!url || !secret) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Onelink-Invoice-Secret": secret,
      },
      body: JSON.stringify({ payload }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Persist locally, fire server sync, return share URL (sync may still be in flight unless you await it separately). */
export function saveAndGetShortShareUrl(payload: SharePayload): string {
  persistLocal(payload);
  void syncSharePayloadToServer(payload);
  return getShortShareUrl(payload);
}

/** Await server sync, then return URL (use for copy / save). */
export async function saveShareAndGetUrlSynced(payload: SharePayload): Promise<string> {
  persistLocal(payload);
  await syncSharePayloadToServer(payload);
  return getShortShareUrl(payload);
}

function loadLocal(customerSlug: string, invoiceNo: string): SharePayload | null {
  const map = readMap();
  return map[storageKey(customerSlug, invoiceNo)] ?? null;
}

function publicApiBase(): string | undefined {
  const b = (import.meta.env.VITE_INVOICE_SHARE_PUBLIC_BASE as string | undefined)?.trim();
  return b ? b.replace(/\/$/, "") : undefined;
}

/** Load payload: tries Next public API first, then same-browser localStorage. */
export async function loadShortSharePayload(
  customerSlug: string,
  invoiceNoParam: string,
): Promise<SharePayload | null> {
  const invoiceNo = decodeURIComponent(invoiceNoParam);
  const base = publicApiBase();
  if (base) {
    try {
      const u = new URL(`${base}/api/invoice-share/public`);
      u.searchParams.set("customer_slug", customerSlug);
      u.searchParams.set("invoice_no", invoiceNo);
      const res = await fetch(u.toString());
      if (res.ok) {
        const j = (await res.json()) as { payload?: unknown };
        if (j.payload && typeof j.payload === "object" && j.payload !== null) {
          const parsed = coerceSharePayload(j.payload as Record<string, unknown>);
          if (parsed) return parsed;
        }
      }
    } catch {
      /* fall through */
    }
  }
  return loadLocal(customerSlug, invoiceNo);
}
