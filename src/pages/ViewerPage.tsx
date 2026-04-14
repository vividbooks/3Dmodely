import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { VividboardEmbedHint } from "../components/VividboardEmbedHint";
import { getSubcategory } from "../data/catalog";
import { catalogModelEmbedKey, catalogModelEmbedSrc } from "../utils/catalogEmbed";
import { categoryThemeCssVars } from "../utils/categoryThemeCss";
import type { CatalogModel } from "../types";
import "../App.css";

function FullscreenIcon() {
  return (
    <svg className="catalog__fs-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
      />
    </svg>
  );
}

function CatalogMenuThumb({ url }: { url: string | undefined }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [url]);
  if (!url || failed) {
    return <span className="catalog__menu-thumb catalog__menu-thumb--empty" aria-hidden />;
  }
  return (
    <img
      src={url}
      alt=""
      className="catalog__menu-thumb"
      width={72}
      height={48}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default function ViewerPage() {
  const { categorySlug, subSlug, modelId } = useParams<{
    categorySlug: string;
    subSlug: string;
    modelId: string;
  }>();
  const navigate = useNavigate();

  const resolved = categorySlug && subSlug ? getSubcategory(categorySlug, subSlug) : undefined;
  if (!resolved) {
    return <Navigate to="/" replace />;
  }

  const { category, sub } = resolved;
  const { board } = sub;
  const { models, title } = board;

  const modelIndex = modelId ? models.findIndex((m: CatalogModel) => m.id === modelId) : -1;

  if (!modelId || modelIndex < 0) {
    const first = models[0]?.id;
    if (!first) {
      return <Navigate to={`/${category.slug}/${sub.slug}`} replace />;
    }
    return <Navigate to={`/${category.slug}/${sub.slug}/${first}`} replace />;
  }

  const current = models[modelIndex];

  const [fsActive, setFsActive] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  const embedSrc = useMemo(
    () => (current ? catalogModelEmbedSrc(current) : ""),
    [current],
  );

  const goModel = useCallback(
    (id: string) => {
      navigate(`/${category.slug}/${sub.slug}/${id}`);
    },
    [navigate, category.slug, sub.slug],
  );

  useEffect(() => {
    const fullscreenEl = () =>
      document.fullscreenElement ??
      (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ??
      null;

    const sync = () => {
      const el = shellRef.current;
      setFsActive(!!el && fullscreenEl() === el);
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const enterFullscreen = useCallback(async () => {
    const el = shellRef.current;
    if (!el) return;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as HTMLDivElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
        (el as HTMLDivElement & { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
      }
    } catch {
      /* noop */
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as Document & { webkitExitFullscreen?: () => void }).webkitExitFullscreen) {
        (document as Document & { webkitExitFullscreen: () => void }).webkitExitFullscreen();
      }
    } catch {
      /* noop */
    }
  }, []);

  return (
    <div className="catalog" style={categoryThemeCssVars(category.folderTheme)}>
      <div className="catalog__body">
        <aside className="catalog__sidebar" aria-label="Témata">
          <Link to={`/${category.slug}/${sub.slug}`} className="catalog__back-link">
            ← {board.title}
          </Link>
          <h1 className="catalog__board-title">{title}</h1>
          <VividboardEmbedHint boardId={board.id} />
          <ol className="catalog__menu">
            {models.map((m: CatalogModel, i: number) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={`catalog__menu-item${i === modelIndex ? " is-active" : ""}`}
                  onClick={() => goModel(m.id)}
                >
                  <CatalogMenuThumb url={m.thumbnailUrl} />
                  <span className="catalog__menu-copy">
                    <span className="catalog__menu-num">{i + 1}.</span>
                    <span className="catalog__menu-label">{m.title}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <main className="catalog__main">
          <div className="catalog__viewer-shell" ref={shellRef}>
            {!fsActive && (
              <button
                type="button"
                className="catalog__fs-enter"
                onClick={() => void enterFullscreen()}
                aria-label="Celá obrazovka"
              >
                <FullscreenIcon />
              </button>
            )}
            {fsActive && (
              <button
                type="button"
                className="catalog__fs-exit"
                onClick={() => void exitFullscreen()}
                aria-label="Zavřít celou obrazovku"
              >
                ×
              </button>
            )}
            <div className="catalog__viewer">
              {embedSrc ? (
                <iframe
                  key={catalogModelEmbedKey(current)}
                  title={current.title}
                  src={embedSrc}
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  allowFullScreen
                  className="catalog__iframe"
                />
              ) : (
                <div className="catalog__embed-fallback" role="status">
                  Pro tuto položku není k dispozici žádný 3D náhled.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
