import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Music, Play } from "lucide-react";
import { motion } from "motion/react";
import { SongGenre } from "../backend";
import SongCard from "../components/SongCard";
import { usePlayer } from "../context/PlayerContext";
import { useSongsByGenre } from "../hooks/useQueries";

const MOOD_MAP: Record<
  string,
  { label: string; sub: string; image: string; genre: SongGenre }
> = {
  "afro-hits": {
    label: "Afro Hits",
    sub: "Os maiores hits africanos",
    image: "/assets/generated/destaques-afro-hits.dim_400x400.jpg",
    genre: SongGenre.kuduro,
  },
  "top-vibes": {
    label: "Top Vibes",
    sub: "Energia e ritmo puro",
    image: "/assets/generated/destaques-top-vibes.dim_400x400.jpg",
    genre: SongGenre.rap,
  },
  relax: {
    label: "Relax",
    sub: "Música para relaxar",
    image: "/assets/generated/destaques-relax.dim_400x400.jpg",
    genre: SongGenre.gospel,
  },
};

export default function PlaylistPage() {
  const { mood } = useParams({ from: "/app-layout/playlist/$mood" });
  const info = MOOD_MAP[mood];
  const { data: songs = [], isLoading } = useSongsByGenre(
    info?.genre ?? SongGenre.kuduro,
  );
  const { play } = usePlayer();

  if (!info) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Music className="w-12 h-12 mb-4 opacity-30" />
        <p>Playlist não encontrada</p>
        <Link to="/">
          <Button variant="outline" className="mt-4 border-border">
            Voltar
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8" data-ocid="playlist.page">
      {/* Back button */}
      <Link to="/" data-ocid="playlist.link">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{ height: 280 }}
      >
        <img
          src={info.image}
          alt={info.label}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
          <div>
            <p className="text-white/70 text-sm mb-1">Playlist</p>
            <h1 className="text-white font-extrabold text-3xl">{info.label}</h1>
            <p className="text-white/60 text-sm mt-1">{info.sub}</p>
          </div>
          <Button
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-6 shadow-glow"
            onClick={() => songs.length > 0 && play(songs, 0)}
            disabled={songs.length === 0}
            data-ocid="playlist.primary_button"
          >
            <Play className="w-4 h-4 fill-current" />
            Reproduzir tudo
          </Button>
        </div>
      </motion.div>

      {/* Song count */}
      {!isLoading && (
        <p className="text-muted-foreground text-sm">
          {songs.length} {songs.length === 1 ? "música" : "músicas"}
        </p>
      )}

      {/* Songs list */}
      {isLoading ? (
        <div className="space-y-2" data-ocid="playlist.loading_state">
          {[1, 2, 3, 4, 5].map((k) => (
            <Skeleton key={k} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      ) : songs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-muted-foreground"
          data-ocid="playlist.empty_state"
        >
          <Music className="w-12 h-12 mb-4 opacity-30" />
          <p className="font-medium">Ainda não há músicas nesta playlist</p>
          <p className="text-sm mt-1 mb-4">Sê o primeiro a carregar!</p>
          <Link to="/upload">
            <Button
              variant="outline"
              className="border-border"
              data-ocid="playlist.button"
            >
              Carregar música
            </Button>
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-2"
        >
          {songs.map((song, i) => (
            <SongCard
              key={song.songId}
              song={song}
              index={i}
              variant="list"
              onPlay={() => play(songs, i)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
