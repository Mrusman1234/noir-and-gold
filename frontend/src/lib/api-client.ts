import { ProductDetail, ProductSummary } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface ProductsQueryOptions {
  category?: string;
  audience?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface ProductsApiResponse {
  success: boolean;
  data: ProductSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductDetailApiResponse {
  success: boolean;
  data: ProductDetail;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  audience?: string;
  imageUrl?: string;
  productCount: number;
}

export interface CategoriesApiResponse {
  success: boolean;
  data: CategoryItem[];
}

export interface HealthApiResponse {
  status: string;
  timestamp: string;
  service: string;
  database: {
    status: string;
    provider: string;
  };
}

/**
 * Fetch products list from backend REST API
 */
export async function getProductsFromApi(
  options: ProductsQueryOptions = {}
): Promise<ProductsApiResponse | null> {
  try {
    const params = new URLSearchParams();
    if (options.category) params.append("category", options.category);
    if (options.audience) params.append("audience", options.audience);
    if (options.search) params.append("search", options.search);
    if (options.sort) params.append("sort", options.sort);
    if (options.page) params.append("page", String(options.page));
    if (options.limit) params.append("limit", String(options.limit));

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/api/products${queryString}`, {
      // In Next.js App Router, revalidate or cache control
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.warn(`Backend API /api/products responded with status ${res.status}`);
      return null;
    }

    const json = await res.json();
    return json;
  } catch (err) {
    console.warn("Backend API not reachable at", API_BASE_URL, err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Fetch single product detail by ID or Slug from backend REST API
 */
export async function getProductFromApi(
  idOrSlug: string
): Promise<ProductDetail | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/${encodeURIComponent(idOrSlug)}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      if (res.status !== 404) {
        console.warn(`Backend API /api/products/${idOrSlug} responded with status ${res.status}`);
      }
      return null;
    }

    const json: ProductDetailApiResponse = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.warn(
      `Backend API not reachable for product ${idOrSlug}:`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Fetch product categories from backend REST API
 */
export async function getCategoriesFromApi(): Promise<CategoryItem[] | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/categories`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;

    const json: CategoriesApiResponse = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.warn("Backend API categories not reachable:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Check backend API health and SQL database connection
 */
export async function checkApiHealth(): Promise<HealthApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
