export const TOP_NICHES = [
  { name: "Hogar y cocina", slug: "hogar-y-cocina", avgCommission: 6, competition: "medium", trend: "rising", platforms: ["amazon", "cj"] },
  { name: "Mascotas", slug: "mascotas", avgCommission: 7, competition: "medium", trend: "rising", platforms: ["amazon", "cj"] },
  { name: "Fitness en casa", slug: "fitness-en-casa", avgCommission: 7, competition: "high", trend: "rising", platforms: ["amazon", "cj"] },
  { name: "Belleza y skincare", slug: "belleza-skincare", avgCommission: 12, competition: "high", trend: "rising", platforms: ["amazon", "cj"] },
  { name: "Outdoor y camping", slug: "outdoor-camping", avgCommission: 7, competition: "low", trend: "rising", platforms: ["amazon", "cj"] },
  { name: "Bebé y niños", slug: "bebe-ninos", avgCommission: 5, competition: "medium", trend: "rising", platforms: ["amazon"] },
  { name: "Smart home", slug: "smart-home", avgCommission: 4, competition: "medium", trend: "rising", platforms: ["amazon", "cj"] },
  { name: "Suplementos y salud", slug: "suplementos-salud", avgCommission: 55, competition: "high", trend: "rising", platforms: ["clickbank"] },
  { name: "Cursos online", slug: "cursos-online", avgCommission: 50, competition: "medium", trend: "rising", platforms: ["hotmart", "clickbank", "gumroad"] },
  { name: "Ebooks y guias digitales", slug: "ebooks-guias-digitales", avgCommission: 40, competition: "medium", trend: "rising", platforms: ["hotmart", "gumroad", "payhip"] },
  { name: "Plantillas y recursos IA", slug: "plantillas-recursos-ia", avgCommission: 35, competition: "medium", trend: "rising", platforms: ["gumroad", "payhip", "systeme"] },
  { name: "Marketing digital", slug: "marketing-digital", avgCommission: 50, competition: "high", trend: "rising", platforms: ["hotmart", "warriorplus", "clickbank"] },
  { name: "Software SaaS", slug: "software-saas", avgCommission: 35, competition: "medium", trend: "rising", platforms: ["cj", "clickbank", "gumroad", "warriorplus"] },
  { name: "Finanzas personales", slug: "finanzas-personales", avgCommission: 45, competition: "high", trend: "stable", platforms: ["hotmart", "cj", "clickbank"] },
  { name: "Relaciones", slug: "relaciones", avgCommission: 55, competition: "medium", trend: "stable", platforms: ["clickbank"] },
] as const;

export const PRODUCT_RULES = {
  amazon: { minPrice: 25, maxPrice: 100, minRating: 4.2, minReviews: 500, minCommission: 1.5 },
  clickbank: { minGravity: 20, bestsellerGravity: 100, minCommissionRate: 50 },
  hotmart: { minCommissionRate: 30 },
  gumroad: { minPrice: 5, minCommissionRate: 0 },
  payhip: { minPrice: 5, minCommissionRate: 0 },
  warriorplus: { minCommissionRate: 30 },
  systeme: { minPrice: 5, minCommissionRate: 0 },
};
