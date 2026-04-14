import type { MainCategoryDef, SubcategoryDef } from "../types";
import { clovekSubcategoriesAddon } from "./clovek-boards-additions";
import { cestaKyslikuDoKrve } from "./cesta-kysliku";
import { kosterniSoustava } from "./kosterni-soustava";
import { svalovaSoustava } from "./svalova-soustava";
import { vznikZivotaSubcategories } from "./vznik-zivota";
import { bezobratliZivocichoveSubcategories } from "./bezobratli-zivocichove";
import { obratlovciSubcategories } from "./obratlovci";
import { geologieSubcategories } from "./geologie";
import { vesmirSubcategories } from "./vesmir";
import { houbyVyssiRostlinySubcategories } from "./houby-vyssi-rostliny";

export const mainCategories: MainCategoryDef[] = [
  {
    slug: "clovek",
    title: "Člověk",
    pageHeadline: "Člověk — 3D modely",
    folderTheme: {
      tab: "#6e7ec8",
      tabSoft: "#eaebf8",
      onTab: "#ffffff",
    },
    subcategories: [
      {
        slug: "kosterni-soustava",
        title: "Kosterní soustava",
        tint: "sky",
        board: kosterniSoustava,
      },
      {
        slug: "svalova-soustava",
        title: "Svalová soustava",
        tint: "cream",
        board: svalovaSoustava,
      },
      {
        slug: "cesta-kysliku-do-krve",
        title: "Cesta kyslíku do krve",
        tint: "mint",
        board: cestaKyslikuDoKrve,
      },
      ...clovekSubcategoriesAddon,
    ],
  },
  {
    slug: "vznik-zivota",
    title: "Vznik života a nejjednodušší organismy",
    pageHeadline: "Vznik života a nejjednodušší organismy — 3D modely",
    folderTheme: {
      tab: "#4a7374",
      tabSoft: "#e2efef",
      onTab: "#ffffff",
    },
    subcategories: vznikZivotaSubcategories,
  },
  {
    slug: "bezobratli",
    title: "Bezobratlí živočichové",
    pageHeadline: "Bezobratlí živočichové — 3D modely",
    folderTheme: {
      tab: "#806fae",
      tabSoft: "#ece8f5",
      onTab: "#ffffff",
    },
    subcategories: bezobratliZivocichoveSubcategories,
  },
  {
    slug: "obratlovci",
    title: "Obratlovci",
    pageHeadline: "Obratlovci — 3D modely",
    folderTheme: {
      tab: "#b5686b",
      tabSoft: "#f5e8e9",
      onTab: "#ffffff",
    },
    subcategories: obratlovciSubcategories,
  },
  {
    slug: "geologie",
    title: "Geologie",
    pageHeadline: "Geologie — 3D modely",
    folderTheme: {
      tab: "#7a6248",
      tabSoft: "#efe9e2",
      onTab: "#ffffff",
    },
    subcategories: geologieSubcategories,
  },
  {
    slug: "vesmir",
    title: "Vesmír",
    pageHeadline: "Vesmír — 3D modely",
    folderTheme: {
      tab: "#3d4a6b",
      tabSoft: "#e8eaf3",
      onTab: "#ffffff",
    },
    subcategories: vesmirSubcategories,
  },
  {
    slug: "houby-a-vyssi-rostliny",
    title: "Houby a vyšší rostliny",
    pageHeadline: "Houby a vyšší rostliny — 3D modely",
    folderTheme: {
      tab: "#4a7d54",
      tabSoft: "#e6f2e9",
      onTab: "#ffffff",
    },
    subcategories: houbyVyssiRostlinySubcategories,
  },
];

export function getMainCategory(slug: string): MainCategoryDef | undefined {
  return mainCategories.find((c) => c.slug === slug);
}

export function getSubcategory(
  categorySlug: string,
  subSlug: string,
): { category: MainCategoryDef; sub: SubcategoryDef } | undefined {
  const category = getMainCategory(categorySlug);
  if (!category) return undefined;
  const sub = category.subcategories.find((s) => s.slug === subSlug);
  if (!sub) return undefined;
  return { category, sub };
}
