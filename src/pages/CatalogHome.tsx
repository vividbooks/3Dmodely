import { useMemo, type CSSProperties } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import SiteCreditsFooter from "../components/SiteCreditsFooter";
import { HubSubcategoryCard } from "../components/HubSubcategoryCard";
import { getMainCategory, mainCategories } from "../data/catalog";
import { categoryThemeCssVars } from "../utils/categoryThemeCss";
import "./catalog-home.css";

export default function CatalogHome() {
  const { categorySlug } = useParams<{ categorySlug: string }>();

  const category = useMemo(() => {
    if (!categorySlug) return mainCategories[0];
    return getMainCategory(categorySlug) ?? null;
  }, [categorySlug]);

  if (categorySlug && !category) {
    return <Navigate to={`/${mainCategories[0].slug}`} replace />;
  }

  const active = category ?? mainCategories[0];

  const hubSurfaceStyle = {
    "--hub-section-tab": active.folderTheme.tab,
  } as CSSProperties;

  return (
    <div className="hub" style={hubSurfaceStyle}>
      <div className="hub__top">
        <header className="hub__header">
          <h1 className="hub__site-title">{active.pageHeadline}</h1>
          <nav className="hub__pills" aria-label="Hlavní kategorie">
            {mainCategories.map((c) => (
              <Link
                key={c.slug}
                to={`/${c.slug}`}
                className={`hub__pill${c.slug === active.slug ? " is-active" : ""}`}
                style={categoryThemeCssVars(c.folderTheme)}
              >
                {c.title}
              </Link>
            ))}
          </nav>
        </header>

        <section className="hub__section" aria-labelledby="hub-section-title">
          <h2 id="hub-section-title" className="hub__section-title">
            {active.title}
          </h2>
          <ul className="hub__subgrid">
            {active.subcategories.map((sub) => (
              <li key={sub.slug}>
                <HubSubcategoryCard sub={sub} categorySlug={active.slug} />
              </li>
            ))}
          </ul>
        </section>
      </div>
      <SiteCreditsFooter />
    </div>
  );
}
