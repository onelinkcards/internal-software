import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const INVOICE_EL_ID = "kry-invoice-a4";

/** Rasterises the A4 invoice node to a single A4 PDF (matches on-screen layout). */
export async function downloadInvoicePdf(filenameBase: string): Promise<void> {
  const el = document.getElementById(INVOICE_EL_ID);
  if (!el) {
    throw new Error("Invoice block not found");
  }

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/png", 1.0);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgWidthMm = pageW;
  const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;
  let finalW = imgWidthMm;
  let finalH = imgHeightMm;
  if (finalH > pageH) {
    finalH = pageH;
    finalW = (canvas.width * finalH) / canvas.height;
  }
  const offsetX = (pageW - finalW) / 2;
  const offsetY = (pageH - finalH) / 2;
  pdf.addImage(imgData, "PNG", offsetX, offsetY, finalW, finalH, undefined, "MEDIUM");
  const safe = filenameBase.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "invoice";
  pdf.save(`${safe}.pdf`);
}
