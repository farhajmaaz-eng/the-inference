import { Header, Footer } from "@/components/chrome";
export const dynamic = "force-dynamic";
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="site-shell">
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
