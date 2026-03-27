import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle,
  ImagePlus,
  Loader2,
  Music,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, ReleaseType, SongGenre } from "../backend";
import { useUploadSong } from "../hooks/useQueries";

function getCurrentSession() {
  try {
    return JSON.parse(localStorage.getItem("kulongo_session") ?? "null");
  } catch {
    return null;
  }
}

export default function UploadPage() {
  const navigate = useNavigate();
  const uploadSong = useUploadSong();
  const audioFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [producer, setProducer] = useState("");
  const [featuring, setFeaturing] = useState("");
  const [year, setYear] = useState("");
  const [genre, setGenre] = useState<SongGenre | "">("");
  const [releaseType, setReleaseType] = useState<ReleaseType | "">(
    ReleaseType.single,
  );
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);

  const session = getCurrentSession();

  const handleCoverChange = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor seleciona uma imagem (JPG, PNG, WEBP)");
      return;
    }
    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  const clearCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
    if (coverFileRef.current) coverFileRef.current.value = "";
  };

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAudio(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "audio/mpeg" || dropped?.name.endsWith(".mp3")) {
      setAudioFile(dropped);
    } else {
      toast.error("Por favor seleciona um ficheiro MP3");
    }
  };

  const handleCoverDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCover(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleCoverChange(dropped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !title.trim() ||
      !artist.trim() ||
      !genre ||
      !releaseType ||
      !audioFile
    ) {
      toast.error("Preenche todos os campos obrigatórios");
      return;
    }
    const yearNum = year ? Number.parseInt(year, 10) : null;
    if (
      year &&
      (Number.isNaN(yearNum!) ||
        yearNum! < 1900 ||
        yearNum! > new Date().getFullYear())
    ) {
      toast.error("Ano inválido");
      return;
    }
    try {
      let coverBlobId: ExternalBlob | null = null;

      if (coverFile) {
        const [audioBuffer, coverBuffer] = await Promise.all([
          audioFile.arrayBuffer(),
          coverFile.arrayBuffer(),
        ]);

        const [audioBlob, coverBlob] = [
          ExternalBlob.fromBytes(
            new Uint8Array(audioBuffer),
          ).withUploadProgress((pct) => setAudioProgress(pct)),
          ExternalBlob.fromBytes(
            new Uint8Array(coverBuffer),
          ).withUploadProgress((pct) => setCoverProgress(pct)),
        ];

        const songId = `song-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        coverBlobId = coverBlob;

        await uploadSong.mutateAsync({
          title: title.trim(),
          artist: artist.trim(),
          genre: genre as SongGenre,
          releaseType: releaseType as ReleaseType,
          songId,
          audioBlob,
          coverBlobId,
          producer: producer.trim() || null,
          featuring: featuring.trim() || null,
          year: yearNum,
        });
      } else {
        const audioBuffer = await audioFile.arrayBuffer();
        const audioBlob = ExternalBlob.fromBytes(
          new Uint8Array(audioBuffer),
        ).withUploadProgress((pct) => setAudioProgress(pct));
        const songId = `song-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        await uploadSong.mutateAsync({
          title: title.trim(),
          artist: artist.trim(),
          genre: genre as SongGenre,
          releaseType: releaseType as ReleaseType,
          songId,
          audioBlob,
          coverBlobId: null,
          producer: producer.trim() || null,
          featuring: featuring.trim() || null,
          year: yearNum,
        });
      }

      toast.success("Música carregada com sucesso!");
      navigate({ to: "/" });
    } catch {
      toast.error("Erro ao carregar a música. Tenta novamente.");
      setAudioProgress(0);
      setCoverProgress(0);
    }
  };

  // Only artists can upload
  if (!session || session.role !== "artista") {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
        data-ocid="upload.page"
      >
        <Music className="w-16 h-16 text-primary/40 mb-4" />
        <h2 className="text-foreground text-xl font-bold mb-2">
          Apenas artistas podem carregar música
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Regista-te como artista para partilhar a tua música
        </p>
      </div>
    );
  }

  const isPending = uploadSong.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto pb-8"
      data-ocid="upload.page"
    >
      <h1 className="text-foreground text-2xl font-bold mb-6">
        Carregar Música
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Cover art + release type row */}
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <Label className="text-foreground mb-1.5 block">
              Capa (opcional)
            </Label>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingCover(true);
              }}
              onDragLeave={() => setIsDraggingCover(false)}
              onDrop={handleCoverDrop}
              className={cn(
                "relative flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-colors",
                isDraggingCover
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-muted/30",
                coverFile && "border-primary/60",
              )}
              data-ocid="upload.dropzone"
            >
              <input
                ref={coverFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCoverChange(f);
                }}
                data-ocid="upload.upload_button"
              />
              {coverPreview ? (
                <>
                  <img
                    src={coverPreview}
                    alt="Capa"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearCover}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black/90 transition-colors"
                    data-ocid="upload.close_button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-center px-2">
                  <ImagePlus className="w-7 h-7 text-muted-foreground" />
                  <p className="text-muted-foreground text-xs leading-tight">
                    Adicionar capa
                  </p>
                </div>
              )}
            </label>
          </div>

          <div className="flex-1 flex flex-col gap-3 justify-center">
            <div className="space-y-1.5">
              <Label className="text-foreground">Tipo de lançamento *</Label>
              <Select
                value={releaseType}
                onValueChange={(v) => setReleaseType(v as ReleaseType)}
              >
                <SelectTrigger
                  className="bg-muted border-border text-foreground"
                  data-ocid="upload.release_type.select"
                >
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem
                    value={ReleaseType.single}
                    className="text-foreground"
                  >
                    🎵 Single
                  </SelectItem>
                  <SelectItem
                    value={ReleaseType.ep}
                    className="text-foreground"
                  >
                    💿 EP
                  </SelectItem>
                  <SelectItem
                    value={ReleaseType.album}
                    className="text-foreground"
                  >
                    📀 Álbum
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground">Género *</Label>
              <Select
                value={genre}
                onValueChange={(v) => setGenre(v as SongGenre)}
              >
                <SelectTrigger
                  className="bg-muted border-border text-foreground"
                  data-ocid="upload.genre.select"
                >
                  <SelectValue placeholder="Seleciona o género" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem
                    value={SongGenre.kuduro}
                    className="text-foreground"
                  >
                    🔥 Kuduro
                  </SelectItem>
                  <SelectItem value={SongGenre.rap} className="text-foreground">
                    🎤 Rap Angolano
                  </SelectItem>
                  <SelectItem
                    value={SongGenre.gospel}
                    className="text-foreground"
                  >
                    ✨ Gospel
                  </SelectItem>
                  <SelectItem
                    value={SongGenre.other}
                    className="text-foreground"
                  >
                    🎵 Outros
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Audio file drop zone */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingAudio(true);
          }}
          onDragLeave={() => setIsDraggingAudio(false)}
          onDrop={handleAudioDrop}
          className={cn(
            "flex flex-col border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
            isDraggingAudio
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 bg-muted/30",
            audioFile && "border-green-500/50 bg-green-500/5",
          )}
        >
          <input
            ref={audioFileRef}
            type="file"
            accept=".mp3,audio/mpeg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setAudioFile(f);
            }}
          />
          {audioFile ? (
            <div className="flex items-center gap-3 justify-center">
              <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
              <div className="text-left">
                <p className="text-foreground font-medium text-sm">
                  {audioFile.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-foreground font-medium text-sm">
                  Arrasta o teu MP3 aqui
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  ou clica para selecionar
                </p>
              </div>
            </div>
          )}
        </label>

        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-foreground">
            Título da música *
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Zua Nha Vida"
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            data-ocid="upload.title.input"
          />
        </div>

        {/* Artist */}
        <div className="space-y-1.5">
          <Label htmlFor="artist" className="text-foreground">
            Nome do artista *
          </Label>
          <Input
            id="artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Ex: Buraka Som Sistema"
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            data-ocid="upload.artist.input"
          />
        </div>

        {/* Producer */}
        <div className="space-y-1.5">
          <Label htmlFor="producer" className="text-foreground">
            Produtor
          </Label>
          <Input
            id="producer"
            value={producer}
            onChange={(e) => setProducer(e.target.value)}
            placeholder="Ex: DJ Mista"
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            data-ocid="upload.producer.input"
          />
        </div>

        {/* Featuring */}
        <div className="space-y-1.5">
          <Label htmlFor="featuring" className="text-foreground">
            Participação (feat.)
          </Label>
          <Input
            id="featuring"
            value={featuring}
            onChange={(e) => setFeaturing(e.target.value)}
            placeholder="Ex: Puto Português"
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            data-ocid="upload.featuring.input"
          />
        </div>

        {/* Year */}
        <div className="space-y-1.5">
          <Label htmlFor="year" className="text-foreground">
            Ano
          </Label>
          <Input
            id="year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder={`Ex: ${new Date().getFullYear()}`}
            min={1900}
            max={new Date().getFullYear()}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            data-ocid="upload.year.input"
          />
        </div>

        {isPending && (
          <div className="space-y-3" data-ocid="upload.loading_state">
            {coverFile && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    A carregar capa...
                  </span>
                  <span className="text-primary font-medium">
                    {coverProgress}%
                  </span>
                </div>
                <Progress
                  value={coverProgress}
                  className="h-1.5 bg-muted [&>div]:bg-orange-400"
                />
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  A carregar áudio...
                </span>
                <span className="text-primary font-medium">
                  {audioProgress}%
                </span>
              </div>
              <Progress
                value={audioProgress}
                className="h-1.5 bg-muted [&>div]:bg-primary"
              />
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-full shadow-glow"
          data-ocid="upload.submit_button"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> A enviar...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" /> Carregar Música
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}
