# OneLink internal GST billing / proforma invoice — product spec

**Audience:** KRIYON GROUP PRIVATE LIMITED (OneLink) — internal team + occasional offline use in front of a customer (laptop/tablet).

**Design:** Simple, template-based, **not fancy**. Clean typography, plenty of whitespace, black/navy text, OneLink blue as accent only. Must **print cleanly** and export **PDF** (browser Print → Save as PDF is acceptable for v1).

---

## 1. Seller block (fixed from config)

Always show on the document:

| Field | Value / source |
|--------|----------------|
| Legal name | **KRIYON GROUP PRIVATE LIMITED** |
| Brand (optional subtitle) | OneLink |
| Constitution | Private Limited Company |
| CIN | U74909JK2025PTC017984 |
| GSTIN | 01AAMCK2092B1Z0 |
| Full address | As in `company.json` (Jammu address) |
| State / State code | Jammu & Kashmir / 01 |
| Contact | Phone + email (from config) |

**Logo:** Placeholder area or file path `assets/onelink-logo.png` (you supply). Keep max height ~40–48px.

---

## 2. Document type

Support at least:

- **Tax Invoice** (after payment received — optional checkbox “Payment received”).
- **Proforma / Quotation** (before payment — watermark or title “PROFORMA”).

Footer line: *“This is a computer-generated document.”* (and for proforma: *“Not valid as tax invoice until payment and final tax invoice issued.”* if your CA agrees.)

---

## 3. Buyer (customer) fields

Collect on the form:

- Customer / billing name  
- Business name (optional)  
- GSTIN (optional — if B2B and they want it on invoice)  
- Full billing address, City, State, **Place of supply** (state)  
- Email, Phone (WhatsApp)  
- **Quantity** (OneLink seats — for bulk team discount)  
- **Plan:** Essential | Business | Signature (from catalogue)  
- **Maintenance:** Yearly | 2-Year (per plan options)  
- **Custom plan mode:** Toggle “Enterprise / custom quote” → free-text line items + manual amounts (GST-inclusive or exclusive — pick one mode globally in settings; default **inclusive** to match website).  
- **Discount:**  
  - Percent off subtotal, **or**  
  - Fixed ₹ off, **or**  
  - “Manager override” final total (with audit note field: reason, initials)  
- **Payment reference (offline):** UPI ref / bank ref / cash — text field (no need to integrate UPI API).

---

## 4. Line items & math (GST @ 18%)

Align with website logic where possible:

- **Plan package** = `orderAmount` for selected plan × quantity, then apply **bulk discount** (tiers: 2→10%, 3–4→15%, 5+→25%) on that subtotal.  
- **Maintenance** = selected option `price` × quantity (same qty as seats unless you add “separate qty” later).  
- **Add-ons:** List from config (currently empty in `plans-reference.json`; keep UI ready for future rows).  
- **Custom lines:** Description, HSN/SAC (default **9983**), amount (per settings: inclusive or exclusive of GST).

**Tax split:**

- If buyer state code **equals** seller `01` → **CGST 9% + SGST 9%** on taxable value.  
- Else → **IGST 18%** on taxable value.

**Taxable value from GST-inclusive amount:**  
`taxable = round(inclusive / 1.18, 2)`  
`GST = round(inclusive - taxable, 2)`

Show a small summary table:

| Taxable value | CGST | SGST | IGST | **Grand total (₹)** |

**Amount in words:** Indian format (Rupees … only) — optional library or simple mapper.

---

## 5. Invoice meta

Auto or editable:

- Invoice / document number (e.g. `OL-INV-2026-00001`) — increment or manual.  
- Issue date, optional “valid until” for proforma.  
- Internal **Order / Booking reference** (optional text).  
- **HSN/SAC** column per line (default 9983).

---

## 6. PDF export

**v1 (fastest):** Single HTML template + CSS `@media print` + **Print → Save as PDF**.

**v2:** Client-side PDF (`jspdf` + `html2canvas`, or `react-pdf` / `@react-pdf/renderer`) for pixel-consistent files.

Requirements:

- A4, margins ~15mm.  
- No clipped headers; logo + seller block repeat optional on multi-page.  
- Page numbers if more than one page.

---

## 7. UX principles (internal + “in front of customer”)

- Large tap targets, minimal steps: **Plan → Maintenance → Qty → Customer → Preview → PDF**.  
- **Live preview** pane (right or below) updates as fields change.  
- **Reset** and **Duplicate last invoice** (optional).  
- **No** customer data sent to your servers unless you add that later — prefer **local-only** (localStorage) for v1 privacy.  
- English UI; labels can add Hindi hints in help text if needed.

---

## 8. Compliance note (non-legal)

This spec is **not** legal advice. Final invoice numbering, RCM, place of supply, HSN/SAC, and e-invoice thresholds must be confirmed with **your CA**. The tool only encodes your chosen rules.

---

## 9. Sync with live website pricing

When `Onelink.cards-main-website/src/content/site.ts` → `pricingPlans` changes, update **`plans-reference.json`** (or your app’s embedded copy) so offline quotes match the site.
