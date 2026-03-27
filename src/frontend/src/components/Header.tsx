import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, LogOut, Search, Upload } from "lucide-react";
import { useState } from "react";
import { useCallerProfile } from "../hooks/useQueries";

function KulongoLogo() {
  return (
    <img
      src="/assets/uploads/img-20260324-wa0012_3-019d2186-3c1a-7650-b08c-92b83c484338-1.jpg"
      alt="Kulongo Play"
      className="h-10 w-10 rounded-xl object-cover"
    />
  );
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem("kulongo_session") ?? "null");
  } catch {
    return null;
  }
}

export default function Header() {
  const { data: profile } = useCallerProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const session = getSession();
  const isArtist = session?.role === "artista";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate({ to: "/search", search: { q: search.trim() } });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("kulongo_session");
    localStorage.removeItem("kulongo_user_role");
    queryClient.clear();
    window.location.reload();
  };

  const displayName =
    session?.displayName ||
    profile?.displayName ||
    session?.email?.split("@")[0] ||
    "Utilizador";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border h-16">
      <div className="flex items-center gap-4 h-full px-4 md:pl-60">
        {/* Mobile logo */}
        <div className="md:hidden">
          <KulongoLogo />
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-md hidden sm:block"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar músicas, artistas..."
              className="pl-9 bg-secondary/60 border-border text-foreground placeholder:text-muted-foreground rounded-full h-9 focus-visible:ring-primary/50"
              data-ocid="header.search_input"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2">
          {isArtist && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/upload" })}
              className="hidden sm:flex border-border text-foreground hover:bg-muted gap-1.5"
              data-ocid="header.upload_button"
            >
              <Upload className="w-3.5 h-3.5" />
              Carregar
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground gap-1.5"
                data-ocid="header.user_button"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                  {displayName[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="hidden sm:block text-sm max-w-20 truncate">
                  {displayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-popover border-border"
            >
              {isArtist && (
                <DropdownMenuItem
                  onClick={() => navigate({ to: "/profile" })}
                  className="text-foreground hover:bg-muted cursor-pointer"
                  data-ocid="header.profile_link"
                >
                  Meu Perfil
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive hover:bg-muted cursor-pointer"
                data-ocid="header.logout_button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Terminar sessão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
