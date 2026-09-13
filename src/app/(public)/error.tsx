"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="empty-state" role="alert">
      <h2>The newsroom is temporarily unavailable.</h2>
      <p>We couldn’t load the latest records. Please try again in a moment.</p>
      <button className="button" style={{ marginTop: 24 }} onClick={reset}>
        Try again
      </button>
    </section>
  );
}
