import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Disc3,
  Eye,
  Heart,
  Loader2,
  LogIn,
  Music,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { ExternalBlob, SongMetadata, UserProfile } from "../backend";
import { ReleaseType, SongGenre } from "../backend";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type ArtistEntry = {
  principal: { toString(): string };
  profile: UserProfile & { coverBlobId?: ExternalBlob };
};

function formatDate(ns: bigint) {
  return new Date(Number(ns) / 1_000_000).toLocaleDateString("pt-PT");
}

function truncatePrincipal(p: string) {
  if (p.length <= 16) return p;
  return `${p.slice(0, 8)}...${p.slice(-6)}`;
}

const genreLabel: Record<SongGenre, string> = {
  [SongGenre.kuduro]: "Kuduro",
  [SongGenre.rap]: "Rap",
  [SongGenre.gospel]: "Gospel",
  [SongGenre.other]: "Outro",
};

const releaseLabel: Record<ReleaseType, string> = {
  [ReleaseType.single]: "Single",
  [ReleaseType.ep]: "EP",
  [ReleaseType.album]: "Álbum",
};

const SKELETON_OVERVIEW = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
const SKELETON_SONGS = ["a", "b", "c", "d", "e"];
const SKELETON_ARTISTS = ["a", "b", "c", "d"];

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary/15">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { identity, login, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isAdmin = useQuery<boolean>({
    queryKey: ["admin", "isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });

  const songsQuery = useQuery<SongMetadata[]>({
    queryKey: ["admin", "songs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSongs();
    },
    enabled: !!actor && !actorFetching && isAdmin.data === true,
  });

  const artistsQuery = useQuery<ArtistEntry[]>({
    queryKey: ["admin", "artists"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllUserProfiles() as Promise<ArtistEntry[]>;
    },
    enabled: !!actor && !actorFetching && isAdmin.data === true,
  });

  const deleteMutation = useMutation({
    mutationFn: async (songId: string) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).adminDeleteSong(songId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "songs"] });
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      setConfirmDeleteId(null);
    },
  });

  if (isInitializing || actorFetching) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <img
          src="/assets/uploads/img-20260324-wa0012_3-019d2186-3c1a-7650-b08c-92b83c484338-1.jpg"
          alt="Kulongo Play"
          className="w-16 h-16 rounded-2xl object-cover animate-pulse"
        />
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src="/assets/uploads/img-20260324-wa0012_3-019d2186-3c1a-7650-b08c-92b83c484338-1.jpg"
            alt="Kulongo Play"
            className="w-20 h-20 rounded-2xl object-cover"
          />
          <h1 className="text-2xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Inicia sessão para continuar
          </p>
        </div>
        <Button
          data-ocid="admin.login_button"
          onClick={() => login()}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <LogIn className="w-4 h-4" />
          Entrar com Internet Identity
        </Button>
      </div>
    );
  }

  if (isAdmin.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin.data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertTriangle className="w-14 h-14 text-destructive" />
        <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
        <p className="text-muted-foreground text-sm">
          Não tens permissão para aceder a esta área.
        </p>
      </div>
    );
  }

  const songs = songsQuery.data ?? [];
  const artists = artistsQuery.data ?? [];

  const totalLikes = songs.reduce((acc, s) => acc + Number(s.likeCount), 0);
  const kuduroCount = songs.filter((s) => s.genre === SongGenre.kuduro).length;
  const rapCount = songs.filter((s) => s.genre === SongGenre.rap).length;
  const gospelCount = songs.filter((s) => s.genre === SongGenre.gospel).length;
  const otherCount = songs.filter((s) => s.genre === SongGenre.other).length;
  const singlesCount = songs.filter(
    (s) => s.releaseType === ReleaseType.single,
  ).length;
  const epsCount = songs.filter((s) => s.releaseType === ReleaseType.ep).length;
  const albumsCount = songs.filter(
    (s) => s.releaseType === ReleaseType.album,
  ).length;

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase()),
  );

  const songToDelete = songs.find((s) => s.songId === confirmDeleteId);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border px-4 md:px-8 py-3 flex items-center gap-3">
        <img
          src="/assets/uploads/img-20260324-wa0012_3-019d2186-3c1a-7650-b08c-92b83c484338-1.jpg"
          alt="Kulongo Play"
          className="w-9 h-9 rounded-xl object-cover"
        />
        <div>
          <h1 className="text-sm font-bold text-foreground leading-tight">
            Kulongo Play
          </h1>
          <p className="text-xs text-primary leading-tight">Admin Dashboard</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {identity.getPrincipal().toString().slice(0, 12)}...
          </span>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6">
        <Tabs
          defaultValue="overview"
          className="space-y-6"
          data-ocid="admin.tab"
        >
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="overview" data-ocid="admin.overview.tab">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="songs" data-ocid="admin.songs.tab">
              Músicas
            </TabsTrigger>
            <TabsTrigger value="artists" data-ocid="admin.artists.tab">
              Artistas
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">
              Visão Geral da Plataforma
            </h2>
            {songsQuery.isLoading || artistsQuery.isLoading ? (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                data-ocid="admin.loading_state"
              >
                {SKELETON_OVERVIEW.map((k) => (
                  <Skeleton key={k} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Music}
                  label="Total de Músicas"
                  value={songs.length}
                />
                <StatCard
                  icon={Users}
                  label="Total de Artistas"
                  value={artists.length}
                />
                <StatCard
                  icon={Heart}
                  label="Total de Likes"
                  value={totalLikes}
                />
                <StatCard icon={Disc3} label="Kuduro" value={kuduroCount} />
                <StatCard icon={Disc3} label="Rap" value={rapCount} />
                <StatCard icon={Disc3} label="Gospel" value={gospelCount} />
                <StatCard icon={Disc3} label="Outros" value={otherCount} />
                <StatCard icon={Music} label="Singles" value={singlesCount} />
                <StatCard icon={Music} label="EPs" value={epsCount} />
                <StatCard icon={Music} label="Álbuns" value={albumsCount} />
              </div>
            )}
          </TabsContent>

          {/* SONGS */}
          <TabsContent value="songs" className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground">
                Gestão de Músicas
              </h2>
              <Input
                data-ocid="admin.search_input"
                placeholder="Pesquisar por título ou artista..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-72 bg-card border-border"
              />
            </div>

            {songsQuery.isLoading ? (
              <div className="space-y-3" data-ocid="admin.songs.loading_state">
                {SKELETON_SONGS.map((k) => (
                  <Skeleton key={k} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : filteredSongs.length === 0 ? (
              <div
                className="text-center py-16 text-muted-foreground"
                data-ocid="admin.songs.empty_state"
              >
                Nenhuma música encontrada
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSongs.map((song, idx) => (
                  <Card
                    key={song.songId}
                    className="bg-card border-border"
                    data-ocid={`admin.songs.item.${idx + 1}`}
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        {song.coverBlobId ? (
                          <img
                            src={song.coverBlobId.getDirectURL()}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {song.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {song.artist}
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs border-border text-muted-foreground"
                        >
                          {genreLabel[song.genre]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs border-border text-muted-foreground"
                        >
                          {releaseLabel[song.releaseType]}
                        </Badge>
                      </div>
                      <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className="w-3 h-3" />
                        {Number(song.likeCount)}
                      </div>
                      <div className="hidden lg:block text-xs text-muted-foreground">
                        {formatDate(song.uploadedAt)}
                      </div>
                      <Button
                        data-ocid={`admin.songs.delete_button.${idx + 1}`}
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={() => setConfirmDeleteId(song.songId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ARTISTS */}
          <TabsContent value="artists" className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Gestão de Artistas
            </h2>
            {artistsQuery.isLoading ? (
              <div
                className="space-y-3"
                data-ocid="admin.artists.loading_state"
              >
                {SKELETON_ARTISTS.map((k) => (
                  <Skeleton key={k} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : artists.length === 0 ? (
              <div
                className="text-center py-16 text-muted-foreground"
                data-ocid="admin.artists.empty_state"
              >
                Nenhum artista encontrado
              </div>
            ) : (
              <div className="space-y-3">
                {artists.map((entry, idx) => {
                  const principalStr = entry.principal.toString();
                  const songCount = songs.filter(
                    (s) => s.uploader.toString() === principalStr,
                  ).length;
                  const socialLinksCount = entry.profile.socialLinks
                    ? entry.profile.socialLinks.split("\n").filter(Boolean)
                        .length
                    : 0;
                  return (
                    <Card
                      key={principalStr}
                      className="bg-card border-border"
                      data-ocid={`admin.artists.item.${idx + 1}`}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <Avatar className="w-12 h-12 border border-border">
                          {entry.profile.coverBlobId && (
                            <AvatarImage
                              src={entry.profile.coverBlobId.getDirectURL()}
                            />
                          )}
                          <AvatarFallback className="bg-primary/15 text-primary font-bold">
                            {entry.profile.displayName
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {entry.profile.displayName}
                          </p>
                          {entry.profile.bio && (
                            <p className="text-xs text-muted-foreground truncate">
                              {entry.profile.bio.slice(0, 80)}
                              {entry.profile.bio.length > 80 ? "..." : ""}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground/60 mt-0.5">
                            {truncatePrincipal(principalStr)}
                          </p>
                        </div>
                        <div className="hidden sm:flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Music className="w-3 h-3" />
                            <span>{songCount} músicas</span>
                          </div>
                          {socialLinksCount > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Eye className="w-3 h-3" />
                              <span>{socialLinksCount} redes</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Dialog */}
      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <DialogContent
          className="bg-card border-border"
          data-ocid="admin.delete.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Eliminar Música
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Tens a certeza que queres eliminar{" "}
              <span className="text-foreground font-medium">
                {songToDelete?.title ?? "esta música"}
              </span>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              data-ocid="admin.delete.cancel_button"
              variant="ghost"
              onClick={() => setConfirmDeleteId(null)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              data-ocid="admin.delete.confirm_button"
              variant="destructive"
              onClick={() =>
                confirmDeleteId && deleteMutation.mutate(confirmDeleteId)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
