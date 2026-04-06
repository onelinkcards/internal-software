# Cursor / AI implementation prompt — OneLink internal billing

Copy everything below the line into a new Cursor chat (or your AI) when you scaffold the app in this folder.

---

## Prompt (paste from here)

You are building a **standalone internal web app** for **KRIYON GROUP PRIVATE LIMITED** (brand: **OneLink**) — a **GST-aware invoice / proforma generator**. It is **not** part of the Next.js marketing site; keep it in a **separate small project** (e.g. Vite + React + TypeScript) inside the folder that contains `company.json` and `plans-reference.json`.

### Visual & product constraints

- **Simple, professional, not fancy.** Template layout: seller header + buyer block + line items table + tax summary + totals + footer. Use system fonts or one clean sans (e.g. Inter). Accent color: OneLink blue `#00A9FF` sparingly; mostly `#0F172A` text and `#F8FAFC` backgrounds.
- **PDF:** Implement **Print to PDF** in v1 using a dedicated print stylesheet (`@media print`), hiding app chrome (sidebars, buttons). A4, reasonable margins.
- **Logo:** Leave a clear slot at top-left; load from `public/onelink-logo.png` (user will drop file there).

### Data sources

1. Read **`company.json`** for seller legal name, GSTIN, CIN, constitution, address, contact.  
2. Read **`plans-reference.json`** for plan IDs (`essential`, `business`, `signature`), `orderAmount`, `maintenanceOptions`, `bulkDiscountTiers`, `gstRatePercent` (18).

### Functional requirements

1. **Plan selector:** Dropdown of all plans from JSON.  
2. **Maintenance selector:** Options depend on selected plan.  
3. **Quantity:** Integer ≥ 1; apply **bulk discount %** from `bulkDiscountTiers` to the **plan package** subtotal (same rules as described in JSON comments in spec).  
4. **Custom / enterprise mode:** Toggle that replaces catalogue plan line with **manual line items** (description, optional HSN/SAC default 9983, amount). Allow multiple rows.  
5. **Discount controls:**  
   - Optional **% discount** on subtotal (after bulk, before GST split), **or**  
   - Optional **fixed ₹ discount**, **or**  
   - Optional **override final total** with a required text note (“Reason / approver”).  
6. **Buyer form:** Name, business name, GSTIN (optional), address, city, state (dropdown Indian states with codes), email, phone. **Place of supply** = buyer state (default from state field).  
7. **GST logic:** Seller state code `01`. If buyer state code equals `01` → split GST into **CGST 9% + SGST 9%** on taxable value; else **IGST 18%**. All line amounts are **GST-inclusive** by default: `taxable = round(inclusive/1.18, 2)`, `tax = inclusive - taxable`.  
8. **Payment (offline):** Fields for “Payment mode” (UPI / Bank / Cash / Razorpay) and “Reference / UTR” — show on document when filled.  
9. **Document type:** Radio: **Proforma** vs **Tax invoice**; if Proforma, show a clear **PROFORMA** label and disclaimer line in footer.  
10. **Invoice number + date:** Editable fields with sensible defaults (date = today).  
11. **Preview:** Live HTML preview of the final document.  
12. **Persistence (optional v1):** `localStorage` save last buyer + last settings.

### Tech stack suggestion

- **Vite + React + TypeScript + Tailwind CSS** (or plain CSS modules if simpler).  
- No backend required for v1 (fully client-side). **Do not** send PII to external APIs.  
- Structure: `src/components/InvoicePreview.tsx`, `src/lib/gst.ts` (pure functions for tax split), `src/lib/pricing.ts` (bulk discount + totals), `src/App.tsx`.

### Output

- Generate a **working minimal app** with the above, runnable via `npm install` && `npm run dev`.  
- Include **README** with run instructions.  
- Keep code readable and commented where tax logic lives.

### Do not

- Embed Razorpay or Resend unless explicitly asked.  
- Copy the entire OneLink marketing codebase; only replicate **pricing rules** from `plans-reference.json`.

---

## After the AI builds it

1. Add your logo file to `public/onelink-logo.png`.  
2. Double-check amounts with `site.ts` on the website when you change prices.  
3. Ask your CA to verify invoice wording, series, and e-invoice rules before production use.
