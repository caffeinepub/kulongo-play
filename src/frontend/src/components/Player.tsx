import { Slider } from "@/components/ui/slider";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Music,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { usePlayer } from "../context/PlayerContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useLikedSongs, useToggleLike } from "../hooks/useQueries";

const GENRE_COVERS: Record<string, string> = {
  kuduro: "/assets/generated/cover-kuduro.dim_300x300.jpg",
  rap: "/assets/generated/cover-rap.dim_300x300.jpg",
  gospel: "/assets/generated/cover-gospel.dim_300x300.jpg",
  other: "/assets/generated/cover-kuduro.dim_300x300.jpg",
};

function formatTime(s: number) {
  if (!s || !Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function Player() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    pause,
    resume,
    next,
    prev,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
  } = usePlayer();

  const { identity } = useInternetIdentity();
  const { data: likedSongs = [] } = useLikedSongs();
  const toggleLike = useToggleLike();
  const [isExpanded, setIsExpanded] = useState(false);

  const isLiked = currentSong ? likedSongs.includes(currentSong.songId) : false;

  const handleLike = async () => {
    if (!currentSong) return;
    if (!identity) {
      toast.error("Faz login para adicionar favoritos");
      return;
    }
    await toggleLike.mutateAsync(currentSong.songId);
  };

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  const coverUrl = currentSong?.coverBlobId
    ? currentSong.coverBlobId.getDirectURL()
    : currentSong
      ? (GENRE_COVERS[currentSong.genre] ?? GENRE_COVERS.other)
      : null;

  const releaseTypeLabel =
    currentSong?.releaseType === "ep"
      ? "EP"
      : currentSong?.releaseType === "album"
        ? "Álbum"
        : "Single";

  const titleWithFeat = currentSong
    ? currentSong.featuring
      ? `${currentSong.title} feat. ${currentSong.featuring}`
      : currentSong.title
    : "";

  return (
    <>
      {/* Full-screen expanded player */}
      <AnimatePresence>
        {currentSong && isExpanded && (
          <motion.div
            key="expanded-player"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed inset-0 z-[60] flex flex-col overflow-hidden"
            data-ocid="player.modal"
          >
            {/* Blurred background */}
            {coverUrl && (
              <img
                src={coverUrl}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover blur-3xl scale-110 opacity-40 pointer-events-none select-none"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.10_0.10_290/0.85)] to-[oklch(0.06_0.08_290/0.97)]" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full px-6 pt-safe pb-safe">
              {/* Top bar */}
              <div className="flex items-center justify-between py-4">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors active:scale-90"
                  data-ocid="player.close_button"
                >
                  <ChevronDown className="w-5 h-5 text-white" />
                </button>
                <span className="text-xs font-semibold tracking-widest uppercase text-white/60">
                  {releaseTypeLabel}
                </span>
                <button
                  type="button"
                  onClick={handleLike}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors active:scale-90"
                  data-ocid="player.like_toggle"
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${
                      isLiked
                        ? "fill-red-500 text-red-500"
                        : "text-white/70 hover:text-red-400"
                    }`}
                  />
                </button>
              </div>

              {/* Album cover */}
              <div className="flex-1 flex items-center justify-center py-4">
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: 0.1,
                    type: "spring",
                    stiffness: 260,
                    damping: 24,
                  }}
                  className="w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden shadow-[0_8px_48px_oklch(0.65_0.22_40/0.35)]"
                >
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={currentSong.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Music className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Song info */}
              <div className="text-center mb-4">
                <p className="text-xs font-semibold tracking-widest uppercase text-white/50 mb-1">
                  {releaseTypeLabel}
                </p>
                <h2 className="text-white font-bold text-2xl leading-tight truncate">
                  {titleWithFeat}
                </h2>
                <p className="text-white/60 text-sm mt-1 truncate">
                  {currentSong.artist}
                </p>
              </div>

              {/* Seek bar */}
              <div className="mb-4">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={([v]) => seek(v)}
                  className="[&_[role=slider]]:bg-primary [&_[data-orientation=horizontal]>span]:bg-primary"
                  data-ocid="player.seek_input"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-white/50 tabular-nums">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-xs text-white/50 tabular-nums">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* Playback controls: [Shuffle] [Prev] [Play] [Next] [Repeat] */}
              <div className="flex items-center justify-center gap-6 mb-6">
                <button
                  type="button"
                  onClick={toggleShuffle}
                  className={`transition-colors active:scale-90 ${
                    shuffle ? "text-primary" : "text-white/50 hover:text-white"
                  }`}
                  data-ocid="player.shuffle.toggle"
                  title="Aleatório"
                >
                  <Shuffle className="w-7 h-7" />
                </button>

                <button
                  type="button"
                  onClick={prev}
                  className="text-white/70 hover:text-white transition-colors active:scale-90"
                  data-ocid="player.prev_button"
                >
                  <SkipBack className="w-7 h-7" />
                </button>

                <button
                  type="button"
                  onClick={isPlaying ? pause : resume}
                  className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_24px_oklch(0.65_0.22_40/0.6)] active:scale-95"
                  data-ocid="player.toggle"
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-primary-foreground" />
                  ) : (
                    <Play className="w-7 h-7 fill-primary-foreground ml-1" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={next}
                  className="text-white/70 hover:text-white transition-colors active:scale-90"
                  data-ocid="player.next_button"
                >
                  <SkipForward className="w-7 h-7" />
                </button>

                <button
                  type="button"
                  onClick={toggleRepeat}
                  className={`transition-colors active:scale-90 ${
                    repeat ? "text-primary" : "text-white/50 hover:text-white"
                  }`}
                  data-ocid="player.repeat.toggle"
                  title="Repetir"
                >
                  <Repeat className="w-7 h-7" />
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-3 mb-8">
                <Volume2 className="w-4 h-4 text-white/50 flex-shrink-0" />
                <Slider
                  value={[volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={([v]) => setVolume(v / 100)}
                  className="[&_[role=slider]]:bg-primary [&_[data-orientation=horizontal]>span]:bg-primary"
                  data-ocid="player.volume_input"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini player bar */}
      <AnimatePresence>
        {currentSong && !isExpanded && (
          <motion.div
            key="mini-player"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50"
            data-ocid="player.panel"
          >
            <div className="bg-[oklch(0.12_0.08_290/0.97)] backdrop-blur-2xl border-t border-border">
              {/* Orange progress bar at very top */}
              <div className="h-[3px] bg-border w-full">
                <motion.div
                  className="h-full bg-primary"
                  style={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.3, ease: "linear" }}
                />
              </div>

              <div className="max-w-screen-xl mx-auto flex items-center gap-3 px-4 py-2.5">
                {/* Album cover + song info — clickable to expand */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  data-ocid="player.open_modal_button"
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-glow-sm">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={currentSong.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Music className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    {isPlaying && (
                      <div className="absolute inset-0 rounded-xl border-2 border-primary/50 animate-pulse" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider truncate leading-tight">
                      {releaseTypeLabel}
                    </p>
                    <p className="text-foreground font-bold text-sm truncate leading-tight">
                      {titleWithFeat}
                    </p>
                    <p className="text-muted-foreground text-xs truncate leading-tight">
                      {currentSong.artist}
                    </p>
                  </div>
                  <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mr-1" />
                </button>

                {/* Center controls */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Shuffle - hidden on mobile */}
                    <button
                      type="button"
                      onClick={toggleShuffle}
                      className={`hidden sm:block transition-colors active:scale-90 ${
                        shuffle
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      data-ocid="player.shuffle.toggle"
                      title="Aleatório"
                    >
                      <Shuffle className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleLike}
                      className="transition-all active:scale-90"
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${
                          isLiked
                            ? "fill-red-500 text-red-500"
                            : "text-muted-foreground hover:text-red-400"
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={prev}
                      className="text-muted-foreground hover:text-foreground transition-colors active:scale-90"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={isPlaying ? pause : resume}
                      className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-all shadow-glow active:scale-95"
                      data-ocid="player.toggle"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 fill-primary-foreground" />
                      ) : (
                        <Play className="w-5 h-5 fill-primary-foreground ml-0.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={next}
                      className="text-muted-foreground hover:text-foreground transition-colors active:scale-90"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>

                    {/* Repeat - hidden on mobile */}
                    <button
                      type="button"
                      onClick={toggleRepeat}
                      className={`hidden sm:block transition-colors active:scale-90 ${
                        repeat
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      data-ocid="player.repeat.toggle"
                      title="Repetir"
                    >
                      <Repeat className="w-5 h-5" />
                    </button>

                    <div className="hidden md:flex items-center gap-2 w-24">
                      <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <Slider
                        value={[volume * 100]}
                        max={100}
                        step={1}
                        onValueChange={([v]) => setVolume(v / 100)}
                        className="[&_[role=slider]]:bg-primary [&_[data-orientation=horizontal]>span]:bg-primary"
                      />
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 w-full max-w-sm">
                    <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                      {formatTime(currentTime)}
                    </span>
                    <div className="flex-1">
                      <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={1}
                        onValueChange={([v]) => seek(v)}
                        className="[&_[role=slider]]:bg-primary [&_[data-orientation=horizontal]>span]:bg-primary"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 tabular-nums">
                      {formatTime(duration)}
                    </span>
                  </div>
                </div>

                <div className="flex-1" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
