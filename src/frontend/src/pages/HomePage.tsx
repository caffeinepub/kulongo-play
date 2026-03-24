import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Music, Play } from "lucide-react";
import { motion } from "motion/react";
import { SongGenre } from "../backend";
import SongCard from "../components/SongCard";
import { usePlayer } from "../context/PlayerContext";
import { useAllSongs, useSongsByGenre } from "../hooks/useQueries";

const DESTAQUES = [
  {
    label: "Afro Hits",
    sub: "Os maiores hits africanos",
    image: "/assets/generated/destaques-afro-hits.dim_400x400.jpg",
  },
  {
    label: "Top Vibes",
    sub: "Energia e ritmo puro",
    image: "/assets/generated/destaques-top-vibes.dim_400x400.jpg",
  },
  {
    label: "Relax",
    sub: "Música para relaxar",
    image: "/assets/generated/destaques-relax.dim_400x400.jpg",
  },
];

const SK5 = ["a", "b", "c", "d", "e"];
const SK4 = ["a", "b", "c", "d"];

function SongSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-card border border-border">
      <Skeleton className="aspect-square bg-muted" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4 bg-muted" />
        <Skeleton className="h-3 w-1/2 bg-muted" />
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  showAll,
}: { title: string; showAll?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-foreground font-bold text-lg">{title}</h2>
      {showAll && (
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary/90 gap-1 text-sm"
        >
          Ver tudo <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

export default function HomePage() {
  const { data: allSongs = [] } = useAllSongs();
  const { data: kuduroSongs = [], isLoading: kuduroLoading } = useSongsByGenre(
    SongGenre.kuduro,
  );
  const { data: rapSongs = [], isLoading: rapLoading } = useSongsByGenre(
    SongGenre.rap,
  );
  const { data: gospelSongs = [], isLoading: gospelLoading } = useSongsByGenre(
    SongGenre.gospel,
  );
  const { play } = usePlayer();

  return (
    <div className="space-y-10 pb-8" data-ocid="home.page">
      {/* Logo + Tagline hero on mobile */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center pt-2 pb-2 md:hidden"
      >
        <div className="flex items-center gap-3 mb-1">
          <img
            src="/assets/uploads/img-20260324-wa0012_3-019d2186-3c1a-7650-b08c-92b83c484338-1.jpg"
            alt="Kulongo Play"
            className="w-14 h-14 rounded-2xl object-cover shadow-glow"
          />
          <div>
            <div className="flex items-baseline">
              <span className="text-foreground font-extrabold text-2xl tracking-tight">
                Kulongo
              </span>
              <span className="text-primary font-extrabold text-2xl tracking-tight ml-1">
                PLAY
              </span>
            </div>
            <p className="text-muted-foreground text-xs tracking-wide">
              Sente o poder do som
            </p>
          </div>
        </div>
      </motion.section>

      {/* Destaques Section */}
      <section data-ocid="home.destaques.section">
        <SectionHeader title="Destaques" showAll />
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {DESTAQUES.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl overflow-hidden cursor-pointer group aspect-square"
              data-ocid={`home.destaques.item.${i + 1}`}
            >
              <img
                src={item.image}
                alt={item.label}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {/* Hover orange border */}
              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/70 transition-colors duration-300" />
              {/* Play button on hover */}
              <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-glow-sm scale-75 group-hover:scale-100">
                <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground ml-0.5" />
              </div>
              {/* Text at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white font-bold text-sm leading-tight">
                  {item.label}
                </p>
                <p className="text-white/60 text-xs mt-0.5">{item.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recomendados - all songs */}
      {allSongs.length > 0 && (
        <section data-ocid="home.recomendados.section">
          <SectionHeader title="Recomendados" showAll />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allSongs.slice(0, 10).map((song, i) => (
              <SongCard
                key={song.songId}
                song={song}
                index={i}
                onPlay={() => play(allSongs, i)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Kuduro */}
      <section data-ocid="home.kuduro.section">
        <SectionHeader title="🔥 Top Kuduro" showAll />
        {kuduroLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {SK5.map((k) => (
              <SongSkeleton key={k} />
            ))}
          </div>
        ) : kuduroSongs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {kuduroSongs.slice(0, 10).map((song, i) => (
              <SongCard
                key={song.songId}
                song={song}
                index={i}
                onPlay={() => play(kuduroSongs, i)}
              />
            ))}
          </div>
        ) : (
          <EmptyGenre genre="Kuduro" />
        )}
      </section>

      {/* Rap */}
      <section data-ocid="home.rap.section">
        <SectionHeader title="🎤 Rap Angolano" showAll />
        {rapLoading ? (
          <div className="space-y-2">
            {SK4.map((k) => (
              <Skeleton key={k} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        ) : rapSongs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {rapSongs.slice(0, 8).map((song, i) => (
              <SongCard
                key={song.songId}
                song={song}
                index={i}
                variant="list"
                onPlay={() => play(rapSongs, i)}
              />
            ))}
          </div>
        ) : (
          <EmptyGenre genre="Rap" />
        )}
      </section>

      {/* Gospel */}
      <section data-ocid="home.gospel.section">
        <SectionHeader title="✨ Gospel Angola" showAll />
        {gospelLoading ? (
          <div className="space-y-2">
            {SK4.map((k) => (
              <Skeleton key={k} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        ) : gospelSongs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {gospelSongs.slice(0, 8).map((song, i) => (
              <SongCard
                key={song.songId}
                song={song}
                index={i}
                variant="list"
                onPlay={() => play(gospelSongs, i)}
              />
            ))}
          </div>
        ) : (
          <EmptyGenre genre="Gospel" />
        )}
      </section>
    </div>
  );
}

function EmptyGenre({ genre }: { genre: string }) {
  return (
    <div
      className="text-center py-10 text-muted-foreground"
      data-ocid="song.empty_state"
    >
      <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">Ainda não há músicas de {genre}</p>
      <p className="text-xs mt-1">Sê o primeiro a carregar!</p>
      <Link to="/upload">
        <Button variant="outline" size="sm" className="mt-4 border-border">
          Carregar música
        </Button>
      </Link>
    </div>
  );
}
