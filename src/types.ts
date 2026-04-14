export type CardTint = "sky" | "cream" | "mint" | "blush";

export type CatalogModel = {
  id: string;
  title: string;
  thumbnailUrl: string;
  /** Sketchfab model UID (když nepoužíváte SuperSplat). */
  sketchfabId?: string;
  /** Plná embed URL SuperSplat, např. https://superspl.at/s?id=… — má přednost před Sketchfab. */
  supersplatEmbedUrl?: string;
};

export type CatalogBoard = {
  id: string;
  title: string;
  models: CatalogModel[];
};

export type SubcategoryDef = {
  slug: string;
  title: string;
  tint: CardTint;
  board: CatalogBoard;
  /** Náhled dlaždice na přehledu podkategorií; výchozí = první model v boardu. */
  hubPreview?: Pick<CatalogModel, "thumbnailUrl" | "sketchfabId">;
};

/** Barvy „záložky“ složky ve Vividbooks — akcent kategorie v UI. */
export type MainCategoryFolderTheme = {
  tab: string;
  tabSoft: string;
  onTab: string;
};

export type MainCategoryDef = {
  slug: string;
  title: string;
  /** Nadpis stránky nad bobánky (např. „Tělesa, útvary a cvičení“) */
  pageHeadline: string;
  /** Barevnost podle ikony složky v řádku kategorií */
  folderTheme: MainCategoryFolderTheme;
  subcategories: SubcategoryDef[];
};
