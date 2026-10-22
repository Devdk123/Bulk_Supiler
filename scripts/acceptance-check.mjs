import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const root = process.cwd();
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

async function importTypeScript(relativePath) {
  const source = await read(relativePath);
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

function getPath(object, dottedPath) {
  return dottedPath.split(".").reduce((value, key) => value?.[key], object);
}

function collectStaticTranslationCalls(source, fileName) {
  const tree = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const paths = new Set();
  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "t") {
      const firstArgument = node.arguments[0];
      if (firstArgument && ts.isStringLiteral(firstArgument)) paths.add(firstArgument.text);
    }
    if (
      ts.isJsxAttribute(node)
      && node.name.getText(tree) === "id"
      && node.initializer
      && ts.isStringLiteral(node.initializer)
      && ts.isJsxOpeningElement(node.parent)
      && node.parent.tagName.getText(tree).endsWith("TranslatedText")
    ) {
      paths.add(node.initializer.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return paths;
}

const [{ default: en }, { default: hi }] = await Promise.all([
  importTypeScript("src/locales/en/common.ts"),
  importTypeScript("src/locales/hi/common.ts")
]);

test("English and Hindi resources have matching key structure and valid Hindi text", async () => {
  const compare = (english, hindi, currentPath = "") => {
    assert.deepEqual(Object.keys(hindi).sort(), Object.keys(english).sort(), `translation keys differ at ${currentPath || "root"}`);
    for (const key of Object.keys(english)) {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      if (typeof english[key] === "object" && english[key] !== null) compare(english[key], hindi[key], nextPath);
      else {
        assert.equal(typeof hindi[key], "string", `${nextPath} is not translated text`);
        assert.ok(hindi[key].trim(), `${nextPath} is empty`);
      }
    }
  };
  compare(en, hi);
  const source = await read("src/locales/hi/common.ts");
  assert.match(source, /[ऀ-ॿ]/, "Hindi resource must contain Devanagari text");
  assert.doesNotMatch(source, /à¤/, "Hindi resource must not contain UTF-8 mojibake");
});

test("Supabase URL and JWT public key mismatches are detected without exposing credentials", async () => {
  const { hasSupabaseProjectMismatch, SUPABASE_PROJECT_MISMATCH_MESSAGE } = await importTypeScript("src/lib/supabase-project.ts");
  const token = (ref) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ ref })).toString("base64url")}.signature`;
  assert.equal(hasSupabaseProjectMismatch("https://projectalpha.supabase.co", token("projectalpha")), false);
  assert.equal(hasSupabaseProjectMismatch("https://projectalpha.supabase.co", token("projectbravo")), true);
  assert.equal(hasSupabaseProjectMismatch("https://custom.example.com", token("projectbravo")), false);
  assert.match(SUPABASE_PROJECT_MISMATCH_MESSAGE, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.doesNotMatch(SUPABASE_PROJECT_MISMATCH_MESSAGE, /projectalpha|projectbravo|eyJ/);
});

test("quote basket only persists validated product identifiers, variants, and quantities", async () => {
  const { addQuoteCartLine, parseQuoteCart } = await importTypeScript("src/lib/quote-cart.ts");
  const lines = parseQuoteCart(JSON.stringify([
    { product_id: "product-1", variant_id: "variant-1", quantity: "4", price: 0.01 },
    { product_id: "product-1", variant_id: "variant-2", quantity: "2" },
    { product_id: "bad id", quantity: "1" },
    { product_id: "product-2", quantity: "-4" }
  ]));
  assert.deepEqual(lines, [{ product_id: "product-1", variant_id: "variant-1", quantity: "4" }]);
  assert.deepEqual(addQuoteCartLine(lines, { product_id: "product-1", variant_id: "variant-2", quantity: "1" }), [
    { product_id: "product-1", variant_id: "variant-2", quantity: "5" }
  ]);
  assert.deepEqual(parseQuoteCart("broken"), []);
  const provider = await read("src/context/quote-cart-context.tsx");
  const card = await read("src/components/product-card.tsx");
  const orderForm = await read("src/components/order-form.tsx");
  const enquiryRoute = await read("src/app/api/enquiries/route.ts");
  assert.match(provider, /localStorage\.getItem\(STORAGE_KEY\)/);
  assert.match(card, /addItem\(\{ product_id: product\.id/);
  assert.match(orderForm, /quoteCart\.replaceItems\(merged\)/);
  assert.match(orderForm, /Authorization: `Bearer \$\{session\.access_token\}`/);
  assert.match(enquiryRoute, /auth\.getUser\(accessToken\)/);
  assert.match(enquiryRoute, /customer_id: authenticatedCustomerId/);
  assert.doesNotMatch(enquiryRoute, /customer_id: enquiry\.customer_id/);
});

test("static translation references resolve in both languages", async () => {
  const sourceFiles = [
    "src/app", "src/components"
  ];
  const { readdir } = await import("node:fs/promises");
  const collectFiles = async (directory) => {
    const entries = await readdir(path.join(root, directory), { withFileTypes: true });
    const children = await Promise.all(entries.map((entry) => {
      const relative = path.join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(relative) : /\.(tsx|ts)$/.test(entry.name) ? [relative] : [];
    }));
    return children.flat();
  };
  const files = (await Promise.all(sourceFiles.map(collectFiles))).flat();
  const missing = [];
  for (const file of files) {
    for (const key of collectStaticTranslationCalls(await read(file), file)) {
      if (!getPath(en, key) || !getPath(hi, key)) missing.push(`${file}: ${key}`);
    }
  }
  assert.deepEqual(missing, [], `missing translation paths:\n${missing.join("\n")}`);
});

test("dynamic admin status and setup labels exist in both languages", () => {
  const keys = [
    "adminUI.adminSections", "adminUI.searchEnquiries", "adminUI.filterLegacyStatus",
    "adminUI.localizedCatalogueTitle", "adminUI.assistantRateLimitTitle", "adminUI.auditFailed"
  ];
  for (const key of keys) {
    assert.equal(typeof getPath(en, key), "string", `missing English translation: ${key}`);
    assert.equal(typeof getPath(hi, key), "string", `missing Hindi translation: ${key}`);
  }
  for (const status of ["All", "New", "Contacted", "Confirmed", "Delivered", "Cancelled"]) {
    assert.equal(typeof getPath(en, `adminUI.legacyStatus.${status}`), "string");
    assert.equal(typeof getPath(hi, `adminUI.legacyStatus.${status}`), "string");
  }
});

test("web manifest has installable Gayatri Store metadata and required icons", async () => {
  const { default: manifest } = await importTypeScript("src/app/manifest.ts");
  const value = manifest();
  assert.equal(value.name, "Gayatri Store");
  assert.equal(value.short_name, "Gayatri Store");
  assert.equal(value.display, "standalone");
  for (const size of ["192x192", "512x512"]) assert.ok(value.icons.some((icon) => icon.sizes === size));
  assert.ok(value.icons.some((icon) => icon.purpose === "maskable"));
});

test("document defaults to English and light mode while preserving explicit saved preferences", async () => {
  const layout = await read("src/app/layout.tsx");
  const languageProvider = await read("src/context/language-context.tsx");
  assert.match(layout, /<html lang="en"/);
  assert.match(languageProvider, /document\.documentElement\.lang = language === "hi" \? "hi" : "en"/);
  assert.match(layout, /dataset\.theme=t==="dark"\?"dark":"light"/);
  assert.doesNotMatch(layout, /prefers-color-scheme/);
});

test("service worker only caches static same-origin assets and serves offline shell on navigation failure", async () => {
  const worker = await read("public/sw.js");
  const manager = await read("src/components/service-worker-manager.tsx");
  assert.match(worker, /request\.mode === "navigate"[\s\S]*?fetch\(request\)\.catch/);
  assert.match(worker, /url\.origin !== self\.location\.origin/);
  assert.match(worker, /const isStaticAsset = url\.pathname\.startsWith\("\/_next\/static\/"\)/);
  assert.match(worker, /if \(!isStaticAsset\) return/);
  assert.doesNotMatch(worker, /cache\.put\([^\n]*(?:\/api\/|\/account|\/order)/);
  assert.match(manager, /registration\.waiting\?\.postMessage\(\{ type: "SKIP_WAITING" \}\)/);
  assert.match(manager, /window\.location\.reload\(\)/);
});

test("ordering stays a server-confirmed enquiry flow without a direct-order endpoint", async () => {
  const orderRoute = await read("src/app/api/orders/route.ts");
  const enquiryRoute = await read("src/app/api/enquiries/route.ts");
  assert.match(orderRoute, /status:\s*410/);
  assert.match(orderRoute, /Direct orders are no longer accepted/);
  assert.match(enquiryRoute, /export async function POST/);
  assert.match(enquiryRoute, /client_request_id/);
});

test("assistant is server-side, database-grounded, bounded, and configured without browser keys", async () => {
  const route = await read("src/app/api/assistant/route.ts");
  const widget = await read("src/components/ai-assistant-loader.tsx");
  const migration = await read("supabase/migrations/20261023193000_assistant_rate_limit.sql");
  assert.match(route, /process\.env\.OPENAI_API_KEY/);
  assert.match(route, /from\("products"\)/);
  assert.match(route, /max\(1200\)/);
  assert.match(route, /max_output_tokens:\s*500/);
  assert.match(route, /timeout:\s*15_000/);
  assert.match(route, /consume_assistant_rate_limit/);
  assert.match(route, /createHash\("sha256"\)/);
  assert.match(route, /AbortSignal\.timeout\(1200\)/);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /security invoker/i);
  assert.match(migration, /revoke all on function[\s\S]*?from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function[\s\S]*?to service_role/i);
  assert.match(widget, /dynamic\(\(\) => import\("@\/components\/ai-assistant"\)/);
  assert.match(widget, /onClick=\{\(\) => setOpen\(true\)\}/);
});

test("assistant chat adapts to mobile keyboard viewports and app language changes", async () => {
  const assistant = await readFile("src/components/ai-assistant.tsx", "utf8");
  assert.match(assistant, /max-h-\[min\(70dvh,600px\)\]/);
  assert.match(assistant, /aria-label=\{t\("assistant\.language"\)\}/);
  assert.match(assistant, /languageOverride \?\? \(appLanguage === "hi" \? "hi" : "en"\)/);
  assert.match(assistant, /prefers-reduced-motion/);
});
