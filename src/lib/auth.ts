import "server-only";
import { redirect } from "next/navigation";
import { databaseConfigured, sessionDatabase } from "./supabase";

export async function requireAdmin() {
  if (!databaseConfigured()) redirect("/admin/login?error=configuration");
  const db = await sessionDatabase();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect("/admin/login");
  const { data: admin, error: authorizationError } = await db.rpc("is_admin");
  if (authorizationError || !admin) redirect("/admin/login?error=access");
  return { db, user };
}
