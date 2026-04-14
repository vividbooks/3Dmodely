import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { CatalogModel } from "../types";
import { SKETCHFAB_THUMB_CHROME } from "../data/sketchfabThumbChrome.generated";
import { useImageChromeColor } from "../hooks/useImageChromeColor";
import { contrastingForeground } from "../utils/contrastText";

const THUMB_FALLBACK = "#eef1f6";

type Props = {
  model: CatalogModel;
  to: string;
};

export function ModelGridCard({ model, to }: Props) {
  const thumbUrl = model.thumbnailUrl;
  const pre =
    model.sketchfabId && SKETCHFAB_THUMB_CHROME[model.sketchfabId]
      ? SKETCHFAB_THUMB_CHROME[model.sketchfabId]
      : null;
  const visualBg = useImageChromeColor(thumbUrl, THUMB_FALLBACK, pre);
  const footerFg = contrastingForeground(visualBg);

  return (
    <Link
      to={to}
      className="models-hub__card"
      style={
        {
          "--models-card-footer-bg": visualBg,
          "--models-card-footer-fg": footerFg,
          "--models-card-chrome-bg": visualBg,
        } as CSSProperties
      }
    >
      <div className="models-hub__thumb-wrap">
        {thumbUrl && (
          <img
            src={thumbUrl}
            alt=""
            className="models-hub__thumb"
            width={400}
            height={225}
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
      <div className="models-hub__card-foot">
        <span className="models-hub__card-title">{model.title}</span>
        <span className="models-hub__arrow" aria-hidden>
          →
        </span>
      </div>
    </Link>
  );
}
