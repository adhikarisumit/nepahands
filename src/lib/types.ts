
export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  sku: string | null;
  category_id: string | null;
  images: string[];
  artisan: string | null;
  material: string | null;
  origin: string | null;
  featured: boolean;
  active: boolean;
  created_at: string;
  categories?: Pick<Category, "name" | "slug"> | null;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  author_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

export type ShippingAddress = {
  full_name: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
};

export type Order = {
  id: string;
  order_number: number;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  payment_provider: PaymentProvider | null;
  payment_id: string | null;
  payment_reference?: string | null;
  payment_proof_path?: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  coupon_code: string | null;
  shipping_address: ShippingAddress;
  tracking_number: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
};

export type Coupon = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  is_public: boolean;
  description: string | null;
  created_at: string;
};

export type StoreSettings = {
  id: number;
  store_name: string;
  shipping_flat: number;
  /** Products priced above this pay the shipping charge; at or below it they ship free. 0 = always charge. */
  free_shipping_threshold: number;
  tax_rate: number;
  announcement: string | null;
  contact_email: string | null;
  stripe_enabled?: boolean;
  paddle_enabled?: boolean;
  bank_enabled?: boolean;
  bank_details?: BankDetails | null;
  bank_qr_url?: string | null;
  branding?: unknown; // legacy column — branding is now hard-coded in lib/branding.ts
};

export type PaymentProvider = "stripe" | "paddle" | "bank_transfer";

export const PROVIDER_LABEL: Record<PaymentProvider, string> = {
  stripe: "Card (Stripe)",
  paddle: "Paddle",
  bank_transfer: "Bank transfer",
};

export type BankDetails = {
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  branch?: string;
  swift?: string;
  instructions?: string;
};

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  stock: number;
};
