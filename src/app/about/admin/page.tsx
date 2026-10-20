import type { Metadata } from "next";
import { AdminOrders } from "@/components/admin-orders";

export const metadata: Metadata = {
  title: "Admin Inventory & Orders | Gayatri Store",
  description: "Admin panel for managing Gayatri Store products, inventory, and wholesale enquiries.",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminPage() {
  return <AdminOrders />;
}
