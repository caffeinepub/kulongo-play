import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "@tanstack/react-router";
import {
  Eye,
  Facebook,
  Instagram,
  Music,
  Twitter,
  Users,
  Youtube,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { SiTiktok } from "react-icons/si";
import SongCard from "../components/SongCard";
import { usePlayer } from "../context/PlayerContext";
import {
  useArtistProfile,
  useArtistVisitCount,
  useRecordProfileVisit,
  useSongsByArtist,
} from "../hooks/useQueries";

const SK5 = ["a", "b", "c", "d", "e"];

type SocialLinks = {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  twitter?: string;
};

function parseSocialLinks(raw?: string | null): SocialLinks {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as SocialLinks;
  } catch {
    return {};
  }
}

const socialPlatforms = [
  {
    key: "instagram" as const,
    label: "Instagram",
    Icon: Instagram,
    color: "#e1306c",
  },
  {
    key: "facebook" as const,
    label: "Facebook",
    Icon: Facebook,
    color: "#1877f2",
  },
  {
    key: "youtube" as const,
    label: "YouTube",
    Icon: Youtube,
    color: "#ff0000",
  },
  {
    key: "tiktok" as const,
    label: "TikTok",
    IconSi: SiTiktok,
    color: "#555555",
  },
  {
    key: "twitter" as const,
    label: "Twitter / X",
    Icon: Twitter,
    color: "#1da1f2",
  },
];

function formatVisitCount(count: bigint): string {
  const n = Number(count);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function ArtistPage() {
  const { name } = useParams({ from: "/artist/$name" });
  const decodedName = decodeURIComponent(name);
  const { data: songs = [], isLoading } = useSongsByArtist(decodedName);
  const { play } = usePlayer();

  const uploaderPrincipal = songs.length > 0 ? songs[0].uploader : null;
  const { data: profile, isLoading: profileLoading } =
    useArtistProfile(uploaderPrincipal);
  const { data: visitCount } = useArtistVisitCount(uploaderPrincipal);
  const { mutate: recordVisit } = useRecordProfileVisit();

  useEffect(() => {
    if (uploaderPrincipal) {
      recordVisit(uploaderPrincipal);
    }
  }, [uploaderPrincipal, recordVisit]);

  const coverURL = (profile as any)?.coverBlobId?.getDirectURL?.() ?? null;
  const displayedLinks = parseSocialLinks((profile as any)?.socialLinks);
  const hasLinks = Object.values(displayedLinks).some((v) => !!v);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8 pb-8"
      data-ocid="artist.page"
    >
      {/* Profile Header Card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Cover gradient bar */}
        <div className="h-2 bg-gradient-to-r from-primary via-primary/60 to-accent/40" />

        <div className="p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {isLoading || profileLoading ? (
                <Skeleton className="w-20 h-20 rounded-full bg-muted" />
              ) : coverURL ? (
                <img
                  src={coverURL}
                  alt={decodedName}
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/50"
                  data-ocid="artist.cover.panel"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 flex items-center justify-center text-primary text-3xl font-bold"
                  data-ocid="artist.cover.panel"
                >
                  {decodedName[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {isLoading || profileLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40 bg-muted" />
                  <Skeleton className="h-4 w-24 bg-muted" />
                  <Skeleton className="h-4 w-32 bg-muted" />
                </div>
              ) : (
                <>
                  <h1 className="text-foreground text-2xl font-bold">
                    {decodedName}
                  </h1>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Music className="w-3.5 h-3.5 text-primary" />
                      {songs.length} {songs.length === 1 ? "música" : "músicas"}
                    </span>
                    <span
                      className="flex items-center gap-1.5 text-sm font-medium text-primary"
                      data-ocid="artist.visitors.panel"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {visitCount !== undefined
                        ? formatVisitCount(visitCount)
                        : "—"}{" "}
                      visitantes
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Biography */}
          {!isLoading && !profileLoading && profile?.bio && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-5 p-4 rounded-xl bg-muted/50 border border-border/60"
              data-ocid="artist.bio.panel"
            >
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">
                Biografia
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {profile.bio}
              </p>
            </motion.div>
          )}

          {/* Social links */}
          {!isLoading && !profileLoading && hasLinks && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="mt-5"
              data-ocid="artist.social.panel"
            >
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Redes Sociais
              </p>
              <div className="flex flex-wrap gap-2">
                {socialPlatforms.map(({ key, label, Icon, IconSi, color }) => {
                  const url = displayedLinks[key];
                  if (!url) return null;
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 hover:border-primary/40 border border-border text-xs text-foreground transition-all duration-200"
                      data-ocid={`artist.${key}.link`}
                    >
                      {Icon ? (
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      ) : IconSi ? (
                        <IconSi className="w-3.5 h-3.5" style={{ color }} />
                      ) : null}
                      {label}
                    </a>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Songs section */}
      <section data-ocid="artist.songs.section">
        <h2 className="text-foreground font-semibold mb-4">Músicas</h2>
        {isLoading ? (
          <div className="space-y-2" data-ocid="artist.songs.loading_state">
            {SK5.map((k) => (
              <Skeleton key={k} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        ) : songs.length > 0 ? (
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
        ) : (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="artist.songs.empty_state"
          >
            <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Este artista ainda não tem músicas</p>
          </div>
        )}
      </section>
    </motion.div>
  );
}
