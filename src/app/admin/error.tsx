"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="empty-state">
      <h2>The newsroom record could not load.</h2>
      <p>
        Your saved work is still in the database. Retry the request or return to
        the story desk.
      </p>
      <button className="button" style={{ marginTop: 20 }} onClick={reset}>
        Retry
      </button>
    </main>
  );
}
