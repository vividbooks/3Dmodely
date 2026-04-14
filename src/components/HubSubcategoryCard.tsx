import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { SubcategoryDef } from "../types";
import { SKETCHFAB_THUMB_CHROME } from "../data/sketchfabThumbChrome.generated";
import { useImageChromeColor } from "../hooks/useImageChromeColor";
import { contrastingForeground } from "../utils/contrastText";

const TINT_FALLBACK: Record<SubcategoryDef["tint"], string> = {
  sky: "#dbeafe",
  cream: "#fef3c7",
  mint: "#d1fae5",
  blush: "#fce7f3",
};

type Props = {
  sub: SubcategoryDef;
  categorySlug: string;
};

export function HubSubcategoryCard({ sub, categorySlug }: Props) {
  const first = sub.board.models[0];
  const preview = sub.hubPreview ?? first;
  const thumbUrl = preview?.thumbnailUrl;
  const fallback = TINT_FALLBACK[sub.tint];
  const pre =
    preview?.sketchfabId && SKETCHFAB_THUMB_CHROME[preview.sketchfabId]
      ? SKETCHFAB_THUMB_CHROME[preview.sketchfabId]
      : null;
  const visualBg = useImageChromeColor(thumbUrl, fallback, pre);
  const footerFg = contrastingForeground(visualBg);

  return (
    <Link
      to={`/${categorySlug}/${sub.slug}`}
      className="hub__subcard"
      style={
        {
          "--hub-subcard-footer-bg": visualBg,
          "--hub-subcard-footer-fg": footerFg,
        } as CSSProperties
      }
    >
      <div className="hub__subcard-visual" style={{ backgroundColor: visualBg }}>
        {thumbUrl && (
          <img
            src={thumbUrl}
            alt=""
            className="hub__subcard-img"
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
      <div className="hub__subcard-footer">
        <span className="hub__subcard-label">{sub.title}</span>
        <span className="hub__subcard-arrow" aria-hidden>
          →
        </span>
      </div>
    </Link>
  );
}
