import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Edit2,
  Facebook,
  Instagram,
  Loader2,
  Music,
  Save,
  Twitter,
  User,
  Youtube,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SiTiktok } from "react-icons/si";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import SongCard from "../components/SongCard";
import { usePlayer } from "../context/PlayerContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerProfile,
  useSongsByArtist,
  useUpdateProfile,
} from "../hooks/useQueries";

const SK3 = ["a", "b", "c"];

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
    placeholder: "https://instagram.com/",
    Icon: Instagram,
    color: "#e1306c",
  },
  {
    key: "facebook" as const,
    label: "Facebook",
    placeholder: "https://facebook.com/",
    Icon: Facebook,
    color: "#1877f2",
  },
  {
    key: "youtube" as const,
    label: "YouTube",
    placeholder: "https://youtube.com/@",
    Icon: Youtube,
    color: "#ff0000",
  },
  {
    key: "tiktok" as const,
    label: "TikTok",
    placeholder: "https://tiktok.com/@",
    IconSi: SiTiktok,
    color: "#010101",
  },
  {
    key: "twitter" as const,
    label: "Twitter / X",
    placeholder: "https://x.com/",
    Icon: Twitter,
    color: "#1da1f2",
  },
];

export default function ProfilePage() {
  const { identity, login, clear } = useInternetIdentity();
  const { data: profile, isLoading } = useCallerProfile();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { play } = usePlayer();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [youtube, setYoutube] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [twitter, setTwitter] = useState("");
  const [coverBlobId, setCoverBlobId] = useState<ExternalBlob | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setBio(profile.bio ?? "");
      const links = parseSocialLinks((profile as any).socialLinks);
      setInstagram(links.instagram ?? "");
      setFacebook(links.facebook ?? "");
      setYoutube(links.youtube ?? "");
      setTiktok(links.tiktok ?? "");
      setTwitter(links.twitter ?? "");
    }
  }, [profile]);

  const { data: mySongs = [], isLoading: songsLoading } = useSongsByArtist(
    profile?.displayName ?? "",
  );

  if (!identity) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
        data-ocid="profile.page"
      >
        <User className="w-16 h-16 text-primary/40 mb-4" />
        <h2 className="text-foreground text-xl font-bold mb-2">O teu perfil</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Faz login para ver o teu perfil de artista
        </p>
        <Button
          onClick={login}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
          data-ocid="profile.login_button"
        >
          Entrar
        </Button>
      </div>
    );
  }

  const handleCoverFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const buffer = await file.arrayBuffer();
      const blob = ExternalBlob.fromBytes(new Uint8Array(buffer));
      setCoverBlobId(blob);
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);
      toast.success("Foto de capa pronta!");
    } catch {
      toast.error("Erro ao processar a foto de capa");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    try {
      const links: SocialLinks = {};
      if (instagram) links.instagram = instagram;
      if (facebook) links.facebook = facebook;
      if (youtube) links.youtube = youtube;
      if (tiktok) links.tiktok = tiktok;
      if (twitter) links.twitter = twitter;
      const socialLinks =
        Object.keys(links).length > 0 ? JSON.stringify(links) : null;
      await updateProfile.mutateAsync({
        displayName,
        bio: bio || undefined,
        coverBlobId: coverBlobId ?? undefined,
        socialLinks,
      } as any);
      toast.success("Perfil actualizado!");
      setEditing(false);
    } catch {
      toast.error("Erro ao actualizar perfil");
    }
  };

  const handleLogout = () => {
    clear();
    queryClient.clear();
  };

  const displayedLinks = parseSocialLinks((profile as any)?.socialLinks);
  const hasLinks = Object.values(displayedLinks).some((v) => !!v);

  const profileCoverURL =
    (profile as any)?.coverBlobId?.getDirectURL?.() ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8 pb-8"
      data-ocid="profile.page"
    >
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start gap-4">
          {/* Avatar / Cover Photo */}
          <div className="flex-shrink-0">
            {editing ? (
              <div className="relative w-16 h-16">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="w-16 h-16 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary transition-all group relative"
                  data-ocid="profile.upload_button"
                >
                  {uploadingCover ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Capa"
                      className="w-full h-full object-cover"
                    />
                  ) : profileCoverURL ? (
                    <img
                      src={profileCoverURL}
                      alt="Capa"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-primary text-2xl font-bold">
                      {profile?.displayName?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleCoverFileChange}
                  data-ocid="profile.dropzone"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {isLoading ? (
                  <Skeleton className="w-16 h-16 rounded-full bg-muted" />
                ) : profileCoverURL ? (
                  <img
                    src={profileCoverURL}
                    alt={profile?.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary text-2xl font-bold">
                    {profile?.displayName?.[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-40 bg-muted" />
                <Skeleton className="h-4 w-24 bg-muted" />
              </div>
            ) : editing ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-foreground text-sm">
                    Nome artístico
                  </Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-muted border-border text-foreground"
                    data-ocid="profile.name.input"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-foreground text-sm">Bio</Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-muted border-border text-foreground resize-none"
                    rows={3}
                    data-ocid="profile.bio.textarea"
                  />
                </div>

                {/* Social Links Section */}
                <div className="space-y-2 pt-1">
                  <Label className="text-foreground text-sm font-semibold">
                    Redes sociais
                  </Label>
                  {socialPlatforms.map(({ key, placeholder, Icon, IconSi }) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                        {Icon ? (
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        ) : IconSi ? (
                          <IconSi className="w-4 h-4 text-muted-foreground" />
                        ) : null}
                      </span>
                      <Input
                        value={
                          key === "instagram"
                            ? instagram
                            : key === "facebook"
                              ? facebook
                              : key === "youtube"
                                ? youtube
                                : key === "tiktok"
                                  ? tiktok
                                  : twitter
                        }
                        onChange={(e) => {
                          if (key === "instagram") setInstagram(e.target.value);
                          else if (key === "facebook")
                            setFacebook(e.target.value);
                          else if (key === "youtube")
                            setYoutube(e.target.value);
                          else if (key === "tiktok") setTiktok(e.target.value);
                          else setTwitter(e.target.value);
                        }}
                        placeholder={placeholder}
                        className="bg-muted border-border text-foreground text-sm"
                        data-ocid={`profile.${key}.input`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleSave}
                    disabled={updateProfile.isPending || uploadingCover}
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-ocid="profile.save_button"
                  >
                    {updateProfile.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5 mr-1" />
                    )}
                    Guardar
                  </Button>
                  <Button
                    onClick={() => setEditing(false)}
                    size="sm"
                    variant="outline"
                    className="border-border text-foreground hover:bg-muted"
                    data-ocid="profile.cancel_button"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-foreground text-xl font-bold">
                  {profile?.displayName ?? "Artista"}
                </h2>
                {profile?.bio && (
                  <p className="text-muted-foreground text-sm mt-1">
                    {profile.bio}
                  </p>
                )}
                <p className="text-muted-foreground text-xs mt-2 font-mono">
                  {identity.getPrincipal().toString().slice(0, 20)}...
                </p>
                {hasLinks && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {socialPlatforms.map(
                      ({ key, label, Icon, IconSi, color }) => {
                        const url = displayedLinks[key];
                        if (!url) return null;
                        return (
                          <a
                            key={key}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted hover:bg-muted/80 text-xs text-foreground transition-colors"
                            style={{ borderColor: color }}
                            data-ocid={`profile.${key}.link`}
                          >
                            {Icon ? (
                              <Icon className="w-3.5 h-3.5" style={{ color }} />
                            ) : IconSi ? (
                              <IconSi
                                className="w-3.5 h-3.5"
                                style={{ color }}
                              />
                            ) : null}
                            {label}
                          </a>
                        );
                      },
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          {!editing && !isLoading && (
            <Button
              onClick={() => setEditing(true)}
              variant="outline"
              size="sm"
              className="border-border text-foreground hover:bg-muted"
              data-ocid="profile.edit_button"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
            </Button>
          )}
        </div>
      </div>

      <section data-ocid="profile.songs.section">
        <h3 className="text-foreground font-bold text-lg mb-4 flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          As minhas músicas
        </h3>
        {songsLoading ? (
          <div className="space-y-2">
            {SK3.map((k) => (
              <Skeleton key={k} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        ) : mySongs.length > 0 ? (
          <div className="space-y-1">
            {mySongs.map((song, i) => (
              <SongCard
                key={song.songId}
                song={song}
                index={i}
                variant="list"
                onPlay={() => play(mySongs, i)}
              />
            ))}
          </div>
        ) : (
          <div
            className="text-center py-8 text-muted-foreground"
            data-ocid="profile.songs.empty_state"
          >
            <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Ainda não carregaste nenhuma música</p>
          </div>
        )}
      </section>

      <Button
        onClick={handleLogout}
        variant="outline"
        className="border-destructive text-destructive hover:bg-destructive/10"
        data-ocid="profile.logout_button"
      >
        Terminar sessão
      </Button>
    </motion.div>
  );
}
