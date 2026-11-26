#!/usr/bin/env node
/**
 * Tarjima kalitlarini tekshiradi:
 *  1) uz / ru / en fayllarida kalitlar to'plami bir xilmi;
 *  2) kodda ishlatilgan t("...") kalitlari uz.json'da bormi (yetishmasa, ish vaqtida MISSING_MESSAGE bo'ladi);
 *  3) dinamik kalitlarda (t(`nav.${x}`)) kamida prefiks mavjudmi.
 * Ishlatilishi: node scripts/check-i18n.mjs  (xato bo'lsa chiqish kodi 1)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const LOCALES = ["uz", "ru", "en"];
const messages = Object.fromEntries(
  LOCALES.map((l) => [
    l,
    JSON.parse(readFileSync(join(root, `src/messages/${l}.json`), "utf8")),
  ]),
);

const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? flatten(v, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );

let problems = 0;
const report = (msg) => {
  problems += 1;
  console.error(`✗ ${msg}`);
};

// 1) kalit to'plamlari
const base = new Set(flatten(messages.uz));
for (const locale of LOCALES.slice(1)) {
  const keys = new Set(flatten(messages[locale]));
  for (const k of base) if (!keys.has(k)) report(`${locale}.json'da yetishmaydi: ${k}`);
  for (const k of keys)
    if (!base.has(k)) report(`${locale}.json'da ortiqcha (uz'da yo'q): ${k}`);
}

const lookup = (path) =>
  path
    .split(".")
    .reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), messages.uz);

// 2) kodda ishlatilgan kalitlar
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.tsx?$/.test(name)) files.push(full);
  }
})(join(root, "src"));

let checked = 0;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  // const t = useTranslations("ns") | await getTranslations("ns") | getTranslations({ ..., namespace: "ns" })
  const decl =
    /(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:"([\w.]*)"|\{[^}]*namespace:\s*"([\w.]*)"[^}]*\})?\s*\)/g;
  // Bir faylda bir xil nom (masalan, `t`) turli funksiyalarda boshqa namespace bilan e'lon qilinishi
  // mumkin. Kalit shulardan kamida bittasida topilsa, to'g'ri deb hisoblanadi.
  const scopes = new Map();
  for (const m of src.matchAll(decl)) {
    const list = scopes.get(m[1]) ?? [];
    list.push(m[2] ?? m[3] ?? "");
    scopes.set(m[1], list);
  }
  for (const [name, namespaces] of scopes) {
    const call = new RegExp(
      `(?<![\\w.])${name}(?:\\.(?:raw|has|rich))?\\(\\s*(["\`])([^"\`]*)\\1`,
      "g",
    );
    for (const m of src.matchAll(call)) {
      const key = m[2];
      const rel = file.slice(root.length);
      checked += 1;
      if (m[1] === "`" && key.includes("${")) {
        const staticPrefix = key.split("${")[0].replace(/\.$/, "");
        const found = namespaces.some((ns) => {
          const full = [ns, staticPrefix].filter(Boolean).join(".");
          return full !== "" && lookup(full) !== undefined;
        });
        if (!found)
          report(
            `${rel}: dinamik kalit prefiksi topilmadi: ${key} (${namespaces.join(" | ")})`,
          );
        continue;
      }
      const found = namespaces.some(
        (ns) => lookup([ns, key].filter(Boolean).join(".")) !== undefined,
      );
      if (!found) report(`${rel}: kalit yo'q: ${key} (${namespaces.join(" | ")})`);
    }
  }
}

console.log(`Tekshirildi: ${base.size} kalit/til, kodda ${checked} ta murojaat.`);
if (problems) {
  console.error(`\n${problems} ta muammo.`);
  process.exit(1);
}
console.log("✓ Tarjimalar to'liq va kodga mos.");
