import Link from "next/link";
import { ArrowUpRight, Search, ArrowRight, Radio } from "lucide-react";
import { brand } from "@/lib/brand";
import { getCategories } from "@/lib/data";
import { ThemeToggle } from "./theme";

export async function Header() {
  const categories = await getCategories();
  return (
    <header className="publication-header">
      <div className="utility-row">
        <span className="utility-date">
          {new Intl.DateTimeFormat("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }).format(new Date())}
        </span>
        <span className="utility-tagline">{brand.tagline}</span>
        <div className="utility-actions">
          <Link href="/about">Our standards</Link>
          <ThemeToggle />
        </div>
      </div>
      <div className="masthead-row">
        <Link href="/" className="masthead" aria-label={`${brand.name} — home`}>
          <span className="masthead-the">{brand.mastheadPrefix}</span>{" "}
          {brand.mastheadName}
          <span className="masthead-period">.</span>
        </Link>
        <Link className="brief-button" href="/briefings">
          The Daily Brief <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="nav-row">
        <nav aria-label="Main navigation">
          <Link href="/" className="front-page-link">
            <Radio size={14} /> Front page
          </Link>
          {categories.slice(0, 8).map((c) => (
            <Link href={`/category/${c.slug}`} key={c.slug}>
              {c.name}
            </Link>
          ))}
          <Link href="/archive">All desks</Link>
        </nav>
        <Link
          href="/search"
          className="nav-search"
          aria-label="Search stories, companies and models"
        >
          <Search size={18} />
          <span>Search</span>
        </Link>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="publication-footer">
      <div className="footer-main">
        <div>
          <Link href="/" className="footer-brand">
            {brand.name}
            <span>.</span>
          </Link>
          <p>
            {brand.tagline}
            <br />
            The developments. The differences. The evidence.
          </p>
        </div>
        <nav aria-label="Footer">
          <Link href="/archive">News archive</Link>
          <Link href="/companies">Company intelligence</Link>
          <Link href="/models">Model directory</Link>
          <Link href="/briefings">Daily briefings</Link>
          <Link href="/about">Editorial standards</Link>
          <Link href="/feed.xml">
            RSS feed <ArrowUpRight size={12} />
          </Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getUTCFullYear()} {brand.name}. All rights reserved.
        </span>
        <span>Read the source. Understand the change.</span>
        <Link href="/admin">
          Newsroom <ArrowRight size={12} />
        </Link>
      </div>
    </footer>
  );
}
