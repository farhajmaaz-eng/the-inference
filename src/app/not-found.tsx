import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="empty-state">
      <h1>That page isn’t in the record.</h1>
      <p style={{ marginTop: 18 }}>
        The address may have changed, or this report is not publicly available.
      </p>
      <Link href="/" className="button" style={{ marginTop: 24 }}>
        Return to the front page
      </Link>
    </main>
  );
}
