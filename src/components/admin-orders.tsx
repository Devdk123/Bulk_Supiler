"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Download, FileSpreadsheet, ImagePlus, Loader2, Lock, LogOut, Plus, Save, Search, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { enquiryStatuses } from "@/lib/validation";

type Status = "draft" | "published" | "archived";
type StockStatus = "unknown" | "in_stock" | "low_stock" | "out_of_stock" | "discontinued";
type ImageForm = { image_url: string; alt_text: string };
type VariantForm = {
  id?: string;
  name: string;
  sku: string;
  unit: string;
  pack_size: string;
  units_per_carton: string;
  moq_quantity: string;
  order_increment: string;
  price_amount: string;
  price_currency: string;
  price_unit: string;
  stock_status: StockStatus;
  active: boolean;
};
type PriceTierForm = {
  variant_id: string;
  minimum_quantity: string;
  unit_price: string;
  currency: string;
  price_unit: string;
};
type ProductForm = {
  name: string;
  sku: string;
  description: string;
  brand_id: string;
  category_id: string;
  variant: string;
  unit: string;
  pack_size: string;
  units_per_carton: string;
  moq_quantity: string;
  order_increment: string;
  price_amount: string;
  price_currency: string;
  price_unit: string;
  quote_only: boolean;
  stock_status: StockStatus;
  status: Status;
  images: ImageForm[];
  variants: VariantForm[];
  price_tiers: PriceTierForm[];
};
type AdminProduct = ProductForm & {
  id: string;
  slug: string;
  active: boolean;
  created_at: string;
  brand: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
  image_url: string | null;
};
type Taxonomy = { id: string; name: string; status: Status; slug: string; logo_url?: string | null; parent_id?: string | null };
type EnquiryItem = { product_name: string; variant_name: string | null; packaging: string | null; unit: string | null; quantity: number };
type AdminEnquiry = {
  id: string;
  reference: string;
  business_name: string;
  contact_person: string;
  phone: string;
  email: string | null;
  city: string;
  state: string;
  pin_code: string;
  gstin: string | null;
  delivery_requirements: string | null;
  message: string | null;
  internal_notes: string | null;
  status: (typeof enquiryStatuses)[number];
  created_at: string;
  items: EnquiryItem[];
};
type ImportPreview = {
  validRows: Array<{ row: number; product: Record<string, unknown>; variants: unknown[]; images: unknown[]; price_tiers: unknown[] }>;
  invalidRows: Array<{ row: number; errors: string[] }>;
  totalRows: number;
};
type Tab = "products" | "brands" | "enquiries" | "legacy-orders" | "import" | "settings" | "diagnostics";
type LegacyOrder = {
  id: string;
  customer_name: string;
  phone: string;
  whatsapp: string;
  product_name: string;
  quantity: string;
  address: string;
  city: string;
  payment_method: string;
  message: string | null;
  status: string;
  created_at: string;
};
type SettingsForm = {
  contact_phone: string;
  whatsapp_number: string;
  contact_email: string;
  business_address: string;
  business_hours: string;
  delivery_coverage: string;
};

const emptyProduct: ProductForm = {
  name: "",
  sku: "",
  description: "",
  brand_id: "",
  category_id: "",
  variant: "",
  unit: "",
  pack_size: "",
  units_per_carton: "",
  moq_quantity: "",
  order_increment: "",
  price_amount: "",
  price_currency: "INR",
  price_unit: "",
  quote_only: true,
  stock_status: "unknown",
  status: "draft",
  images: [],
  variants: [],
  price_tiers: []
};

const emptyVariant: VariantForm = {
  name: "",
  sku: "",
  unit: "",
  pack_size: "",
  units_per_carton: "",
  moq_quantity: "",
  order_increment: "",
  price_amount: "",
  price_currency: "INR",
  price_unit: "",
  stock_status: "unknown",
  active: false
};

function nullableNumber(value: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

async function readResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data as T;
}

function productToForm(product: AdminProduct): ProductForm {
  return {
    name: product.name,
    sku: product.sku || "",
    description: product.description || "",
    brand_id: product.brand_id || "",
    category_id: product.category_id || "",
    variant: product.variant || "",
    unit: product.unit || "",
    pack_size: product.pack_size || "",
    units_per_carton: product.units_per_carton?.toString() || "",
    moq_quantity: product.moq_quantity?.toString() || "",
    order_increment: product.order_increment?.toString() || "",
    price_amount: product.price_amount?.toString() || "",
    price_currency: product.price_currency || "INR",
    price_unit: product.price_unit || "",
    quote_only: product.quote_only,
    stock_status: product.stock_status,
    status: product.status,
    images: (product.images || []).map((image) => ({ image_url: image.image_url, alt_text: image.alt_text || "" })),
    variants: (product.variants || []).map((variant) => ({
      ...emptyVariant,
      ...variant,
      units_per_carton: variant.units_per_carton?.toString() || "",
      moq_quantity: variant.moq_quantity?.toString() || "",
      order_increment: variant.order_increment?.toString() || "",
      price_amount: variant.price_amount?.toString() || ""
    })),
    price_tiers: (product.price_tiers || []).map((tier) => ({
      variant_id: tier.variant_id || "",
      minimum_quantity: String(tier.minimum_quantity),
      unit_price: String(tier.unit_price),
      currency: tier.currency || "INR",
      price_unit: tier.price_unit || ""
    }))
  };
}

