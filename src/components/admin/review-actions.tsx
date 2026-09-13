"use client";
import { useActionState } from "react";
import { reviewAction } from "@/app/admin/actions";
export function ReviewActions({
  id,
  canPublish,
}: {
  id: string;
  canPublish: boolean;
}) {
  const [state, action, pending] = useActionState(reviewAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <div className="queue-actions">
        {canPublish && (
          <button
            className="button"
            name="decision"
            value="publish"
            disabled={pending}
          >
            Publish
          </button>
        )}
        <button
          className="button secondary"
          name="decision"
          value="reject"
          disabled={pending}
        >
          Reject
        </button>
        <button
          className="button secondary"
          name="decision"
          value="archive"
          disabled={pending}
        >
          Archive
        </button>
      </div>
      {state.error && (
        <p className="notice error-notice" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="notice" role="status">
          {state.success}
        </p>
      )}
    </form>
  );
}
