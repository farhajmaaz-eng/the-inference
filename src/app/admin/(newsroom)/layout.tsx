import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";
import { ThemeToggle } from "@/components/theme";
import { brand } from "@/lib/brand";
export default async function NewsroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <>
      <header className="admin-header">
        <Link href="/admin" className="footer-brand">
          {brand.name}.
        </Link>
        <span className="status">Private newsroom</span>
        <nav aria-label="Newsroom">
          <Link href="/admin">Stories</Link>
          <Link href="/admin/review">AI review</Link>
          <Link href="/admin/entities">Entities</Link>
          <Link href="/admin/briefings">Briefings</Link>
          <Link href="/admin/events">Timelines</Link>
          <Link href="/admin/audit">Audit</Link>
          <Link href="/admin/account">Account</Link>
          <Link href="/">Public site <ArrowUpRight size={14} aria-hidden="true" /></Link>
        </nav>
        <ThemeToggle />
        <form action={logoutAction}>
          <button>Sign out</button>
        </form>
      </header>
      <main id="main">{children}</main>
    </>
  );
}
