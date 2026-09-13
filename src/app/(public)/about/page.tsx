import { brand } from "@/lib/brand";
export const metadata = {
  title: "Editorial standards",
  description:
    "How The Inference handles sources, verification, AI-assisted reporting and corrections.",
  alternates: { canonical: "/about" },
};
export default function AboutPage() {
  return (
    <>
      <header className="page-heading">
        <h1>The source matters.</h1>
        <p>
          {brand.name} covers artificial intelligence through its developments,
          its concrete differences, and its evidence.
        </p>
      </header>
      <div className="prose-page">
        <h2>A newsroom built around the change</h2>
        <p>
          AI news moves quickly. Our job is to make the important differences
          legible: a released model, a changed price, an acquisition, a new
          policy. The What Changed section puts the concrete development before
          the commentary.
        </p>
        <h2>Sources, not certainty theater</h2>
        <p>
          Each published report carries a source list. Primary sources are
          original announcements, papers, repositories, filings, or
          documentation. Secondary reporting is coverage from other news
          organizations. Neither a vendor announcement nor an automated
          benchmark result is independent proof of a product’s capabilities.
        </p>
        <ul>
          <li>
            <strong>Primary source confirmed:</strong> original material
            documenting the development has been attached and reviewed. Claims
            of performance remain attributed.
          </li>
          <li>
            <strong>Corroborated:</strong> a primary source and reporting from
            at least one other source domain are attached. This label does not
            certify every underlying claim.
          </li>
          <li>
            <strong>Claims disputed:</strong> material disagreement is described
            in the report. Readers should review the evidence and
            qualifications.
          </li>
          <li>
            <strong>Awaiting verification:</strong> an internal editorial state.
            Unverified stories cannot be published.
          </li>
        </ul>
        <h2>AI-assisted, editorially accountable</h2>
        <p>
          External research agents can propose reporting through a controlled
          ingestion channel. Proposals enter a private review queue, with their
          sources and possible duplicates. They do not publish themselves.
          Published summaries may be prepared with AI assistance and must be
          checked against their cited evidence before publication.
        </p>
        <h2>Unknown means unknown</h2>
        <p>
          Our company and model records distinguish missing information from
          negative values. An undisclosed context window is not zero.
          Unconfirmed API access is not a denial. Vendor pricing is recorded
          with qualifications and can change; consult the linked official
          material before making a purchase.
        </p>
        <h2>Updates and corrections</h2>
        <p>
          Articles display publication and update timestamps. Material
          corrections belong in the body of the affected report, with the
          changed fact explained. Company and model timelines retain important
          developments as the record grows. The newsroom keeps a private audit
          trail of editorial changes.
        </p>
        <h2>A living archive</h2>
        <p>
          News, sources, models, companies, and briefings are connected records.
          Our archive is designed to make yesterday’s development useful
          tomorrow—not just to move it off the front page.
        </p>
      </div>
    </>
  );
}
