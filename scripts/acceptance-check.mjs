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

test("public wholesale copy avoids unsupported inventory, margin, and fulfilment claims", async () => {
  for (const [language, resource] of [["English", en], ["Hindi", hi]]) {
    const copy = JSON.stringify({ home: resource.home, login: resource.auth });
    assert.doesNotMatch(copy, /50\s*\+\s*km|verified inventory|verified suppliers|fresh godown lots|retail margins|dispatch updates|download verified wholesale quotations/i, `${language} copy contains an unsupported claim`);
    assert.equal(typeof getPath(resource, "auth.loadingLogin"), "string");
  }
  const loginPage = await read("src/app/login/page.tsx");
  const layout = await read("src/app/layout.tsx");
  const homePage = await read("src/app/page.tsx");
  const businessSettings = await read("src/lib/business-settings.ts");
  const readme = await read("README.md");
  assert.match(loginPage, /t\("auth\.loadingLogin"\)/);
  for (const [file, source] of [["layout metadata", layout], ["homepage", homePage], ["business defaults", businessSettings], ["README", readme]]) {
    assert.doesNotMatch(source, /50\s*\+\s*km|verified inventory|verified suppliers|retail margins|fresh godown lots/i, `${file} contains unsupported wholesale claims`);
  }
  assert.doesNotMatch(readme, /22 Indian languages|all 22 languages|real-time in-stock/i);
  assert.match(readme, /English, Devanagari Hindi, and Hinglish/);
  assert.match(layout, /areaServed:\s*"Maya Bazar and nearby markets"/);
  assert.doesNotMatch(layout, /priceRange:/, "structured data must not imply unverified prices");
});

test("wholesale sheets show only known catalogue data and request quotes for quote-only products", async () => {
  const modal = await read("src/components/rate-card-modal.tsx");
  for (const key of ["rateCard.title", "rateCard.unspecified", "rateCard.priceRequest", "rateCard.notice"]) {
    assert.equal(typeof getPath(en, key), "string", `missing English translation: ${key}`);
    assert.equal(typeof getPath(hi, key), "string", `missing Hindi translation: ${key}`);
  }
  assert.match(modal, /item\.quoteOnly \|\| !item\.price/);
  assert.match(modal, /item\.packSize \|\| item\.packing \|\| item\.unit \|\| t\("rateCard\.unspecified"\)/);
  assert.match(modal, /item\.moq \|\| t\("rateCard\.unspecified"\)/);
  assert.doesNotMatch(modal, /Active Batch Rates|1 Carton|Carton \/ Master|subject to live batch availability/);
});

test("known catalogue category names use approved Hindi labels when database translations are absent", async () => {
  const { categoryTranslationKey } = await importTypeScript("src/lib/category-labels.ts");
  const entries = [
    ["Masala & Spices", "home.categories.0.0"],
    ["Edible Oils", "home.categories.1.0"],
    ["Matchsticks", "home.categories.2.0"],
    ["Agarbatti", "home.categories.3.0"],
    ["Dhoop", "home.categories.4.0"],
    ["Kapoor & Pooja Products", "home.categories.5.0"],
    ["Other FMCG Essentials", "home.categories.6.0"]
  ];
  for (const [name, expectedKey] of entries) {
    assert.equal(categoryTranslationKey(name), expectedKey);
    assert.match(getPath(hi, expectedKey), /\p{Script=Devanagari}/u, `Hindi category must use Devanagari: ${name}`);
  }
  assert.equal(categoryTranslationKey("Unlisted supplier category"), null);
  const label = await read("src/components/localized-product-description.tsx");
  assert.match(label, /hindi\?\.trim\(\) \|\| fallback/);
});

test("dynamic admin status and setup labels exist in both languages", () => {
  const keys = [
    "adminUI.adminSections", "adminUI.searchEnquiries", "adminUI.filterLegacyStatus",
    "adminUI.localizedCatalogueTitle", "adminUI.assistantRateLimitTitle", "adminUI.auditFailed"
  ];
  for (const key of keys) {
    assert.equal(typeof getPath(en, key), "string", `missing English translation: ${key}`);
    assert.equal(typeof getPath(hi, key), "string", `missing Hindi translation: ${key}`);
    assert.match(getPath(hi, key), /\p{Script=Devanagari}/u, `Hindi text is not in Devanagari: ${key}`);
  }
  for (const status of ["All", "New", "Contacted", "Confirmed", "Delivered", "Cancelled"]) {
    assert.equal(typeof getPath(en, `adminUI.legacyStatus.${status}`), "string");
    assert.equal(typeof getPath(hi, `adminUI.legacyStatus.${status}`), "string");
  }
});

