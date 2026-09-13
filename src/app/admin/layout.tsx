import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "Newsroom", template: "%s | Newsroom" },
  robots: { index: false, follow: false, noarchive: true },
};
export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="admin-shell">{children}</div>;
}
