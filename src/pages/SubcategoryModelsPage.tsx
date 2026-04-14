import { Link, Navigate, useParams } from "react-router-dom";
import { ModelGridCard } from "../components/ModelGridCard";
import { getSubcategory } from "../data/catalog";
import { categoryThemeCssVars } from "../utils/categoryThemeCss";
import "./subcategory-grid.css";

export default function SubcategoryModelsPage() {
  const { categorySlug, subSlug } = useParams<{ categorySlug: string; subSlug: string }>();
  if (!categorySlug || !subSlug) return <Navigate to="/" replace />;

  const resolved = getSubcategory(categorySlug, subSlug);
  if (!resolved) return <Navigate to={`/${categorySlug}`} replace />;

  const { category, sub } = resolved;
  const { board } = sub;

  return (
    <div className="models-hub" style={categoryThemeCssVars(category.folderTheme)}>
      <header className="models-hub__header">
        <Link to={`/${category.slug}`} className="models-hub__crumb">
          ← {category.title}
        </Link>
        <h1 className="models-hub__title">{board.title}</h1>
        <p className="models-hub__hint">Vyber model — potom můžeš přepínat v levém menu.</p>
      </header>

      <ul className="models-hub__grid">
        {board.models.map((m) => (
          <li key={m.id}>
            <ModelGridCard model={m} to={`/${category.slug}/${sub.slug}/${m.id}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
