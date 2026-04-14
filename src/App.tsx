import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { mainCategories } from "./data/catalog";
import CatalogHome from "./pages/CatalogHome";
import SubcategoryModelsPage from "./pages/SubcategoryModelsPage";
import ViewerPage from "./pages/ViewerPage";

const defaultCategory = mainCategories[0]?.slug ?? "clovek";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={`/${defaultCategory}`} replace />} />
        <Route path="/:categorySlug" element={<CatalogHome />} />
        <Route path="/:categorySlug/:subSlug" element={<SubcategoryModelsPage />} />
        <Route path="/:categorySlug/:subSlug/:modelId" element={<ViewerPage />} />
      </Routes>
    </BrowserRouter>
  );
}
