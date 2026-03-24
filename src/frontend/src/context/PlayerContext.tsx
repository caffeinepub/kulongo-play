import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { SongMetadata } from "../backend";

interface PlayerContextValue {
  queue: SongMetadata[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  play: (songs: SongMetadata[], index?: number) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  currentSong: SongMetadata | null;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<SongMetadata[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<SongMetadata[]>(queue);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.8;
    audioRef.current = audio;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        return next < queueRef.current.length ? next : prev;
      });
    };
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
  }, []);

  const currentSong = queue[currentIndex] ?? null;

  // biome-ignore lint/correctness/useExhaustiveDependencies: currentSong already depends on currentIndex
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    const url = currentSong.blobId.getDirectURL();
    if (audio.src !== url) {
      audio.src = url;
      audio.load();
      if (isPlayingRef.current) {
        audio.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentSong]);

  const play = useCallback((songs: SongMetadata[], index = 0) => {
    const audio = audioRef.current;
    if (!audio) return;
    setQueue(songs);
    setCurrentIndex(index);
    const url = songs[index]?.blobId.getDirectURL();
    if (url) {
      audio.src = url;
      audio.load();
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
    setIsPlaying(true);
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((prev) => {
      const nextIdx = Math.min(prev + 1, queueRef.current.length - 1);
      const audio = audioRef.current;
      const url = queueRef.current[nextIdx]?.blobId.getDirectURL();
      if (audio && url) {
        audio.src = url;
        audio.load();
        audio.play().catch(() => {});
        setIsPlaying(true);
      }
      return nextIdx;
    });
  }, []);

  const prev = useCallback(() => {
    setCurrentIndex((prevIdx) => {
      const newIdx = Math.max(prevIdx - 1, 0);
      const audio = audioRef.current;
      const url = queueRef.current[newIdx]?.blobId.getDirectURL();
      if (audio && url) {
        audio.src = url;
        audio.load();
        audio.play().catch(() => {});
        setIsPlaying(true);
      }
      return newIdx;
    });
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) audioRef.current.volume = vol;
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        queue,
        currentIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        play,
        pause,
        resume,
        next,
        prev,
        seek,
        setVolume,
        currentSong,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
