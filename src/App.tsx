import { BrowserRouter, Route, Routes } from "react-router";
import { AssetPage } from "./pages/AssetPage";
import { Dashboard } from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/assets/:hostname" element={<AssetPage />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
