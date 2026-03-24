import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { Home, Music, Search, Upload, User } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "Início" },
  { to: "/search", icon: Search, label: "Pesquisar" },
  { to: "/upload", icon: Upload, label: "Carregar" },
  { to: "/profile", icon: User, label: "Perfil" },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 flex-col bg-sidebar border-r border-sidebar-border z-40 pt-0">
      {/* Logo area */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img
            src="/assets/uploads/img-20260324-wa0012_3-019d2186-3c1a-7650-b08c-92b83c484338-1.jpg"
            alt="Kulongo Play"
            className="w-10 h-10 rounded-xl object-cover shadow-glow-sm"
          />
          <div className="leading-none">
            <div className="flex items-baseline">
              <span className="text-foreground font-extrabold text-lg tracking-tight">
                Kulongo
              </span>
              <span className="text-primary font-extrabold text-lg tracking-tight ml-1">
                PLAY
              </span>
            </div>
            <span className="text-muted-foreground text-[10px] tracking-wide">
              Sente o poder do som
            </span>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1" data-ocid="sidebar.nav.panel">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              )}
              data-ocid={`sidebar.${label.toLowerCase()}.link`}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-primary" : "opacity-70",
                )}
              />
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Music className="w-4 h-4 text-primary/70" />
          <span className="text-xs">
            Kulongo Play © {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </aside>
  );
}