test("account profile, password feedback, and admin actions are localized in English and Hindi", async () => {
  const account = await read("src/app/account/page.tsx");
  const keys = [
    "accountUI.adminPanel", "accountUI.saveProfileSuccess", "accountUI.saveProfileError",
    "accountUI.passwordTooShort", "accountUI.passwordMismatch", "accountUI.passwordUpdateSuccess",
    "accountUI.passwordUpdateError", "account.logout"
  ];
  for (const key of keys) {
    assert.equal(typeof getPath(en, key), "string", `missing English translation: ${key}`);
    assert.equal(typeof getPath(hi, key), "string", `missing Hindi translation: ${key}`);
  }
  assert.match(account, /t\("accountUI\.saveProfileSuccess"\)/);
  assert.match(account, /t\("accountUI\.passwordMismatch"\)/);
  assert.match(account, /t\("accountUI\.adminPanel"\)/);
  assert.match(account, /t\("account\.logout"\)/);
  assert.doesNotMatch(account, /setProfileMessage\(\{\s*text:\s*error\.message/);
  assert.doesNotMatch(account, /Admin Panel|>\s*Sign Out/);
});

test("web manifest has installable Gayatri Store metadata and required icons", async () => {
  const { default: manifest } = await importTypeScript("src/app/manifest.ts");
  const value = manifest();
  assert.equal(value.name, "Gayatri Store");
  assert.equal(value.short_name, "Gayatri Store");
  assert.equal(value.display, "standalone");
  for (const size of ["192x192", "512x512"]) {
    const icon = value.icons.find((entry) => entry.sizes === size && entry.type === "image/png");
    assert.ok(icon, `manifest is missing its ${size} PNG icon`);
    const png = await readFile(path.join(root, "public", icon.src.replace(/^\//, "")));
    assert.equal(png.toString("hex", 0, 8), "89504e470d0a1a0a", `${size} icon is not a PNG`);
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, size, `${size} icon has incorrect dimensions`);
  }
  const maskable = value.icons.find((icon) => icon.purpose === "maskable");
  assert.ok(maskable, "manifest is missing a maskable icon");
  const maskablePng = await readFile(path.join(root, "public", maskable.src.replace(/^\//, "")));
  assert.equal(maskablePng.toString("hex", 0, 8), "89504e470d0a1a0a");
  assert.equal(maskablePng.readUInt32BE(16), 512);
  assert.equal(maskablePng.readUInt32BE(20), 512);
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
  assert.match(worker, /gayatri-static-v3/);
  assert.match(worker, /"\/icons\/gayatri-store-192\.svg"/);
  const offline = await read("public/offline.html");
  assert.match(offline, /src="\/icons\/gayatri-store-192\.svg"/);
  assert.match(worker, /if \(!isStaticAsset\) return/);
  assert.doesNotMatch(worker, /cache\.put\([^\n]*(?:\/api\/|\/account|\/order)/);
  assert.match(manager, /registration\.waiting\?\.postMessage\(\{ type: "SKIP_WAITING" \}\)/);
  assert.match(manager, /window\.location\.reload\(\)/);
});

test("ordering stays a server-confirmed enquiry flow without a direct-order endpoint", async () => {
  const orderRoute = await read("src/app/api/orders/route.ts");
  const enquiryRoute = await read("src/app/api/enquiries/route.ts");
  const orderForm = await read("src/components/order-form.tsx");
  assert.match(orderRoute, /status:\s*410/);
  assert.match(orderRoute, /Direct orders are no longer accepted/);
  assert.match(enquiryRoute, /export async function POST/);
  assert.match(enquiryRoute, /client_request_id/);
  assert.match(orderForm, /signal: AbortSignal\.timeout\(15_000\)/);
  assert.match(orderForm, /timedOut \? t\("orderForm\.requestTimeout"\)/);
  assert.ok(getPath(en, "orderForm.requestTimeout"));
  assert.ok(getPath(hi, "orderForm.requestTimeout"));
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

test("homepage brands come from public catalogue facets and link to exact brand filters", async () => {
  const page = await readFile("src/app/page.tsx", "utf8");
  const featured = await readFile("src/components/featured-products.tsx", "utf8");
  assert.doesNotMatch(page, /const featuredBrands\s*=/);
  assert.match(featured, /setBrands\(result\.brands \|\| \[\]\)/);
  assert.match(featured, /brands\.map\(\(brand\)/);
  assert.match(featured, /\/products\?brand=\$\{encodeURIComponent\(brand\.name\)\}/);
  assert.match(featured, /home\.noBrands/);
});

test("product detail image gallery supports keyboard-accessible image selection", async () => {
  const page = await readFile("src/app/products/[slug]/page.tsx", "utf8");
  const gallery = await readFile("src/components/product-image-gallery.tsx", "utf8");
  assert.match(page, /<ProductImageGallery images=\{images\}/);
  assert.match(gallery, /setSelectedIndex\(index\)/);
  assert.match(gallery, /aria-pressed=\{selected\}/);
  assert.match(gallery, /focus-visible:ring-2/);
  assert.match(gallery, /t\("product\.imageGallery"\)/);
  assert.match(gallery, /t\("product\.viewImage"\)/);
  assert.ok(getPath(en, "product.imageGallery"));
  assert.ok(getPath(hi, "product.imageGallery"));
});

test("catalogue deadlines abort Supabase reads instead of leaving timed-out requests running", async () => {
  const products = await read("src/lib/products.ts");
  const catalogue = await read("src/lib/catalogue.ts");
  assert.match(products, /\.range\(offset, offset \+ limit - 1\)[\s\S]*?\.abortSignal\(AbortSignal\.timeout\(3500\)\)/);
  assert.equal((products.match(/\.abortSignal\(AbortSignal\.timeout\(3000\)\)/g) || []).length, 2);
  assert.doesNotMatch(products, /Products query timed out|Product by slug query timed out/);
  assert.equal((catalogue.match(/\.abortSignal\(AbortSignal\.timeout\(2500\)\)/g) || []).length, 3);
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
  assert.match(css, /overflow-x:\s*clip/);
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

test("shared auth provider dynamically loads Supabase to keep the SDK out of its initial chunk", async () => {
  const auth = await read("src/context/auth-context.tsx");
  assert.doesNotMatch(auth, /import\s*\{\s*getSupabaseBrowser\s*\}\s*from\s*["']@\/lib\/supabase-browser["']/);
  assert.match(auth, /withTimeout\([\s\S]*?import\(["']@\/lib\/supabase-browser["']\),\s*8000/);
  assert.match(auth, /withTimeout\(supabase\.auth\.getSession\(\),\s*5000/);
});

test("Supabase Auth requests abort after the deadline and timeouts are localized", async () => {
  const { createSupabaseAuthTimeoutFetch } = await importTypeScript("src/lib/supabase-fetch.ts");
  const authFetch = createSupabaseAuthTimeoutFetch((_input, init) => new Promise((resolve, reject) => {
    const signal = init?.signal;
    if (!signal) return reject(new Error("Auth request had no timeout signal"));
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  }), 15);
  await assert.rejects(authFetch("https://project.supabase.co/auth/v1/token"), (error) => error?.name === "TimeoutError");

  let receivedInit;
  const passThroughFetch = createSupabaseAuthTimeoutFetch((_input, init) => {
    receivedInit = init;
    return Promise.resolve(new Response("ok"));
  }, 15);
  await passThroughFetch("https://project.supabase.co/rest/v1/profiles");
  assert.equal(receivedInit, undefined, "non-auth Supabase requests retain their existing timeout controls");

  const browserClient = await read("src/lib/supabase-browser.ts");
  const auth = await read("src/context/auth-context.tsx");
  const login = await read("src/app/login/page.tsx");
  const register = await read("src/app/register/page.tsx");
  assert.match(browserClient, /global:\s*\{\s*fetch: createSupabaseAuthTimeoutFetch/);
  assert.match(auth, /\.abortSignal\(AbortSignal\.timeout\(4000\)\)/);
  assert.match(login, /t\("auth\.requestTimeout"\)/);
  assert.match(register, /t\("auth\.requestTimeout"\)/);
  assert.ok(getPath(en, "auth.requestTimeout"));
  assert.ok(getPath(hi, "auth.requestTimeout"));
  assert.match(login, /t\("auth\.networkError"\)/);
  assert.match(register, /t\("auth\.networkError"\)/);
  assert.ok(getPath(en, "auth.networkError"));
  assert.ok(getPath(hi, "auth.networkError"));
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
  assert.match(installPrompt, /setInstructionsKey\(getInstallInstructionsKey\(navigator\.userAgent\)\)/);
  assert.doesNotMatch(installPrompt, /useState\(\(\) => getInstallInstructionsKey/);
  for (const key of ["iosInstructions", "samsungInstructions", "androidInstructions", "firefoxInstructions", "desktopInstructions", "manualInstructions"]) {
    assert.ok(getPath(en, `pwa.${key}`), `English install help missing ${key}`);
    assert.ok(getPath(hi, `pwa.${key}`), `Hindi install help missing ${key}`);
  }
});
