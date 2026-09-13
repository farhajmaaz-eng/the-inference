import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login";
import { brand } from "@/lib/brand";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main id="main" className="login-panel">
      <Link href="/" className="footer-brand">
        {brand.name}.
      </Link>
      <h1>The newsroom</h1>
      <p>
        Editorial access only. Sign in with your approved administrator account.
      </p>
      {error && (
        <p className="notice error-notice" role="alert">
          {error === "configuration"
            ? "Supabase configuration is missing. Check the server environment."
            : "Your account has not been granted newsroom access."}
        </p>
      )}
      <LoginForm />
      <Link className="text-link" href="/">
        <ArrowLeft size={14} aria-hidden="true" /> Return to the public edition
      </Link>
    </main>
  );
}
