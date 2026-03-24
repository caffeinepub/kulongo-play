import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Home, Search, Upload, User } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Início" },
  { to: "/search", icon: Search, label: "Pesquisar" },
  { to: "/upload", icon: Upload, label: "Carregar" },
  { to: "/profile", icon: User, label: "Perfil" },
];

export default function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border"
      data-ocid="mobile_nav.panel"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors",
              "text-muted-foreground hover:text-foreground",
              "[&.active]:text-primary",
            )}
            data-ocid={`mobile_nav.${label.toLowerCase()}.link`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
