import { OrdersManagerView } from "@/components/admin/OrdersManagerView";

export const metadata = {
  title: "Orders Pipeline | NOIR & GOLD Portal",
  description: "Manage Nationwide COD Orders and Dispatch Lifecycles",
};

export default function AdminOrdersPage() {
  return <OrdersManagerView />;
}
