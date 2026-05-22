import { Link } from "@tanstack/react-router";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/blog", label: "Articles" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader({ siteName }: { siteName: string }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="font-display text-lg font-bold tracking-tight">
          {siteName}
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ siteName }: { siteName: string }) {
  return (
    <footer className="mt-24 border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
        <nav className="flex gap-6">
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
