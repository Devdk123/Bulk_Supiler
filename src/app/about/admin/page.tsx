import type { Metadata } from "next";
import { AdminOrders } from "@/components/admin-orders";

export const metadata: Metadata = {
  title: "Admin Orders",
  description: "Admin panel for managing The Bulk Supplier order leads.",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminPage() {
  return <AdminOrders />;
}
