export type Platform =
  | "amazon"
  | "amazon_seller"
  | "ebay"
  | "rakuten"
  | "clickbank"
  | "hotmart"
  | "gumroad"
  | "payhip"
  | "warriorplus"
  | "systeme"
  | "digistore"
  | "jvzoo"
  | "cj"
  | "shareasale"
  | "impact"
  | "awin"
  | "spocket"
  | "cjdrop"
  | "walmart"
  | "temu"
  | "shein"
  | "flexoffers"
  | "partnerstack"
  | "fiverr"
  | "semrush"
  | "hubspot"
  | "booking"
  | "agoda"
  | "coinbase"
  | "binance"
  | "aliexpress"
  | "teachable"
  | "shopify"
  | "etsy";
export type AiProvider = "openai" | "anthropic" | "groq" | "mistral" | "ollama";
export type ImageProvider = "openai" | "custom";
export type AutomationId = "auto_discover" | "auto_prices" | "auto_content" | "auto_seo" | "auto_new_releases" | "auto_commissions" | "auto_master_agent";

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  store_name: string | null;
  store_slug: string | null;
  preferred_language: "es" | "en";
  currency: string;
  plan: "free" | "pro" | "enterprise";
  ai_provider: AiProvider | null;
  ai_model: string | null;
  ai_api_key: string | null;
  ollama_base_url: string | null;
  image_provider: ImageProvider | null;
  image_model: string | null;
  image_api_key: string | null;
  image_base_url: string | null;
  automation_enabled: boolean;
}

export interface PlatformAccount {
  id: string;
  user_id: string;
  platform: Platform;
  credentials: Record<string, string>;
  connected: boolean;
  last_test_status: "success" | "error" | null;
  last_test_message: string | null;
}

export interface PlatformSetupProgress {
  id: string;
  setup_key: string;
  user_id: string | null;
  platform: Platform;
  completed: boolean;
  notes: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface AutomationSetting {
  id: string;
  setup_key: string;
  user_id: string | null;
  automation_id: AutomationId;
  enabled: boolean;
  schedule_cron: string;
  updated_at: string;
}

export interface Niche {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  avg_commission_rate: number | null;
  competition_level: "low" | "medium" | "high" | null;
  monthly_searches: number | null;
  trend: "rising" | "stable" | "declining" | null;
  platforms: Platform[];
  min_price: number | null;
  max_price: number | null;
  auto_discover: boolean;
  is_active: boolean;
}

export interface AffiliateProduct {
  id: string;
  user_id: string;
  niche_id: string | null;
  platform: Platform;
  external_id: string;
  title: string;
  description: string | null;
  ai_title: string | null;
  ai_description: string | null;
  ai_review: string | null;
  pros: string[] | null;
  cons: string[] | null;
  price: number | null;
  original_price: number | null;
  commission_rate: number | null;
  commission_amount: number | null;
  currency: string;
  image_url: string | null;
  images: string[];
  image_source: "supplier" | "ai" | "manual" | null;
  image_prompt: string | null;
  image_generated_at: string | null;
  affiliate_url: string;
  tracking_url: string | null;
  slug: string;
  rating: number | null;
  review_count: number | null;
  category: string | null;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  auto_published: boolean;
}

export interface DashboardStats {
  totalCommissionsMonth: number;
  totalCommissionsPending: number;
  totalClicks30d: number;
  conversionRate: number;
  activeProducts: number;
  revenueChart: Array<{ date: string; value: number }>;
  clicksChart: Array<{ date: string; value: number }>;
  topProducts: Array<{ title: string; platform: Platform; clicks: number; commission: number; slug: string }>;
  recentActivity: Array<{ title: string; detail: string; created_at: string; type: string }>;
}

export interface AffiliatePartnerPublic {
  id: string;
  email: string;
  full_name: string;
  brand_name: string;
  store_slug: string;
  website_url: string | null;
  payout_email: string | null;
  custom_domain?: string | null;
  domain_status?: "not_configured" | "pending_dns" | "connected";
  domain_notes?: string | null;
  promotion_goal_clicks?: number | null;
  promotion_goal_sales?: number | null;
  promotion_goal_revenue?: number | null;
  account_close_requested_at?: string | null;
  affiliate_commission_rate: number;
  owner_commission_rate: number;
  status: "active" | "paused" | "blocked";
  created_at: string;
}

export interface AffiliatePartnerProduct {
  id: string;
  partner_id: string;
  source_product_id: string | null;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  image_url: string | null;
  affiliate_url: string;
  slug: string;
  category: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_active: boolean;
  total_clicks: number;
  created_at: string;
}

export interface AffiliatePartnerCommission {
  id: string;
  partner_id: string;
  product_id: string | null;
  order_id: string | null;
  gross_sale_amount: number | null;
  total_commission_amount: number;
  affiliate_commission_amount: number;
  owner_commission_amount: number;
  status: "pending" | "approved" | "paid" | "rejected";
  earned_at: string;
}

export interface AffiliatePartnerPromotion {
  id: string;
  partner_id: string;
  source_product_id: string;
  total_clicks: number;
  created_at: string;
  updated_at: string;
}

export interface AffiliatePartnerPromotionClick {
  id: string;
  partner_id: string;
  promotion_id: string | null;
  source_product_id: string;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  clicked_at: string;
}

export interface ExternalProduct {
  platform: Platform;
  external_id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  image_url?: string;
  affiliate_url: string;
  rating?: number;
  review_count?: number;
  category?: string;
  commission_rate?: number;
  gravity?: number;
}
