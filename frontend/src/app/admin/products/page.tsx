import { ProductsManagerView } from "@/components/admin/ProductsManagerView";

export const metadata = {
  title: "Garment Catalog | NOIR & GOLD Portal",
  description: "Manage Atelier Couture Garments, Variants and Pricing",
};

export default function AdminProductsPage() {
  return <ProductsManagerView />;
}
