import { translations, type Locale } from "./translations";

type Params = Record<string, string | number>;

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const value = path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
  return typeof value === "string" ? value : path;
}

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(params[key] ?? `{${key}}`)
  );
}

export function translate(
  locale: Locale,
  key: string,
  params?: Params
): string {
  const dict = translations[locale] as Record<string, unknown>;
  return interpolate(getNestedValue(dict, key), params);
}

export function getSkeinLabel(
  locale: Locale,
  count: number,
  section: "palette" | "materials" | "pdf" = "palette"
): string {
  const prefix = `${section}.`;
  if (count === 1) return translate(locale, `${prefix}skein`);
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (
    locale === "ru" &&
    mod10 >= 2 &&
    mod10 <= 4 &&
    (mod100 < 10 || mod100 >= 20)
  ) {
    return translate(locale, `${prefix}skeins`);
  }
  if (locale === "ru" && count > 1) {
    return translate(locale, `${prefix}skeinsMany`);
  }
  return translate(locale, `${prefix}skeins`);
}

export function getDefaultColorName(locale: Locale, index: number): string {
  return translate(locale, "palette.defaultColorName", { n: index + 1 });
}

export function getUnitLabel(locale: Locale, unit: "inches" | "centimeters"): string {
  return translate(locale, unit === "inches" ? "settings.inches" : "settings.centimeters");
}

export { translations, type Locale };
