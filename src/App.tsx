import { BrowserRouter, Route, Routes } from "react-router";
import { DataProvider } from "./data/source";
import { AssetPage } from "./pages/AssetPage";
import { Dashboard } from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets/:hostname" element={<AssetPage />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </DataProvider>
    </BrowserRouter>
  );
}
