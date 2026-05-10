import { Link } from "@tanstack/react-router";
import { Cross, MessageCircle, Pill, Search, Image, User as UserIcon } from "lucide-react";

const nav = [
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/medications", label: "My Meds", icon: Pill },
  { to: "/find", label: "Find", icon: Search },
  { to: "/gallery", label: "Gallery", icon: Image },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Cross className="size-5" strokeWidth={2.5} />
          </span>
          <span>MedProz</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "bg-accent text-primary" }}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="md:hidden" />
      </div>

      <nav className="md:hidden flex items-center gap-1 overflow-x-auto px-3 pb-2">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
            activeProps={{ className: "bg-accent text-primary" }}
          >
            <n.icon className="size-3.5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
