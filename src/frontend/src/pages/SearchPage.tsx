import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearch } from "@tanstack/react-router";
import { Music, Search } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { SongGenre } from "../backend";
import SongCard from "../components/SongCard";
import { usePlayer } from "../context/PlayerContext";
import { useSearchSongs } from "../hooks/useQueries";

const GENRE_LABELS: Record<string, string> = {
  [SongGenre.kuduro]: "🔥 Kuduro",
  [SongGenre.rap]: "🎤 Rap",
  [SongGenre.gospel]: "✨ Gospel",
  [SongGenre.other]: "🎵 Outros",
};

const SK5 = ["a", "b", "c", "d", "e"];

export default function SearchPage() {
  const searchParams = useSearch({ from: "/app-layout/search" }) as {
    q?: string;
  };
  const [query, setQuery] = useState(searchParams.q ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const { play } = usePlayer();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results = [], isLoading } = useSearchSongs(debouncedQuery);

  const grouped = results.reduce<Record<string, typeof results>>(
    (acc, song) => {
      const g = song.genre;
      if (!acc[g]) acc[g] = [];
      acc[g].push(song);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6 pb-8" data-ocid="search.page">
      <div>
        <h1 className="text-foreground text-2xl font-bold mb-4">Pesquisar</h1>
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar músicas, artistas..."
            className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-full h-11"
            autoFocus
            data-ocid="search.search_input"
          />
        </div>
      </div>

      {isLoading && debouncedQuery && (
        <div className="space-y-2" data-ocid="search.loading_state">
          {SK5.map((k) => (
            <Skeleton key={k} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && debouncedQuery && results.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
          data-ocid="search.empty_state"
        >
          <Music className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">
            Nenhuma música encontrada para "{debouncedQuery}"
          </p>
        </motion.div>
      )}

      {!debouncedQuery && (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">Pesquisa por género:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(GENRE_LABELS).map(([genre, label]) => (
              <Badge
                key={genre}
                variant="secondary"
                className="cursor-pointer bg-muted hover:bg-muted/80 text-foreground px-4 py-2 text-sm"
                onClick={() => setQuery(genre)}
                data-ocid="search.genre.tab"
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 &&
        Object.entries(grouped).map(([genre, songs]) => (
          <section key={genre} data-ocid="search.results.section">
            <h3 className="text-foreground font-semibold mb-3">
              {GENRE_LABELS[genre] ?? genre}
            </h3>
            <div className="space-y-1">
              {songs.map((song, i) => (
                <SongCard
                  key={song.songId}
                  song={song}
                  index={i}
                  variant="list"
                  onPlay={() => play(songs, i)}
                />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
