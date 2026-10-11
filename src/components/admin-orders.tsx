"use client";

import { useMemo, useState } from "react";
import { Download, Edit3, Loader2, Lock, PackagePlus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Order, OrderStatus } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { orderStatuses } from "@/lib/validation";

type FilterStatus = OrderStatus | "All";

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  price: string;
  moq: string;
  quality: string;
  packing: string;
  image_url: string | null;
  active: boolean;
  created_at: string;
};

type ProductForm = {
  name: string;
  price: string;
  moq: string;
  quality: string;
  packing: string;
  imageUrl: string;
  active: boolean;
};

const emptyProduct: ProductForm = {
  name: "",
  price: "Contact for rate",
  moq: "",
  quality: "",
  packing: "",
  imageUrl: "",
  active: true
};

export function AdminOrders() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [status, setStatus] = useState<FilterStatus>("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [error, setError] = useState("");
  const [productError, setProductError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);

  async function fetchOrders(nextStatus = status, nextSearch = search) {
    const params = new URLSearchParams();
    params.set("status", nextStatus);
    if (nextSearch) params.set("search", nextSearch);

    const response = await fetch(`/api/orders?${params.toString()}`, {
      headers: { "x-admin-password": password }
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load orders.");
    }

    setOrders(data.orders);
    if (data.warning) setError(data.warning);
  }

  async function fetchProducts() {
    const response = await fetch("/api/products", {
      headers: { "x-admin-password": password }
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load products.");
    }

    setProducts(data.products);
    if (data.warning) setProductError(data.warning);
  }

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await Promise.all([fetchOrders("All", ""), fetchProducts()]);
      setAuthorized(true);
    } catch (error) {
      setAuthorized(false);
      setError(error instanceof Error ? error.message : "Unable to open admin panel.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, nextStatus: OrderStatus) {
    const previous = orders;
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, status: nextStatus } : order)));

    const response = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password
      },
      body: JSON.stringify({ status: nextStatus })
    });

    if (!response.ok) {
      setOrders(previous);
      const data = await response.json();
      setError(data.error || "Unable to update status.");
    }
  }

  async function applyFilters() {
    setLoading(true);
    setError("");

    try {
      await fetchOrders(status, search);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  function updateProductField(name: keyof ProductForm, value: string | boolean) {
    setProductForm((current) => ({ ...current, [name]: value }));
    setProductError("");
  }

  function startEdit(product: AdminProduct) {
    setEditingId(product.id);
    setProductForm({
      name: product.name,
      price: product.price,
      moq: product.moq,
      quality: product.quality,
      packing: product.packing,
      imageUrl: product.image_url || "",
      active: product.active
    });
  }

  function resetProductForm() {
    setEditingId("");
    setProductForm(emptyProduct);
    setProductError("");
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProductLoading(true);
    setProductError("");

    const url = editingId ? `/api/products/${editingId}` : "/api/products";
    const method = editingId ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password
      },
      body: JSON.stringify(productForm)
    });
    const data = await response.json();
    setProductLoading(false);

    if (!response.ok) {
      setProductError(data.error || "Unable to save product.");
      return;
    }

    await fetchProducts();
    resetProductForm();
  }

  async function toggleProduct(product: AdminProduct) {
    setProductError("");
    const previous = products;
    setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, active: !item.active } : item)));

    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password
      },
      body: JSON.stringify({ active: !product.active })
    });

    if (!response.ok) {
      setProducts(previous);
      const data = await response.json();
      setProductError(data.error || "Unable to update product availability.");
    }
  }

  async function deleteProduct(product: AdminProduct) {
    const ok = window.confirm(`Remove ${product.name} from the product list?`);
    if (!ok) return;

    setProductError("");
    const previous = products;
    setProducts((current) => current.filter((item) => item.id !== product.id));

    const response = await fetch(`/api/products/${product.id}`, {
      method: "DELETE",
      headers: { "x-admin-password": password }
    });

    if (!response.ok) {
      setProducts(previous);
      const data = await response.json();
      setProductError(data.error || "Unable to delete product.");
    }
  }

  const csv = useMemo(() => {
    const headers = ["Customer Name", "Phone", "WhatsApp", "Product", "Quantity", "City", "Payment", "Status", "Date"];
    const rows = orders.map((order) => [
      order.customer_name,
      order.phone,
      order.whatsapp,
      order.product_name,
      order.quantity,
      order.city,
      order.payment_method,
      order.status,
      formatDate(order.created_at)
    ]);
    return [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  }, [orders]);

  function exportCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `the-bulk-supplier-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!authorized) {
    return (
      <section className="py-14">
        <div className="container-page max-w-lg">
          <Card className="premium-shadow">
            <CardContent className="p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-accent">
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-3xl font-extrabold text-primary">Admin Panel</h1>
              <p className="mt-3 text-muted-foreground">Enter the admin password to manage products and order leads.</p>
              <form onSubmit={login} className="mt-6 grid gap-4">
                {error ? <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
                <div className="grid gap-2">
                  <Label>Admin password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="ADMIN_PASSWORD"
                  />
                </div>
                <Button type="submit" variant="gold" disabled={loading || !password}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Open Admin
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10">
      <div className="container-page">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">Admin</p>
            <h1 className="mt-2 text-3xl font-extrabold text-primary">Dashboard</h1>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <Stat label="Products" value={products.length} />
            <Stat label="Available" value={products.filter((product) => product.active).length} />
            <Stat label="Orders" value={orders.length} />
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardContent className="p-5">
              <h2 className="text-xl font-extrabold text-primary">{editingId ? "Edit Product" : "Add Product"}</h2>
              {productError ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{productError}</p> : null}
              <form onSubmit={saveProduct} className="mt-5 grid gap-4">
                <ProductField label="Product name">
                  <Input value={productForm.name} onChange={(event) => updateProductField("name", event.target.value)} />
                </ProductField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProductField label="Price">
                    <Input value={productForm.price} onChange={(event) => updateProductField("price", event.target.value)} />
                  </ProductField>
                  <ProductField label="MOQ">
                    <Input value={productForm.moq} onChange={(event) => updateProductField("moq", event.target.value)} />
                  </ProductField>
                </div>
                <ProductField label="Quality / category">
                  <Input value={productForm.quality} onChange={(event) => updateProductField("quality", event.target.value)} />
                </ProductField>
                <ProductField label="Packing">
                  <Input value={productForm.packing} onChange={(event) => updateProductField("packing", event.target.value)} />
                </ProductField>
                <ProductField label="Image URL">
                  <Input value={productForm.imageUrl} onChange={(event) => updateProductField("imageUrl", event.target.value)} placeholder="Optional" />
                </ProductField>
                <label className="flex items-center gap-3 rounded-md border bg-secondary/60 p-3 text-sm font-semibold text-primary">
                  <input
                    type="checkbox"
                    checked={productForm.active}
                    onChange={(event) => updateProductField("active", event.target.checked)}
                    className="h-4 w-4"
                  />
                  Available product
                </label>
                <div className="flex gap-3">
                  <Button type="submit" variant="gold" disabled={productLoading}>
                    {productLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
                    {editingId ? "Update Product" : "Add Product"}
                  </Button>
                  {editingId ? (
                    <Button type="button" variant="outline" onClick={resetProductForm}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-xl font-extrabold text-primary">All Products</h2>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-secondary text-primary">
                    <tr>
                      <th className="px-3 py-3 font-bold">Product</th>
                      <th className="px-3 py-3 font-bold">Price</th>
                      <th className="px-3 py-3 font-bold">MOQ</th>
                      <th className="px-3 py-3 font-bold">Available</th>
                      <th className="px-3 py-3 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-t">
                        <td className="px-3 py-3">
                          <p className="font-semibold text-primary">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.quality}</p>
                        </td>
                        <td className="px-3 py-3">{product.price}</td>
                        <td className="px-3 py-3">{product.moq}</td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => toggleProduct(product)}
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              product.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.active ? "Available" : "Hidden"}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => startEdit(product)}>
                              <Edit3 className="h-4 w-4" /> Edit
                            </Button>
                            <Button type="button" size="sm" variant="destructive" onClick={() => deleteProduct(product)}>
                              <Trash2 className="h-4 w-4" /> Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent">Orders</p>
            <h2 className="mt-2 text-2xl font-extrabold text-primary">All Order Leads</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search orders" />
            </div>
            <Select value={status} onValueChange={(value) => setStatus(value as FilterStatus)}>
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All statuses</SelectItem>
                {orderStatuses.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={applyFilters} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Apply
            </Button>
            <Button variant="outline" onClick={exportCsv} disabled={!orders.length}>
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        </div>

        {error ? <p className="mt-6 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}

        <div className="mt-8 overflow-hidden rounded-lg border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-secondary text-primary">
                <tr>
                  <th className="px-4 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Phone</th>
                  <th className="px-4 py-3 font-bold">Product</th>
                  <th className="px-4 py-3 font-bold">Quantity</th>
                  <th className="px-4 py-3 font-bold">City</th>
                  <th className="px-4 py-3 font-bold">Payment</th>
                  <th className="px-4 py-3 font-bold">Date</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length ? (
                  orders.map((order) => (
                    <tr key={order.id} className="border-t">
                      <td className="px-4 py-4 font-semibold">{order.customer_name}</td>
                      <td className="px-4 py-4">{order.phone}</td>
                      <td className="px-4 py-4">{order.product_name}</td>
                      <td className="px-4 py-4">{order.quantity}</td>
                      <td className="px-4 py-4">{order.city}</td>
                      <td className="px-4 py-4">{order.payment_method}</td>
                      <td className="px-4 py-4">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-4">
                        <Select value={order.status} onValueChange={(value) => updateStatus(order.id, value as OrderStatus)}>
                          <SelectTrigger className="h-9 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {orderStatuses.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      No orders found. New wholesale enquiries will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-white px-5 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-primary">{value}</p>
    </div>
  );
}
