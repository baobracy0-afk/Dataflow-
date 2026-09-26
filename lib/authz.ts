import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type AppRole = "SUPER_ADMIN" | "ADMIN_ENTREPRISE" | "MEMBRE";

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
}

export async function requirePermission(companyId: string, permission: string) {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");
  const { data, error } = await supabase.rpc("has_company_permission", {
    p_company_id: companyId,
    p_permission: permission,
  });
  if (error || data !== true) throw new Error("FORBIDDEN");
  return user;
}
