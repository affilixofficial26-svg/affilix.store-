import type { AffiliateProduct, AiProvider } from "@/types";

export type MarketingPlatform = "facebook" | "instagram" | "pinterest" | "twitter";

export type MarketingContent = {
  id: string;
  product_id: string;
  user_id: string | null;
  facebook_post: string | null;
  instagram_caption: string | null;
  pinterest_description: string | null;
  twitter_post: string | null;
  meta_ad_variants: Array<{ headline: string; primary_text: string; description: string }>;
  priority_score: number;
  content_status: "pending" | "generating" | "ready" | "published" | "error";
  generated_at: string | null;
  created_at: string;
};

export type SocialConfig = {
  id?: string;
  user_id: string | null;
  facebook_page_id?: string | null;
  facebook_page_token?: string | null;
  instagram_business_id?: string | null;
  instagram_token?: string | null;
  pinterest_token?: string | null;
  pinterest_board_id?: string | null;
  twitter_bearer_token?: string | null;
  twitter_api_key?: string | null;
  twitter_api_secret?: string | null;
  twitter_access_token?: string | null;
  twitter_access_secret?: string | null;
  facebook_enabled: boolean;
  instagram_enabled: boolean;
  pinterest_enabled: boolean;
  twitter_enabled: boolean;
};

export type MetaConfig = {
  id?: string;
  user_id: string | null;
  access_token?: string | null;
  ad_account_id?: string | null;
  page_id?: string | null;
  pixel_id?: string | null;
  monthly_budget: number;
  auto_distribute: boolean;
  min_priority_score: number;
};

export type MetaCampaign = {
  id: string;
  product_id: string | null;
  user_id: string | null;
  campaign_id: string;
  adset_id: string;
  ad_id: string;
  daily_budget: number | null;
  total_spent: number;
  total_clicks: number;
  total_impressions: number;
  ctr: number;
  roas: number;
  status: string;
  created_at: string;
  last_synced: string | null;
};

export type PublishLog = {
  id: string;
  product_id: string | null;
  user_id: string | null;
  platform: "facebook" | "instagram" | "pinterest" | "twitter" | "meta_ads";
  platform_post_id: string | null;
  status: "success" | "error" | "pending";
  error_message: string | null;
  published_at: string;
};

export type MarketingProduct = AffiliateProduct & {
  marketing_content?: MarketingContent | null;
};

export type UserAiConfig = {
  id?: string;
  ai_provider: AiProvider | null;
  ai_model: string | null;
  ai_api_key: string | null;
  ollama_base_url?: string | null;
};
