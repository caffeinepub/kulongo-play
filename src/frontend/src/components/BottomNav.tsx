import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { CreditCard, Home, Search, Upload, User } from "lucide-react";

const ALL_NAV_ITEMS = [
  { to: "/", icon: Home, label: "Início", artistOnly: false },
  { to: "/search", icon: Search, label: "Pesquisar", artistOnly: false },
  { to: "/upload", icon: Upload, label: "Carregar", artistOnly: true },
  { to: "/profile", icon: User, label: "Perfil", artistOnly: false },
  { to: "/subscription", icon: CreditCard, label: "Plano", artistOnly: false },
];

export default function BottomNav() {
  const role = localStorage.getItem("kulongo_user_role");
  const navItems = ALL_NAV_ITEMS.filter(
    (item) => !item.artistOnly || role === "artista",
  );

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