export function AdminOrders() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [brands, setBrands] = useState<Taxonomy[]>([]);
  const [categories, setCategories] = useState<Taxonomy[]>([]);
  const [enquiries, setEnquiries] = useState<AdminEnquiry[]>([]);
  const [legacyOrders, setLegacyOrders] = useState<LegacyOrder[]>([]);
  const [legacyOrderSearch, setLegacyOrderSearch] = useState("");
  const [legacyOrderStatus, setLegacyOrderStatus] = useState("All");
  const [legacyOrderPage, setLegacyOrderPage] = useState(0);
  const [legacyOrdersHaveMore, setLegacyOrdersHaveMore] = useState(false);
  const [legacyOrdersLoading, setLegacyOrdersLoading] = useState(false);
  const [businessSettings, setBusinessSettings] = useState<SettingsForm>({
    contact_phone: "",
    whatsapp_number: "",
    contact_email: "",
    business_address: "",
    business_hours: "",
    delivery_coverage: ""
  });
  const [settingsError, setSettingsError] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [editingProductId, setEditingProductId] = useState("");
  const [productSaving, setProductSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [pendingImageRemovals, setPendingImageRemovals] = useState<string[]>([]);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [enquirySearch, setEnquirySearch] = useState("");
  const [enquiryStatus, setEnquiryStatus] = useState("All");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [taxonomyName, setTaxonomyName] = useState("");
  const [taxonomyStatus, setTaxonomyStatus] = useState<Status>("draft");
  const [taxonomyLogo, setTaxonomyLogo] = useState("");
  const [editingBrandId, setEditingBrandId] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [categoryParent, setCategoryParent] = useState("");
  const [taxonomyError, setTaxonomyError] = useState("");
  const [taxonomyBusy, setTaxonomyBusy] = useState(false);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const query = search.trim().toLowerCase();
    return !query || [product.name, product.sku || "", product.brand?.name || "", product.category?.name || ""]
      .some((value) => value.toLowerCase().includes(query));
  }), [products, search]);

  async function loadDashboard() {
    const [productResponse, brandResponse, categoryResponse, enquiryResponse, settingsResponse, ordersResponse] = await Promise.all([
      fetch("/api/products", { cache: "no-store" }),
      fetch("/api/admin/brands", { cache: "no-store" }),
      fetch("/api/admin/categories", { cache: "no-store" }),
      fetch("/api/admin/enquiries", { cache: "no-store" }),
      fetch("/api/admin/settings", { cache: "no-store" }),
      fetch("/api/orders?limit=50&offset=0", { cache: "no-store" })
    ]);
    const [productData, brandData, categoryData, enquiryData, settingsData, ordersData] = await Promise.all([
      readResponse<{ products: AdminProduct[] }>(productResponse),
      readResponse<{ brands: Taxonomy[] }>(brandResponse),
      readResponse<{ categories: Taxonomy[] }>(categoryResponse),
      readResponse<{ enquiries: AdminEnquiry[] }>(enquiryResponse),
      readResponse<{ settings: Partial<SettingsForm> }>(settingsResponse),
      readResponse<{ orders: LegacyOrder[]; hasMore: boolean }>(ordersResponse)
    ]);
    setProducts(productData.products);
    setBrands(brandData.brands);
    setCategories(categoryData.categories);
    setEnquiries(enquiryData.enquiries);
    setBusinessSettings((current) => ({ ...current, ...settingsData.settings }));
    setLegacyOrders(ordersData.orders);
    setLegacyOrdersHaveMore(ordersData.hasMore);
    setLegacyOrderPage(0);
  }

  async function loadLegacyOrders(page: number, status = legacyOrderStatus, search = legacyOrderSearch) {
    setLegacyOrdersLoading(true);
    const query = new URLSearchParams({ limit: "50", offset: String(page * 50) });
    if (status !== "All") query.set("status", status);
    if (search.trim()) query.set("search", search.trim());
    try {
      const result = await readResponse<{ orders: LegacyOrder[]; hasMore: boolean }>(
        await fetch(`/api/orders?${query}`, { cache: "no-store" })
      );
      setLegacyOrders(result.orders);
      setLegacyOrdersHaveMore(result.hasMore);
      setLegacyOrderPage(page);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load legacy orders.");
    } finally {
      setLegacyOrdersLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => readResponse<{ authenticated: boolean }>(response))
      .then(async (result) => {
        if (!mounted || !result.authenticated) return;
        await loadDashboard();
        if (mounted) setAuthenticated(true);
      })
      .catch((loadError: unknown) => {
        if (mounted && loadError instanceof Error && loadError.message !== "Unauthorized") setLoginError(loadError.message);
      })
      .finally(() => { if (mounted) setCheckingSession(false); });
    return () => { mounted = false; };
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      await readResponse(await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      }));
      await loadDashboard();
      setAuthenticated(true);
      setPassword("");
    } catch (loginFailure) {
      setLoginError(loginFailure instanceof Error ? loginFailure.message : "Unable to sign in.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthenticated(false);
    setProducts([]);
    setEnquiries([]);
  }

  function editProduct(product: AdminProduct) {
    setEditingProductId(product.id);
    setProductForm(productToForm(product));
    setPendingImageRemovals([]);
    setError("");
    setActiveTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetProduct() {
    setEditingProductId("");
    setProductForm(emptyProduct);
    setPendingImageRemovals([]);
  }

  function updateProduct<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setProductForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setImageUploading(true);
    setError("");
    try {
      const uploaded: ImageForm[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.set("file", file);
        const result = await readResponse<{ image_url: string }>(
          await fetch("/api/admin/images", { method: "POST", body: formData })
        );
        uploaded.push({ image_url: result.image_url, alt_text: productForm.name });
      }
      setProductForm((current) => ({ ...current, images: [...current.images, ...uploaded] }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload images.");
    } finally {
      setImageUploading(false);
    }
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProductSaving(true);
    setError("");
    const payload = {
      ...productForm,
      units_per_carton: nullableNumber(productForm.units_per_carton),
      moq_quantity: nullableNumber(productForm.moq_quantity),
      order_increment: nullableNumber(productForm.order_increment),
      price_amount: nullableNumber(productForm.price_amount),
      image_url: productForm.images[0]?.image_url || null,
      variants: productForm.variants.map((variant) => ({
        ...variant,
        units_per_carton: nullableNumber(variant.units_per_carton),
        moq_quantity: nullableNumber(variant.moq_quantity),
        order_increment: nullableNumber(variant.order_increment),
        price_amount: nullableNumber(variant.price_amount)
      })),
      price_tiers: productForm.price_tiers.map((tier) => ({
        ...tier,
        variant_id: tier.variant_id || null,
        minimum_quantity: Number(tier.minimum_quantity),
        unit_price: Number(tier.unit_price)
      }))
    };

    try {
      const response = await fetch(editingProductId ? `/api/products?id=${editingProductId}` : "/api/products", {
        method: editingProductId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await readResponse<{ product: AdminProduct }>(response);
      const removed = await Promise.all(pendingImageRemovals.map(async (image_url) => {
        const response = await fetch("/api/admin/images", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url })
        });
        return response.ok;
      }));
      await loadDashboard();
      resetProduct();
      if (removed.some((ok) => !ok)) setError("Product saved, but one or more removed images could not be deleted from storage.");
      else setError(`${result.product.name} saved.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save product.");
    } finally {
      setProductSaving(false);
    }
  }

  async function changeProductStatus(product: AdminProduct, status: Status) {
    setError("");
    try {
      await readResponse(await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      }));
      await loadDashboard();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Unable to update product status.");
    }
  }

  async function deleteProduct(product: AdminProduct) {
    if (!window.confirm(`Delete ${product.name}? If it is referenced by an enquiry it will be archived to preserve history.`)) return;
    try {
      const result = await readResponse<{ archived?: boolean }>(await fetch(`/api/products/${product.id}`, { method: "DELETE" }));
      await loadDashboard();
      setError(result.archived ? "Product archived because enquiry history refers to it." : "Product deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to remove product.");
    }
  }

  async function submitTaxonomy(event: React.FormEvent<HTMLFormElement>, kind: "brands" | "categories") {
    event.preventDefault();
    setTaxonomyBusy(true);
    setTaxonomyError("");
    const editingId = kind === "brands" ? editingBrandId : editingCategoryId;
    const payload = kind === "brands"
      ? { name: taxonomyName, status: taxonomyStatus, logo_url: taxonomyLogo || null }
      : { name: taxonomyName, status: taxonomyStatus, parent_id: categoryParent || null };
    try {
      await readResponse(await fetch(editingId ? `/api/admin/${kind}/${editingId}` : `/api/admin/${kind}`, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }));
      setTaxonomyName("");
      setTaxonomyLogo("");
      setCategoryParent("");
      setTaxonomyStatus("draft");
      setEditingBrandId("");
      setEditingCategoryId("");
      await loadDashboard();
    } catch (taxonomySaveError) {
      setTaxonomyError(taxonomySaveError instanceof Error ? taxonomySaveError.message : "Unable to save.");
    } finally {
      setTaxonomyBusy(false);
    }
  }

  function editTaxonomy(item: Taxonomy, kind: "brands" | "categories") {
    setTaxonomyName(item.name);
    setTaxonomyStatus(item.status);
    setTaxonomyLogo(item.logo_url || "");
    setCategoryParent(item.parent_id || "");
    setEditingBrandId(kind === "brands" ? item.id : "");
    setEditingCategoryId(kind === "categories" ? item.id : "");
  }

  async function deleteTaxonomy(item: Taxonomy, kind: "brands" | "categories") {
    if (!window.confirm(`Delete ${item.name}? Products will keep their records without this ${kind === "brands" ? "brand" : "category"}.`)) return;
    setTaxonomyError("");
    try {
      await readResponse(await fetch(`/api/admin/${kind}/${item.id}`, { method: "DELETE" }));
      await loadDashboard();
    } catch (deleteError) {
      setTaxonomyError(deleteError instanceof Error ? deleteError.message : "Unable to delete.");
    }
  }

  async function previewImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    setImportLoading(true);
    setImportError("");
    setImportPreview(null);
    try {
      setImportPreview(await readResponse<ImportPreview>(await fetch("/api/admin/products/import", {
        method: "POST",
        body: formData
      })));
    } catch (previewError) {
      setImportError(previewError instanceof Error ? previewError.message : "Unable to preview import.");
    } finally {
      setImportLoading(false);
    }
  }

  async function commitImport() {
    if (!importPreview?.validRows.length) return;
    setImportLoading(true);
    setImportError("");
    try {
      const result = await readResponse<{ imported: number }>(await fetch("/api/admin/products/import", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: importPreview.validRows })
      }));
      setImportPreview(null);
      setImportError(`Imported ${result.imported} products as configured.`);
      await loadDashboard();
    } catch (commitError) {
      setImportError(commitError instanceof Error ? commitError.message : "Unable to import products.");
    } finally {
      setImportLoading(false);
    }
  }

  async function updateEnquiry(enquiry: AdminEnquiry, updates: { status?: AdminEnquiry["status"]; internal_notes?: string }) {
    try {
      const result = await readResponse<{ enquiry: Partial<AdminEnquiry> }>(await fetch(`/api/admin/enquiries/${enquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      }));
      setEnquiries((current) => current.map((item) => item.id === enquiry.id ? { ...item, ...result.enquiry } : item));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update enquiry.");
    }
  }

  async function uploadBrandLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setTaxonomyBusy(true);
    setTaxonomyError("");
    const formData = new FormData();
    formData.set("file", file);
    formData.set("folder", "brands");
    try {
      const result = await readResponse<{ image_url: string }>(await fetch("/api/admin/images", { method: "POST", body: formData }));
      setTaxonomyLogo(result.image_url);
    } catch (uploadError) {
      setTaxonomyError(uploadError instanceof Error ? uploadError.message : "Unable to upload brand logo.");
    } finally {
      setTaxonomyBusy(false);
    }
  }

  async function saveBusinessSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsError("");
    try {
      await readResponse(await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: businessSettings })
      }));
      setSettingsError("Business settings saved.");
    } catch (saveError) {
      setSettingsError(saveError instanceof Error ? saveError.message : "Unable to save business settings.");
    }
  }

  async function filterEnquiries() {
    const query = new URLSearchParams({ status: enquiryStatus });
    if (enquirySearch.trim()) query.set("search", enquirySearch.trim());
    try {
      const result = await readResponse<{ enquiries: AdminEnquiry[] }>(await fetch(`/api/admin/enquiries?${query}`, { cache: "no-store" }));
      setEnquiries(result.enquiries);
    } catch (filterError) {
      setError(filterError instanceof Error ? filterError.message : "Unable to search enquiries.");
    }
  }

  if (checkingSession) {
    return <section className="container-page py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /><p className="mt-3 text-sm text-muted-foreground">Checking admin session...</p></section>;
  }

  if (!authenticated) {
    return (
      <section className="py-14">
        <div className="container-page max-w-lg">
          <Card className="premium-shadow">
            <CardContent className="p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-accent"><Lock className="h-6 w-6" /></div>
              <h1 className="mt-5 text-3xl font-extrabold text-primary">Gayatri Store Admin</h1>
              <p className="mt-3 text-muted-foreground">Sign in to manage products, categories, and wholesale enquiries for Maya Bazar.</p>
              <form onSubmit={login} className="mt-6 grid gap-4">
                {loginError ? <p role="alert" className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{loginError}</p> : null}
                <div className="grid gap-2">
                  <Label htmlFor="admin-password">Admin password</Label>
                  <Input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
                </div>
                <Button type="submit" variant="gold" disabled={loginLoading || !password}>
                  {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Sign in
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const publishedCount = products.filter((product) => product.status === "published").length;
  const draftCount = products.filter((product) => product.status === "draft").length;
  const newEnquiryCount = enquiries.filter((enquiry) => enquiry.status === "New").length;

  return (
    <section className="py-10">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">Administration</p>
            <h1 className="mt-2 text-3xl font-extrabold text-primary">Gayatri Store Administration</h1>
          </div>
          <Button variant="outline" onClick={logout}><LogOut className="h-4 w-4" /> Sign out</Button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Published products" value={publishedCount} />
          <Stat label="Draft products" value={draftCount} />
          <Stat label="New enquiries" value={newEnquiryCount} />
        </div>

        <nav aria-label="Admin sections" className="mt-8 flex flex-wrap gap-2 border-b pb-3">
          {([
            ["products", "Products"],
            ["brands", "Brands & categories"],
            ["enquiries", "Enquiries"],
            ["legacy-orders", "Legacy orders"],
            ["import", "Import / export"],
            ["settings", "Business settings"],
            ["diagnostics", "System Diagnostics"]
          ] as const).map(([tab, title]) => (
            <Button key={tab} variant={activeTab === tab ? "gold" : "outline"} className="rounded-xl font-bold" onClick={() => setActiveTab(tab)}>{title}</Button>
          ))}
        </nav>

        {error ? <p role="status" className="mt-5 rounded-md border bg-secondary p-3 text-sm">{error}</p> : null}
        {activeTab === "products" ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardContent className="p-5">
                <h2 className="text-xl font-extrabold text-primary">{editingProductId ? "Edit product" : "Create product"}</h2>
                <p className="mt-2 text-sm text-muted-foreground">New products are drafts unless you publish them. Leave unknown specifications blank.</p>
                <form onSubmit={saveProduct} className="mt-5 grid gap-4">
                  <Field label="Product name"><Input required value={productForm.name} onChange={(event) => updateProduct("name", event.target.value)} /></Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Brand">
                      <select value={productForm.brand_id} onChange={(event) => updateProduct("brand_id", event.target.value)} className="h-11 rounded-md border bg-background px-3 text-sm">
                        <option value="">No brand selected</option>
                        {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name} ({brand.status})</option>)}
                      </select>
                    </Field>
                    <Field label="Category">
                      <select value={productForm.category_id} onChange={(event) => updateProduct("category_id", event.target.value)} className="h-11 rounded-md border bg-background px-3 text-sm">
                        <option value="">No category selected</option>
                        {categories.map((category) => <option key={category.id} value={category.id}>{category.name} ({category.status})</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="SKU (optional)"><Input value={productForm.sku} onChange={(event) => updateProduct("sku", event.target.value)} /></Field>
                    <Field label="Product variant / fragrance"><Input value={productForm.variant} onChange={(event) => updateProduct("variant", event.target.value)} /></Field>
                  </div>
                  <Field label="Description"><Textarea value={productForm.description} onChange={(event) => updateProduct("description", event.target.value)} maxLength={5000} /></Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Unit"><Input value={productForm.unit} onChange={(event) => updateProduct("unit", event.target.value)} placeholder="Set only when confirmed" /></Field>
                    <Field label="Pack size"><Input value={productForm.pack_size} onChange={(event) => updateProduct("pack_size", event.target.value)} /></Field>
                    <Field label="Units per carton"><Input type="number" min="1" value={productForm.units_per_carton} onChange={(event) => updateProduct("units_per_carton", event.target.value)} /></Field>
                    <Field label="Minimum order quantity"><Input type="number" min="0.001" step="any" value={productForm.moq_quantity} onChange={(event) => updateProduct("moq_quantity", event.target.value)} /></Field>
                    <Field label="Order increment"><Input type="number" min="0.001" step="any" value={productForm.order_increment} onChange={(event) => updateProduct("order_increment", event.target.value)} /></Field>
                    <Field label="Price unit"><Input value={productForm.price_unit} onChange={(event) => updateProduct("price_unit", event.target.value)} /></Field>
                  </div>
                  <label className="flex items-center gap-3 rounded-md border bg-secondary/50 p-3 text-sm font-semibold">
                    <input type="checkbox" checked={productForm.quote_only} onChange={(event) => updateProduct("quote_only", event.target.checked)} className="h-4 w-4" />
                    Price on request only
                  </label>
                  {!productForm.quote_only ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Wholesale price"><Input type="number" min="0.01" step="any" value={productForm.price_amount} onChange={(event) => updateProduct("price_amount", event.target.value)} /></Field>
                      <Field label="Currency code"><Input maxLength={3} value={productForm.price_currency} onChange={(event) => updateProduct("price_currency", event.target.value.toUpperCase())} /></Field>
                    </div>
                  ) : null}
                  <Field label="Stock status">
                    <select value={productForm.stock_status} onChange={(event) => updateProduct("stock_status", event.target.value as StockStatus)} className="h-11 rounded-md border bg-background px-3 text-sm">
                      {["unknown", "in_stock", "low_stock", "out_of_stock", "discontinued"].map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
                    </select>
                  </Field>

                  <fieldset className="grid gap-3 rounded-lg border p-4">
                    <legend className="px-1 font-bold text-primary">Product images</legend>
                    <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border bg-secondary px-3 py-2 text-sm font-semibold">
                      {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                      Upload JPEG, PNG or WebP (max 5 MB each)
                      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={uploadImages} className="sr-only" disabled={imageUploading} />
                    </label>
                    {productForm.images.length ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {productForm.images.map((image, index) => (
                          <div key={`${image.image_url}-${index}`} className="relative">
                            <Image src={image.image_url} alt={image.alt_text || productForm.name || "Product image"} width={240} height={160} unoptimized className="h-28 w-full rounded-md border object-cover" />
                            <button type="button" className="absolute right-1 top-1 rounded-full bg-background p-1" aria-label="Remove image" onClick={() => {
                              setPendingImageRemovals((current) => [...current, image.image_url]);
                              updateProduct("images", productForm.images.filter((_, imageIndex) => imageIndex !== index));
                            }}><X className="h-4 w-4" /></button>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-muted-foreground">No image uploaded.</p>}
                  </fieldset>

                  <fieldset className="grid gap-3 rounded-lg border p-4">
                    <legend className="px-1 font-bold text-primary">Variants and pack options</legend>
                    {productForm.variants.map((variant, index) => (
                      <div key={variant.id || index} className="grid gap-3 rounded-md bg-secondary/40 p-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">Option {index + 1}</p>
                          <Button type="button" variant="outline" size="icon" aria-label="Remove option" onClick={() => updateProduct("variants", productForm.variants.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input aria-label="Variant name" placeholder="Variant / fragrance" value={variant.name} onChange={(event) => updateProduct("variants", productForm.variants.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} />
                          <Input aria-label="Option SKU" placeholder="SKU (optional)" value={variant.sku} onChange={(event) => updateProduct("variants", productForm.variants.map((item, itemIndex) => itemIndex === index ? { ...item, sku: event.target.value } : item))} />
                          <Input aria-label="Pack size" placeholder="Pack size" value={variant.pack_size} onChange={(event) => updateProduct("variants", productForm.variants.map((item, itemIndex) => itemIndex === index ? { ...item, pack_size: event.target.value } : item))} />
                          <Input aria-label="Unit" placeholder="Unit" value={variant.unit} onChange={(event) => updateProduct("variants", productForm.variants.map((item, itemIndex) => itemIndex === index ? { ...item, unit: event.target.value } : item))} />
                          <Input aria-label="Option MOQ" type="number" min="0.001" step="any" placeholder="MOQ" value={variant.moq_quantity} onChange={(event) => updateProduct("variants", productForm.variants.map((item, itemIndex) => itemIndex === index ? { ...item, moq_quantity: event.target.value } : item))} />
                          <Input aria-label="Option order increment" type="number" min="0.001" step="any" placeholder="Order increment" value={variant.order_increment} onChange={(event) => updateProduct("variants", productForm.variants.map((item, itemIndex) => itemIndex === index ? { ...item, order_increment: event.target.value } : item))} />
                        </div>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={variant.active} onChange={(event) => updateProduct("variants", productForm.variants.map((item, itemIndex) => itemIndex === index ? { ...item, active: event.target.checked } : item))} /> Published option</label>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => updateProduct("variants", [...productForm.variants, { ...emptyVariant }])}><Plus className="h-4 w-4" /> Add option</Button>
                  </fieldset>

                  <fieldset className="grid gap-3 rounded-lg border p-4">
                    <legend className="px-1 font-bold text-primary">Quantity price tiers</legend>
                    {productForm.price_tiers.map((tier, index) => (
                      <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                        <Input aria-label="Tier minimum quantity" type="number" min="0.001" step="any" placeholder="From quantity" value={tier.minimum_quantity} onChange={(event) => updateProduct("price_tiers", productForm.price_tiers.map((item, itemIndex) => itemIndex === index ? { ...item, minimum_quantity: event.target.value } : item))} />
                        <Input aria-label="Tier unit price" type="number" min="0.01" step="any" placeholder="Unit price" value={tier.unit_price} onChange={(event) => updateProduct("price_tiers", productForm.price_tiers.map((item, itemIndex) => itemIndex === index ? { ...item, unit_price: event.target.value } : item))} />
                        <Input aria-label="Tier price unit" placeholder="Price unit" value={tier.price_unit} onChange={(event) => updateProduct("price_tiers", productForm.price_tiers.map((item, itemIndex) => itemIndex === index ? { ...item, price_unit: event.target.value } : item))} />
                        <Button type="button" variant="outline" size="icon" aria-label="Remove price tier" onClick={() => updateProduct("price_tiers", productForm.price_tiers.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => updateProduct("price_tiers", [...productForm.price_tiers, { variant_id: "", minimum_quantity: "", unit_price: "", currency: "INR", price_unit: "" }])}><Plus className="h-4 w-4" /> Add price tier</Button>
                  </fieldset>

                  <Field label="Publication status">
                    <select value={productForm.status} onChange={(event) => updateProduct("status", event.target.value as Status)} className="h-11 rounded-md border bg-background px-3 text-sm">
                      {["draft", "published", "archived"].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </Field>
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" variant="gold" disabled={productSaving || imageUploading}>
                      {productSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {editingProductId ? "Save product" : "Create product"}
                    </Button>
                    {editingProductId ? <Button type="button" variant="outline" onClick={resetProduct}>Cancel</Button> : null}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-extrabold text-primary">Catalogue ({products.length})</h2>
                  <label className="relative">
                    <span className="sr-only">Search products by name, brand, category or SKU</span>
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search catalogue" />
                  </label>
                </div>
                <div className="mt-5 grid gap-3">
                  {filteredProducts.map((product) => (
                    <article key={product.id} className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-bold text-primary">{product.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[product.brand?.name, product.category?.name, product.sku].filter(Boolean).join(" · ") || "No brand/category/SKU"}
                        </p>
                        <span className="mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-semibold capitalize">{product.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => editProduct(product)}>Edit</Button>
                        <select aria-label={`${product.name} status`} value={product.status} onChange={(event) => changeProductStatus(product, event.target.value as Status)} className="h-9 rounded-md border bg-background px-2 text-sm">
                          {["draft", "published", "archived"].map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                        <Button type="button" size="icon" variant="outline" aria-label={`Delete ${product.name}`} onClick={() => deleteProduct(product)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </article>
                  ))}
                  {!filteredProducts.length ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No products found. Create a verified product or adjust the search.</p> : null}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeTab === "brands" ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <TaxonomyForm
              title={editingBrandId ? "Edit brand" : "Create brand"}
              name={taxonomyName}
              status={taxonomyStatus}
              logo={taxonomyLogo}
              error={taxonomyError}
              busy={taxonomyBusy}
              onName={setTaxonomyName}
              onStatus={setTaxonomyStatus}
              onLogo={setTaxonomyLogo}
              onLogoUpload={uploadBrandLogo}
              onSubmit={(event) => submitTaxonomy(event, "brands")}
              onCancel={() => { setEditingBrandId(""); setTaxonomyName(""); setTaxonomyLogo(""); }}
            />
            <TaxonomyForm
              title={editingCategoryId ? "Edit category" : "Create category"}
              name={taxonomyName}
              status={taxonomyStatus}
              parentId={categoryParent}
              categories={categories}
              error={taxonomyError}
              busy={taxonomyBusy}
              onName={setTaxonomyName}
              onStatus={setTaxonomyStatus}
              onParent={setCategoryParent}
              onSubmit={(event) => submitTaxonomy(event, "categories")}
              onCancel={() => { setEditingCategoryId(""); setTaxonomyName(""); setCategoryParent(""); }}
            />
            <TaxonomyList title="Brands" items={brands} onEdit={(item) => editTaxonomy(item, "brands")} onDelete={(item) => deleteTaxonomy(item, "brands")} />
            <TaxonomyList title="Categories" items={categories} onEdit={(item) => editTaxonomy(item, "categories")} onDelete={(item) => deleteTaxonomy(item, "categories")} />
          </div>
        ) : null}

        {activeTab === "enquiries" ? (
          <div className="mt-6">
            <div className="flex flex-wrap gap-3">
              <Input value={enquirySearch} onChange={(event) => setEnquirySearch(event.target.value)} placeholder="Search reference, buyer or phone" className="max-w-sm" />
              <select value={enquiryStatus} onChange={(event) => setEnquiryStatus(event.target.value)} className="h-11 rounded-md border bg-background px-3 text-sm">
                <option>All</option>{enquiryStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
              <Button variant="outline" onClick={filterEnquiries}>Apply filters</Button>
            </div>
            <div className="mt-5 grid gap-4">
              {enquiries.map((enquiry) => (
                <Card key={enquiry.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-primary">{enquiry.reference} · {enquiry.business_name}</p>
                        <p className="mt-1 text-sm">{enquiry.contact_person} · <a className="underline" href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>{enquiry.email ? ` · ${enquiry.email}` : ""}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{enquiry.city}, {enquiry.state} {enquiry.pin_code}{enquiry.gstin ? ` · GSTIN ${enquiry.gstin}` : ""}</p>
                      </div>
                      <select aria-label={`Status for ${enquiry.reference}`} value={enquiry.status} onChange={(event) => updateEnquiry(enquiry, { status: event.target.value as AdminEnquiry["status"] })} className="h-10 rounded-md border bg-background px-3 text-sm">
                        {enquiryStatuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </div>
                    <ul className="mt-4 grid gap-2">
                      {enquiry.items.map((item, index) => (
                        <li key={`${item.product_name}-${index}`} className="rounded-md bg-secondary/50 p-3 text-sm">
                          {item.product_name}{item.variant_name ? ` — ${item.variant_name}` : ""}: <strong>{item.quantity}{item.unit ? ` ${item.unit}` : ""}</strong>{item.packaging ? ` (${item.packaging})` : ""}
                        </li>
                      ))}
                    </ul>
                    {enquiry.delivery_requirements ? <p className="mt-3 text-sm"><strong>Delivery:</strong> {enquiry.delivery_requirements}</p> : null}
                    {enquiry.message ? <p className="mt-2 text-sm"><strong>Buyer note:</strong> {enquiry.message}</p> : null}
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Textarea aria-label={`Internal notes for ${enquiry.reference}`} value={notes[enquiry.id] ?? enquiry.internal_notes ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [enquiry.id]: event.target.value }))} placeholder="Internal notes (visible only to admins)" maxLength={5000} />
                      <Button variant="outline" onClick={() => updateEnquiry(enquiry, { internal_notes: notes[enquiry.id] ?? enquiry.internal_notes ?? "" })}><Save className="h-4 w-4" /> Save notes</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!enquiries.length ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No matching enquiries.</p> : null}
            </div>
          </div>
        ) : null}

        {activeTab === "legacy-orders" ? (
          <div className="mt-6">
            <div className="flex flex-wrap gap-3">
              <Input aria-label="Search historical orders" value={legacyOrderSearch} onChange={(event) => setLegacyOrderSearch(event.target.value)} placeholder="Search customer, phone, product or city" className="max-w-sm" />
              <select aria-label="Filter historical orders by status" value={legacyOrderStatus} onChange={(event) => setLegacyOrderStatus(event.target.value)} className="h-11 rounded-md border bg-background px-3 text-sm">
                {["All", "New", "Contacted", "Confirmed", "Delivered", "Cancelled"].map((status) => <option key={status}>{status}</option>)}
              </select>
              <Button variant="gold" onClick={() => loadLegacyOrders(0)} disabled={legacyOrdersLoading}>
                {legacyOrdersLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search history
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Historical orders remain read-only. New requests should be submitted as quotations.</p>
            <div className="mt-4 grid gap-3">
              {legacyOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h2 className="font-bold text-primary">{order.customer_name} · {order.product_name}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{order.phone} · {order.city} · {new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <span className="h-fit rounded-full border px-3 py-1 text-xs font-semibold">{order.status}</span>
                    </div>
                    <p className="mt-3 text-sm">Quantity: {order.quantity} · Payment method: {order.payment_method}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{order.address}</p>
                    {order.message ? <p className="mt-2 text-sm">{order.message}</p> : null}
                  </CardContent>
                </Card>
              ))}
              {!legacyOrders.length && !legacyOrdersLoading ? <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No historical orders found.</p> : null}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button variant="outline" onClick={() => loadLegacyOrders(legacyOrderPage - 1)} disabled={legacyOrderPage === 0 || legacyOrdersLoading}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {legacyOrderPage + 1}</span>
              <Button variant="outline" onClick={() => loadLegacyOrders(legacyOrderPage + 1)} disabled={!legacyOrdersHaveMore || legacyOrdersLoading}>Next</Button>
            </div>
          </div>
        ) : null}

        {activeTab === "import" ? (
          <Card className="mt-6">
            <CardContent className="p-5">
              <h2 className="text-xl font-extrabold text-primary">Import and export catalogue</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Download the CSV/XLSX template, create any brands/categories first, then preview the import. Duplicate SKUs, unknown brands/categories and invalid rows are reported without writing them. Import does not overwrite existing products.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <DownloadLink href="/api/admin/products/template?format=csv" label="CSV template" />
                <DownloadLink href="/api/admin/products/template?format=xlsx" label="Excel template" />
                <DownloadLink href="/api/admin/products/export?format=csv" label="Export CSV" />
                <DownloadLink href="/api/admin/products/export?format=xlsx" label="Export Excel" />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-secondary px-4 py-2 text-sm font-semibold">
                  {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Preview CSV / XLSX
                  <input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={previewImport} className="sr-only" disabled={importLoading} />
                </label>
              </div>
              {importError ? <p role="status" className="mt-4 rounded-md bg-secondary p-3 text-sm">{importError}</p> : null}
              {importPreview ? (
                <div className="mt-6">
                  <p className="font-semibold">Preview: {importPreview.totalRows} rows · {importPreview.validRows.length} valid · {importPreview.invalidRows.length} with errors</p>
                  {importPreview.invalidRows.length ? (
                    <ul className="mt-3 grid gap-2 text-sm text-red-800">
                      {importPreview.invalidRows.map((row) => <li key={row.row} className="rounded-md bg-red-50 p-3">Row {row.row}: {row.errors.join(" ")}</li>)}
                    </ul>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button variant="gold" onClick={commitImport} disabled={importLoading || !importPreview.validRows.length}>
                      {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                      Import {importPreview.validRows.length} valid rows
                    </Button>
                    <Button variant="outline" onClick={() => setImportPreview(null)} disabled={importLoading}>Cancel</Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "settings" ? (
          <Card className="mt-6">
            <CardContent className="p-5">
              <h2 className="text-xl font-extrabold text-primary">Public business information</h2>
              <p className="mt-2 text-sm text-muted-foreground">Only enter details verified by the business. These values are public on the site; secrets and API keys are never stored here.</p>
              {settingsError ? <p role="status" className="mt-4 rounded-md bg-secondary p-3 text-sm">{settingsError}</p> : null}
              <form onSubmit={saveBusinessSettings} className="mt-5 grid gap-4 md:grid-cols-2">
                {([
                  ["contact_phone", "Phone number"],
                  ["whatsapp_number", "WhatsApp number"],
                  ["contact_email", "Public email"],
                  ["business_address", "Business address"],
                  ["business_hours", "Business hours"],
                  ["delivery_coverage", "Delivery coverage"]
                ] as const).map(([key, label]) => (
                  <Field key={key} label={label}>
                    <Input value={businessSettings[key]} onChange={(event) => setBusinessSettings((current) => ({ ...current, [key]: event.target.value }))} />
                  </Field>
                ))}
                <Button type="submit" variant="gold" className="w-fit"><Save className="h-4 w-4" /> Save public settings</Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
        {activeTab === "diagnostics" ? (
          <Card className="mt-6 rounded-3xl border border-border bg-card shadow-sm">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-xl font-extrabold text-foreground">
                Storefront Setup & Supabase Diagnostics
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Check database connectivity, required environment variables, and migration status. This diagnostic interface is kept strictly internal to the administrator.
              </p>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary dark:text-accent">
                    Required Environment Variables
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ensure these are defined in your local <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px]">.env</code> and in Vercel Project Settings:
                  </p>
                  <ul className="mt-4 space-y-2 text-xs font-mono">
                    <li className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5">
                      <span>NEXT_PUBLIC_SUPABASE_URL</span>
                      <span className="rounded bg-fresh/15 px-2 py-0.5 text-[10px] font-sans font-bold text-fresh">Required</span>
                    </li>
                    <li className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5">
                      <span>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                      <span className="rounded bg-fresh/15 px-2 py-0.5 text-[10px] font-sans font-bold text-fresh">Required</span>
                    </li>
                    <li className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5">
                      <span>SUPABASE_SERVICE_ROLE_KEY</span>
                      <span className="rounded bg-fresh/15 px-2 py-0.5 text-[10px] font-sans font-bold text-fresh">Server-only</span>
                    </li>
                    <li className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5">
                      <span>ADMIN_PASSWORD</span>
                      <span className="rounded bg-fresh/15 px-2 py-0.5 text-[10px] font-sans font-bold text-fresh">Configured</span>
                    </li>
                    <li className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5">
                      <span>ADMIN_SESSION_SECRET</span>
                      <span className="rounded bg-fresh/15 px-2 py-0.5 text-[10px] font-sans font-bold text-fresh">Configured</span>
                    </li>
                    <li className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5">
                      <span>NEXT_PUBLIC_WHATSAPP_NUMBER</span>
                      <span className="rounded bg-fresh/15 px-2 py-0.5 text-[10px] font-sans font-bold text-fresh">Configured</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border bg-background p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary dark:text-accent">
                    Database Schema & Migrations
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    To activate full wholesale features, execute these files in your Supabase SQL Editor:
                  </p>

                  <div className="mt-4 space-y-3 text-xs">
                    <div className="rounded-xl border border-border bg-card p-3.5">
                      <p className="font-bold text-foreground">1. Base Tables</p>
                      <p className="mt-1 text-muted-foreground">
                        File: <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px]">supabase/run-this-in-sql-editor.sql</code>
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Creates base <code className="font-mono">products</code> and legacy <code className="font-mono">orders</code> tables.
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-3.5">
                      <p className="font-bold text-foreground">2. Wholesale Platform Migration</p>
                      <p className="mt-1 text-muted-foreground">
                        File: <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px]">supabase/migrations/20261015154037_wholesale_platform.sql</code>
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Creates <code className="font-mono">brands</code>, <code className="font-mono">categories</code>, <code className="font-mono">enquiries</code>, <code className="font-mono">product_variants</code>, <code className="font-mono">product_price_tiers</code>, and <code className="font-mono">business_settings</code> with RLS policies and procedures.
                      </p>
                    </div>

                    <div className="rounded-xl border border-fresh/30 bg-fresh/10 p-3.5 text-fresh">
                      <p className="font-bold">Public Storefront Integrity</p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-3.5">
                      <p className="font-bold text-foreground">3. Active Supabase Project Reference</p>
                      <p className="mt-1 text-muted-foreground font-mono text-[11px]">
                        Project ID: <span className="font-bold text-primary dark:text-accent">qclojxiuynbuwtaaiozm</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Auto-healed by client resolver if environment variable contains trailing quotes or whitespace.
                      </p>
                    </div>

                    <div className="rounded-xl border border-fresh/30 bg-fresh/10 p-3.5 text-fresh">
                      <p className="font-bold">Operational Readiness</p>
                      <p className="mt-0.5 text-[11px] text-foreground/80">
                        Public visitors see a clean, professional FMCG storefront without internal database errors or setup banners.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-semibold">{label}{children}</label>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border bg-card px-5 py-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-extrabold text-primary">{value}</p></div>;
}

function DownloadLink({ href, label }: { href: string; label: string }) {
  return <Button asChild variant="outline"><a href={href}><Download className="h-4 w-4" />{label}</a></Button>;
}

function TaxonomyForm({
  title, name, status, logo, parentId, categories = [], error, busy, onName, onStatus, onLogo, onLogoUpload, onParent, onSubmit, onCancel
}: {
  title: string;
  name: string;
  status: Status;
  logo?: string;
  parentId?: string;
  categories?: Taxonomy[];
  error: string;
  busy: boolean;
  onName: (value: string) => void;
  onStatus: (value: Status) => void;
  onLogo?: (value: string) => void;
  onLogoUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onParent?: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <Card><CardContent className="p-5">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      {error ? <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
      <form onSubmit={onSubmit} className="mt-4 grid gap-4">
        <Field label="Name"><Input required value={name} onChange={(event) => onName(event.target.value)} /></Field>
        {onLogo ? (
          <>
            <Field label="Logo image URL"><Input value={logo || ""} onChange={(event) => onLogo(event.target.value)} /></Field>
            {onLogoUpload ? <Field label="Upload logo"><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={onLogoUpload} /></Field> : null}
          </>
        ) : null}
        {onParent ? (
          <Field label="Parent category">
            <select value={parentId || ""} onChange={(event) => onParent(event.target.value)} className="h-11 rounded-md border bg-background px-3 text-sm">
              <option value="">No parent</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </Field>
        ) : null}
        <Field label="Status">
          <select value={status} onChange={(event) => onStatus(event.target.value as Status)} className="h-11 rounded-md border bg-background px-3 text-sm">
            {["draft", "published", "archived"].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </Field>
        <div className="flex gap-2"><Button type="submit" variant="gold" disabled={busy}><Save className="h-4 w-4" /> Save</Button><Button type="button" variant="outline" onClick={onCancel}>Clear</Button></div>
      </form>
    </CardContent></Card>
  );
}

function TaxonomyList({ title, items, onEdit, onDelete }: {
  title: string;
  items: Taxonomy[];
  onEdit: (item: Taxonomy) => void;
  onDelete: (item: Taxonomy) => void;
}) {
  return (
    <Card><CardContent className="p-5">
      <h2 className="text-xl font-bold text-primary">{title} ({items.length})</h2>
      <ul className="mt-4 grid gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
            <span className="min-w-0"><strong className="block truncate">{item.name}</strong><small className="text-muted-foreground">{item.status}</small></span>
            <span className="flex gap-2"><Button variant="outline" size="sm" onClick={() => onEdit(item)}>Edit</Button><Button variant="outline" size="icon" aria-label={`Delete ${item.name}`} onClick={() => onDelete(item)}><Trash2 className="h-4 w-4" /></Button></span>
          </li>
        ))}
        {!items.length ? <li className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">No records yet.</li> : null}
      </ul>
    </CardContent></Card>
  );
}
