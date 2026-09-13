"use client";
import { useState } from "react";
import { ArrowUp, ArrowDown, X } from "lucide-react";
export function BriefOrder({
  stories,
  initial,
}: {
  stories: { id: string; headline: string; status: string }[];
  initial: string[];
}) {
  const [ids, setIds] = useState(initial);
  const [choice, setChoice] = useState("");
  const move = (index: number, delta: number) =>
    setIds((current) => {
      const next = [...current];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  return (
    <section className="form-section">
      <h2>Reading order</h2>
      <p className="field-hint">
        Only published stories are visible in public briefings. Use the arrows
        to set the reading order.
      </p>
      <ol className="timeline">
        {ids.map((id, i) => (
          <li key={id} style={{ gridTemplateColumns: "1fr auto" }}>
            <input type="hidden" name="story_ids" value={id} />
            <span>
              {i + 1}.{" "}
              {stories.find((s) => s.id === id)?.headline ||
                "Story unavailable"}
            </span>
            <div className="queue-actions">
              <button
                type="button"
                className="button secondary"
                aria-label={`Move story ${i + 1} up`}
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                className="button secondary"
                aria-label={`Move story ${i + 1} down`}
                disabled={i === ids.length - 1}
                onClick={() => move(i, 1)}
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                className="button secondary"
                aria-label={`Remove story ${i + 1}`}
                onClick={() =>
                  setIds((current) => current.filter((x) => x !== id))
                }
              >
                <X size={14} />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <div className="form-grid">
        <label className="field">
          Add a report
          <select value={choice} onChange={(e) => setChoice(e.target.value)}>
            <option value="">Select a story</option>
            {stories
              .filter((s) => !ids.includes(s.id))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.headline} · {s.status}
                </option>
              ))}
          </select>
        </label>
        <button
          className="button secondary"
          type="button"
          style={{ alignSelf: "end" }}
          disabled={!choice || ids.length >= 30}
          onClick={() => {
            setIds((current) => [...current, choice]);
            setChoice("");
          }}
        >
          Add to briefing
        </button>
      </div>
    </section>
  );
}
