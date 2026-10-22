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

test("product route renders without waiting for a server-side catalogue fetch", async () => {
  const page = await readFile("src/app/products/page.tsx", "utf8");
  const catalogue = await readFile("src/components/product-catalogue.tsx", "utf8");
  assert.match(page, /<ProductCatalogue initialPage=\{null\}/);
  assert.doesNotMatch(page, /getStoreProductsPage/);
  assert.match(catalogue, /useState\(!initialPage && !initialError\)/);
  assert.match(catalogue, /aria-busy="true"/);
});

test("homepage featured products use the existing public catalogue API", async () => {
  const page = await readFile("src/app/page.tsx", "utf8");
  const featured = await readFile("src/components/featured-products.tsx", "utf8");
  assert.doesNotMatch(page, /getStoreProducts/);
  assert.match(page, /<FeaturedProducts whatsappLink=\{whatsappLink\}/);
  assert.match(featured, /fetch\("\/api\/catalogue\?limit=6&offset=0"/);
  assert.match(featured, /home\.featuredLoadError/);
});

test("mobile header quick categories are read from the catalogue and use exact category values", async () => {
  const header = await readFile("src/components/site-header.tsx", "utf8");
  assert.match(header, /fetch\("\/api\/catalogue\?limit=1&offset=0"\)/);
  assert.match(header, /encodeURIComponent\(category\.name\)/);
  assert.match(header, /LocalizedCatalogueLabel english=\{category\.name\} hindi=\{category\.name_hi \|\| null\}/);
  assert.doesNotMatch(header, /\["Masala", "Edible Oils", "Agarbatti"/);
});

test("narrow header keeps only language and menu controls in its top row", async () => {
  const header = await readFile("src/components/site-header.tsx", "utf8");
  assert.match(header, /className="h-10 w-auto[^\"]*sm:h-12"/);
  assert.match(header, /hidden items-center gap-2\.5 xl:flex/);
  assert.match(header, /className="flex items-center gap-2 xl:hidden">\s*<LanguageSelector compact \/>\s*<Button/);
  assert.match(header, /<InstallPrompt showLabel \/>/);
  assert.match(header, /theme\.switchToLight/);
});

test("home hero and mobile actions constrain their minimum widths on narrow screens", async () => {
  const home = await readFile("src/app/page.tsx", "utf8");
  const dock = await readFile("src/components/mobile-wholesale-dock.tsx", "utf8");
  const assistant = await readFile("src/components/ai-assistant-loader.tsx", "utf8");
  const css = await readFile("src/app/globals.css", "utf8");
  assert.match(home, /grid w-full min-w-0 grid-cols-1/);
  assert.match(home, /text-\[clamp\(1\.375rem,7vw,1\.875rem\)\]/);
  assert.match(home, /whitespace-normal break-words/);
  assert.match(home, /h-12 w-full min-w-0/);
  assert.match(dock, /className=\{`flex min-w-0 flex-\[1\.15\]/);
  assert.match(dock, /t\("nav\.quoteShort"\)/);
  assert.match(assistant, /max-w-\[calc\(100vw-2rem\)\]/);
  assert.equal((css.match(/max-width: min\(100%, calc\(100vw - 32px\)\);/g) || []).length, 2);
});

test("account enquiry history has a bounded wait and localized retry states", async () => {
  const account = await readFile("src/app/account/page.tsx", "utf8");
  const endpoint = await readFile("src/app/api/customer/enquiries/route.ts", "utf8");
  assert.match(account, /signal: AbortSignal\.timeout\(10000\)/);
  assert.match(account, /t\("accountUI\.timeout"\)/);
  assert.match(account, /t\("accountUI\.loadError"\)/);
  assert.match(endpoint, /\.abortSignal\(AbortSignal\.timeout\(7000\)\)/);
  assert.match(endpoint, /status: timedOut \? 504 : 500/);
  assert.ok(getPath(en, "accountUI.timeout"));
  assert.ok(getPath(hi, "accountUI.timeout"));
  assert.ok(getPath(en, "accountUI.loadError"));
  assert.ok(getPath(hi, "accountUI.loadError"));
});

test("assistant offers only localized interface languages and retains Hindi for Hinglish conversations", async () => {
  const { assistantLanguages } = await importTypeScript("src/lib/assistant-languages.ts");
  assert.deepEqual(assistantLanguages.map(({ code }) => code), ["en", "hi"]);
  assert.equal(assistantLanguages[1].nativeName, "हिन्दी");
  const endpoint = await readFile("src/app/api/assistant/route.ts", "utf8");
  assert.match(endpoint, /Understand English, conversational Hindi in Devanagari, and Hinglish\/Roman Hindi/);
  assert.match(endpoint, /answer Devanagari Hindi in Hindi and Roman Hindi\/Hinglish naturally/);
});

test("PWA installation help selects browser-specific instructions in both locales", async () => {
  const { getInstallInstructionsKey } = await importTypeScript("src/lib/pwa-install.ts");
  assert.equal(getInstallInstructionsKey("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"), "iosInstructions");
  assert.equal(getInstallInstructionsKey("Mozilla/5.0 (Linux; Android 14) SamsungBrowser/26.0 Chrome/130.0"), "samsungInstructions");
  assert.equal(getInstallInstructionsKey("Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36"), "androidInstructions");
  assert.equal(getInstallInstructionsKey("Mozilla/5.0 (Android 14; Mobile; rv:130.0) Firefox/130.0"), "firefoxInstructions");
  assert.equal(getInstallInstructionsKey("Mozilla/5.0 (Windows NT 10.0) Chrome/130.0.0.0 Safari/537.36"), "desktopInstructions");
  assert.equal(getInstallInstructionsKey("UnknownBrowser/1.0"), "manualInstructions");
  const installPrompt = await readFile("src/components/install-prompt.tsx", "utf8");
  assert.match(installPrompt, /t\(`pwa\.\$\{instructionsKey\}`\)/);
  for (const key of ["iosInstructions", "samsungInstructions", "androidInstructions", "firefoxInstructions", "desktopInstructions", "manualInstructions"]) {
    assert.ok(getPath(en, `pwa.${key}`), `English install help missing ${key}`);
    assert.ok(getPath(hi, `pwa.${key}`), `Hindi install help missing ${key}`);
  }
});
