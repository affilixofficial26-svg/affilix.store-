import { redirect } from "next/navigation";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = encodeURIComponent(params.redirect || "/dashboard");
  redirect(`/login?redirect=${redirectTo}`);
}
