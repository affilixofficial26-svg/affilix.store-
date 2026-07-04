import { redirect } from "next/navigation";

export default function LegacyProvidersPage() {
  redirect("/dashboard/integrations");
}
