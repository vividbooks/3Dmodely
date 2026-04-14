import type { CSSProperties } from "react";
import type { MainCategoryFolderTheme } from "../types";

export function categoryThemeCssVars(theme: MainCategoryFolderTheme): CSSProperties {
  return {
    "--hub-cat-tab": theme.tab,
    "--hub-cat-soft": theme.tabSoft,
    "--hub-cat-on": theme.onTab,
  } as CSSProperties;
}
