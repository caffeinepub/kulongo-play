import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { Heart, Music, Play } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { SongMetadata } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useLikedSongs, useToggleLike } from "../hooks/useQueries";

const GENRE_COLORS: Record<string, string> = {
  kuduro: "from-orange-600/60 to-red-700/60",
  rap: "from-blue-800/60 to-purple-900/60",
  gospel: "from-yellow-700/60 to-amber-600/60",
  other: "from-green-800/60 to-teal-700/60",
};

const GENRE_COVERS: Record<string, string> = {
  kuduro: "/assets/generated/cover-kuduro.dim_300x300.jpg",
  rap: "/assets/generated/cover-rap.dim_300x300.jpg",
  gospel: "/assets/generated/cover-gospel.dim_300x300.jpg",
  other: "/assets/generated/cover-kuduro.dim_300x300.jpg",
};

interface Props {
  song: SongMetadata;
  onPlay?: () => void;
  index?: number;
  variant?: "card" | "list";
}

export default function SongCard({
  song,
  onPlay,
  index = 0,
  variant = "card",
}: Props) {
  const { identity } = useInternetIdentity();
  const { data: likedSongs = [] } = useLikedSongs();
  const toggleLike = useToggleLike();
  const navigate = useNavigate();
  const isLiked = likedSongs.includes(song.songId);

  const coverUrl = song.coverBlobId
    ? song.coverBlobId.getDirectURL()
    : (GENRE_COVERS[song.genre] ?? GENRE_COVERS.other);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!identity) {
      toast.error("Faz login para adicionar favoritos");
      return;
    }
    await toggleLike.mutateAsync(song.songId);
  };

  const handleArtistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({ to: "/artist/$name", params: { name: song.artist } });
  };

  const releaseLabel =
    song.releaseType === "ep"
      ? "EP"
      : song.releaseType === "album"
        ? "Álbum"
        : "Single";

  if (variant === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={onPlay}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors"
        data-ocid={`song.item.${index + 1}`}
      >
        <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
          {song.coverBlobId ? (
            <img
              src={coverUrl}
              alt={song.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Music className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-medium truncate text-sm">
            {song.title}
          </p>
          <button
            type="button"
            onClick={handleArtistClick}
            className="text-muted-foreground text-xs hover:text-primary transition-colors truncate block"
          >
            {song.artist}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 bg-muted rounded-full">
            {song.genre}
          </span>
          <button
            type="button"
            onClick={handleLike}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              isLiked
                ? "text-red-500"
                : "text-muted-foreground hover:text-red-400",
            )}
            data-ocid={`song.toggle.${index + 1}`}
          >
            <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
          </button>
        </div>
      </motion.div>
    );
  }

  const gradient = GENRE_COLORS[song.genre] ?? GENRE_COLORS.other;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      onClick={onPlay}
      className="relative rounded-xl overflow-hidden cursor-pointer group bg-card border border-border hover:border-primary/40 transition-all hover:shadow-glow"
      data-ocid={`song.card.${index + 1}`}
    >
      <div className="relative aspect-square overflow-hidden">
        {song.coverBlobId ? (
          <img
            src={coverUrl}
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <>
            <img
              src={GENRE_COVERS[song.genre] ?? GENRE_COVERS.other}
              alt={song.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div
              className={cn("absolute inset-0 bg-gradient-to-br", gradient)}
            />
          </>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-glow">
            <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
          </div>
        </div>
        {/* Release type badge */}
        <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-black/60 text-white/90">
          {releaseLabel}
        </span>
        <button
          type="button"
          onClick={handleLike}
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-colors",
            isLiked
              ? "bg-red-500/90 text-white"
              : "bg-black/40 text-white/70 hover:text-red-400 hover:bg-black/60",
          )}
          data-ocid={`song.toggle.${index + 1}`}
        >
          <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
        </button>
      </div>
      <div className="p-3">
        <p className="text-foreground font-semibold text-sm truncate">
          {song.title}
        </p>
        <button
          type="button"
          onClick={handleArtistClick}
          className="text-muted-foreground text-xs hover:text-primary transition-colors truncate block mt-0.5"
        >
          {song.artist}
        </button>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 bg-muted/80 rounded-full">
            {song.genre}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {song.likeCount.toString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
