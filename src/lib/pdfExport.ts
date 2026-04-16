const INVOICE_EL_ID = "kry-invoice-a4";

function nextFrame(): Promise<void> {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }),
    ),
  );
}

/** Rasterises the A4 invoice node to a single A4 PDF (matches on-screen layout). */
export async function downloadInvoicePdf(filenameBase: string): Promise<void> {
  const el = document.getElementById(INVOICE_EL_ID);
  if (!el) {
    throw new Error("Invoice block not found");
  }

  if ("fonts" in document) {
    await (document as Document & { fonts: FontFaceSet }).fonts.ready;
  }
  await waitForImages(el);
  await nextFrame();
  await nextFrame();

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(el, {
    scale: Math.min(window.devicePixelRatio || 1, 2),
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#ffffff",
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });

  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error("Could not render invoice for PDF.");
  }

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
