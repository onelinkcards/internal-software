import { Navigate, Route, Routes } from "react-router-dom";
import { TeamInvoicePage, TeamInvoiceWorkspace } from "./pages/TeamInvoiceWorkspace";
import { ShortInvoicePage } from "./pages/ShortInvoicePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/billing" replace />} />
      <Route path="/billing" element={<TeamInvoicePage />} />
      <Route path="/invoice/share" element={<TeamInvoiceWorkspace />} />
      <Route path="/i/:customerSlug/:invoiceNo" element={<ShortInvoicePage />} />
      <Route path="*" element={<Navigate to="/billing" replace />} />
    </Routes>
  );
}
