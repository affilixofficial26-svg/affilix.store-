import Stripe from "stripe";
import { requiredEnv } from "@/lib/utils";

let stripeClient: Stripe | null = null;

export function getStripe() {
  stripeClient ??= new Stripe(requiredEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2026-06-24.dahlia",
    timeout: 20_000,
    maxNetworkRetries: 2,
    appInfo: { name: "AFFILIX", version: "1.0.0" },
  });
  return stripeClient;
}
