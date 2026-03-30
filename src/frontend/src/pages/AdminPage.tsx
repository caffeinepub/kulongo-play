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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Check,
  CreditCard,
  Disc3,
  Edit2,
  Eye,
  Headphones,
  Heart,
  Instagram,
  Loader2,
  LogOut,
  Music,
  Save,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ExternalBlob, SongMetadata, UserProfile } from "../backend";
import { ReleaseType, SongGenre } from "../backend";
import { useActor } from "../hooks/useActor";

const ADMIN_EMAIL = "sobangueleca87@gmail.com";
const ADMIN_PASSWORD = "210987";

type ArtistEntry = {
  principal: { toString(): string };
  profile: UserProfile & { coverBlobId?: ExternalBlob };
};

interface PlatformUserRecord {
  emailHash: string;
  role: string;
  displayName: string;
  banned: boolean;
  registeredAt: bigint;
}

interface PaymentCoords {
  kwik: { number: string; name: string; instructions: string };
  unitel: { number: string; name: string; instructions: string };
  express: { number: string; name: string; instructions: string };
}

const DEFAULT_COORDS: PaymentCoords = {
  kwik: { number: "", name: "", instructions: "" },
  unitel: { number: "", name: "", instructions: "" },
  express: { number: "", name: "", instructions: "" },
};

function loadPaymentCoords(): PaymentCoords {
  try {
    return (
      JSON.parse(localStorage.getItem("kulongo_payment_coords") ?? "null") ??
      DEFAULT_COORDS
    );
  } catch {
    return DEFAULT_COORDS;
  }
}

function savePaymentCoords(coords: PaymentCoords) {
  localStorage.setItem("kulongo_payment_coords", JSON.stringify(coords));
}

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
const SKELETON_USERS = ["a", "b", "c", "d"];

const PAYMENT_INITIAL = { kwik: true, unitel: true, express: true };

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

function parseSocialLinks(
  raw: string | undefined,
): { label: string; url: string }[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(":");
      return { label: label.trim(), url: rest.join(":").trim() };
    });
}

function AdminSubscriptionsTab() {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [confirmRefs, setConfirmRefs] = useState<Record<string, string>>({});

  const { data: allSubs, isLoading: subsLoading } = useQuery({
    queryKey: ["admin_subscriptions"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const r = await (actor as any).getAllSubscriptions();
        return Array.isArray(r) ? r : [];
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });

  const { data: allPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["admin_payments"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const r = await (actor as any).getAllPayments();
        return Array.isArray(r) ? r : [];
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });

  const { data: revenueStats } = useQuery({
    queryKey: ["admin_revenue"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const r = await (actor as any).getRevenueStats();
        return Array.isArray(r) ? r : [];
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async ({
      paymentId,
      txRef,
    }: { paymentId: string; txRef: string }) => {
      if (!actor) throw new Error("Sem ator");
      const month = new Date().toISOString().slice(0, 7);
      await (actor as any).confirmPayment(paymentId, txRef, month);
    },
    onSuccess: () => {
      toast.success("Pagamento confirmado!");
      qc.invalidateQueries({ queryKey: ["admin_payments"] });
      qc.invalidateQueries({ queryKey: ["admin_subscriptions"] });
      qc.invalidateQueries({ queryKey: ["admin_revenue"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao confirmar"),
  });

  const totalRevenue = (revenueStats ?? []).reduce(
    (acc: number, r: any) => acc + Number(r.totalRevenue ?? 0),
    0,
  );
  const artistShare = (revenueStats ?? []).reduce(
    (acc: number, r: any) => acc + Number(r.artistShare ?? 0),
    0,
  );
  const platformShare = (revenueStats ?? []).reduce(
    (acc: number, r: any) => acc + Number(r.platformShare ?? 0),
    0,
  );

  const totalSubs = (allSubs ?? []).length;
  const basicSubs = (allSubs ?? []).filter(
    (s: any) => s.plan?.__kind__ === "basic",
  ).length;
  const premiumSubs = (allSubs ?? []).filter(
    (s: any) => s.plan?.__kind__ === "premium",
  ).length;
  const pendingPayments = (allPayments ?? []).filter(
    (p: any) => p.status?.__kind__ === "pending",
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        Gestão de Assinaturas
      </h2>

      {/* Revenue stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Receita Total
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {totalRevenue.toLocaleString("pt-PT")} Kz
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-green-500/20">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Artistas (60%)
            </p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {artistShare.toLocaleString("pt-PT")} Kz
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-primary/20">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Plataforma (40%)
            </p>
            <p className="text-2xl font-bold text-primary mt-1">
              {platformShare.toLocaleString("pt-PT")} Kz
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Assinantes
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {totalSubs}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Plano Básico
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {basicSubs}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Plano Premium
            </p>
            <p className="text-2xl font-bold text-primary mt-1">
              {premiumSubs}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending payments */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          Pagamentos Pendentes ({pendingPayments.length})
        </h3>
        {paymentsLoading ? (
          <div
            className="flex items-center gap-2 py-3"
            data-ocid="admin.assinaturas.payments.loading_state"
          >
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">A carregar...</span>
          </div>
        ) : pendingPayments.length === 0 ? (
          <Card>
            <CardContent
              className="py-6 text-center text-muted-foreground text-sm"
              data-ocid="admin.assinaturas.payments.empty_state"
            >
              Sem pagamentos pendentes
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2" data-ocid="admin.assinaturas.pending.list">
            {pendingPayments.map((p: any, i: number) => (
              <Card
                key={p.paymentId ?? i}
                className="border-yellow-500/20"
                data-ocid={`admin.assinaturas.payment.item.${i + 1}`}
              >
                <CardContent className="py-4 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-mono text-muted-foreground truncate">
                      {p.emailHash}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="capitalize text-xs">
                        {p.plan?.__kind__ === "premium" ? "Premium" : "Básico"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {p.paymentMethod}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {Number(p.amount ?? 0).toLocaleString("pt-PT")} Kz
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Ref. transação"
                      className="h-8 text-sm w-40"
                      value={confirmRefs[p.paymentId] ?? ""}
                      onChange={(e) =>
                        setConfirmRefs((prev) => ({
                          ...prev,
                          [p.paymentId]: e.target.value,
                        }))
                      }
                      data-ocid={`admin.assinaturas.txref.input.${i + 1}`}
                    />
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        confirmPaymentMutation.mutate({
                          paymentId: p.paymentId,
                          txRef: confirmRefs[p.paymentId] ?? "",
                        })
                      }
                      disabled={
                        confirmPaymentMutation.isPending ||
                        !confirmRefs[p.paymentId]?.trim()
                      }
                      data-ocid={`admin.assinaturas.confirm_button.${i + 1}`}
                    >
                      {confirmPaymentMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* All subscriptions */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Todas as Assinaturas</h3>
        {subsLoading ? (
          <div
            className="flex items-center gap-2 py-3"
            data-ocid="admin.assinaturas.subs.loading_state"
          >
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">A carregar...</span>
          </div>
        ) : !(allSubs ?? []).length ? (
          <Card>
            <CardContent
              className="py-6 text-center text-muted-foreground text-sm"
              data-ocid="admin.assinaturas.subs.empty_state"
            >
              Sem assinaturas registadas
            </CardContent>
          </Card>
        ) : (
          <Card data-ocid="admin.assinaturas.subs.table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilizador</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Expiração</TableHead>
                  <TableHead>Auto-renovação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(allSubs ?? []).map((s: any, i: number) => (
                  <TableRow
                    key={s.emailHash ?? i}
                    data-ocid={`admin.assinaturas.subs.item.${i + 1}`}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                      {s.emailHash}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {s.plan?.__kind__ === "premium"
                          ? "Premium"
                          : s.plan?.__kind__ === "basic"
                            ? "Básico"
                            : "Gratuito"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(s.expirationDate ?? 0n)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          s.autoRenew
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {s.autoRenew ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewArtistPrincipal, setViewArtistPrincipal] = useState<string | null>(
    null,
  );
  const [confirmDeleteArtistId, setConfirmDeleteArtistId] = useState<
    string | null
  >(null);
  const [paymentMethods, setPaymentMethods] = useState(PAYMENT_INITIAL);

  // Payment coordinates
  const [paymentCoords, setPaymentCoords] =
    useState<PaymentCoords>(loadPaymentCoords);
  const [editingCoord, setEditingCoord] = useState<keyof PaymentCoords | null>(
    null,
  );
  const [coordDraft, setCoordDraft] = useState({
    number: "",
    name: "",
    instructions: "",
  });

  // Users management
  const [confirmBanUser, setConfirmBanUser] =
    useState<PlatformUserRecord | null>(null);
  const [userSearch, setUserSearch] = useState("");

  const songsQuery = useQuery<SongMetadata[]>({
    queryKey: ["admin", "songs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSongs();
    },
    enabled: !!actor && !actorFetching && adminLoggedIn,
  });

  const artistsQuery = useQuery<ArtistEntry[]>({
    queryKey: ["admin", "artists"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllUserProfiles() as Promise<ArtistEntry[]>;
    },
    enabled: !!actor && !actorFetching && adminLoggedIn,
  });

  const platformUsersQuery = useQuery<PlatformUserRecord[]>({
    queryKey: ["admin", "platformUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPlatformUsers() as Promise<PlatformUserRecord[]>;
    },
    enabled: !!actor && !actorFetching && adminLoggedIn,
  });

  const deleteMutation = useMutation({
    mutationFn: async (songId: string) => {
      if (!actor) throw new Error("No actor");
      return actor.adminDeleteSong(songId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "songs"] });
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      setConfirmDeleteId(null);
      toast.success("Música eliminada com sucesso");
    },
  });

  const deleteArtistMutation = useMutation({
    mutationFn: async (_principal: string) => {
      throw new Error("NOT_IMPLEMENTED");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "artists"] });
      setConfirmDeleteArtistId(null);
      toast.success("Artista eliminado com sucesso");
    },
    onError: (err: Error) => {
      if (err.message === "NOT_IMPLEMENTED") {
        toast.error("Funcionalidade em breve disponível");
      }
      setConfirmDeleteArtistId(null);
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({
      emailHash,
      banned,
    }: {
      emailHash: string;
      banned: boolean;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.banPlatformUser(emailHash, banned);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "platformUsers"] });
      setConfirmBanUser(null);
      toast.success("Utilizador atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar utilizador");
      setConfirmBanUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (emailHash: string) => {
      if (!actor) throw new Error("No actor");
      return actor.deletePlatformUser(emailHash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "platformUsers"] });
      toast.success("Utilizador removido");
    },
    onError: () => {
      toast.error("Erro ao remover utilizador");
    },
  });

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setAdminLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Credenciais inválidas");
    }
  }

  function startEditCoord(key: keyof PaymentCoords) {
    setEditingCoord(key);
    setCoordDraft({ ...paymentCoords[key] });
  }

  function saveCoord() {
    if (!editingCoord) return;
    const updated = { ...paymentCoords, [editingCoord]: coordDraft };
    setPaymentCoords(updated);
    savePaymentCoords(updated);
    setEditingCoord(null);
    toast.success("Coordenadas guardadas");
  }

  if (!adminLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-sm bg-card border-border shadow-xl">
          <CardContent className="p-8 flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <img
                src="/assets/uploads/img-20260324-wa0012_3-019d2186-3c1a-7650-b08c-92b83c484338-1.jpg"
                alt="Kulongo Play"
                className="w-20 h-20 rounded-2xl object-cover"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Inicia sessão para continuar
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="admin-email"
                >
                  Email
                </label>
                <Input
                  id="admin-email"
                  data-ocid="admin.login.input"
                  type="email"
                  placeholder="Email do administrador"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLoginError("");
                  }}
                  className="bg-background border-border"
                  autoComplete="email"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="admin-password"
                >
                  Senha
                </label>
                <Input
                  id="admin-password"
                  data-ocid="admin.login.input"
                  type="password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError("");
                  }}
                  className="bg-background border-border"
                  autoComplete="current-password"
                />
              </div>

              {loginError && (
                <p
                  data-ocid="admin.login.error_state"
                  className="text-sm text-destructive text-center"
                >
                  {loginError}
                </p>
              )}

              <Button
                data-ocid="admin.login.submit_button"
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-1"
              >
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const songs = songsQuery.data ?? [];
  const artists = artistsQuery.data ?? [];
  const platformUsers = platformUsersQuery.data ?? [];

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

  const ouvintesCount = platformUsers.filter(
    (u) => u.role === "ouvinte",
  ).length;

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredUsers = platformUsers.filter(
    (u) =>
      u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.emailHash.toLowerCase().includes(userSearch.toLowerCase()),
  );

  const songToDelete = songs.find((s) => s.songId === confirmDeleteId);
  const artistToView = viewArtistPrincipal
    ? artists.find((a) => a.principal.toString() === viewArtistPrincipal)
    : null;
  const artistToDelete = confirmDeleteArtistId
    ? artists.find((a) => a.principal.toString() === confirmDeleteArtistId)
    : null;

  const paymentMethodsConfig = [
    {
      key: "kwik" as const,
      name: "Kwik",
      desc: "Pagamento rápido via app Kwik — carteiras digitais angolanas",
      color: "text-orange-400",
    },
    {
      key: "unitel" as const,
      name: "Unitel Money",
      desc: "Transferência via Unitel Money — operadora líder em Angola",
      color: "text-blue-400",
    },
    {
      key: "express" as const,
      name: "Express",
      desc: "Pagamento Express — transferência bancária instantânea",
      color: "text-green-400",
    },
  ];

  const isOverviewLoading =
    songsQuery.isLoading ||
    artistsQuery.isLoading ||
    platformUsersQuery.isLoading;

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
        <div className="ml-auto flex items-center gap-3">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {ADMIN_EMAIL}
          </span>
          <Button
            data-ocid="admin.logout.button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setAdminLoggedIn(false)}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </Button>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6">
        <Tabs
          defaultValue="overview"
          className="space-y-6"
          data-ocid="admin.tab"
        >
          <TabsList className="bg-card border border-border flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" data-ocid="admin.overview.tab">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="songs" data-ocid="admin.songs.tab">
              Músicas
            </TabsTrigger>
            <TabsTrigger value="artists" data-ocid="admin.artists.tab">
              Artistas
            </TabsTrigger>
            <TabsTrigger value="users" data-ocid="admin.users.tab">
              Ouvintes
            </TabsTrigger>
            <TabsTrigger value="pagamentos" data-ocid="admin.pagamentos.tab">
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="assinaturas" data-ocid="admin.assinaturas.tab">
              Assinaturas
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Visão Geral da Plataforma
            </h2>
            {isOverviewLoading ? (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                data-ocid="admin.overview.loading_state"
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
                  icon={Headphones}
                  label="Ouvintes Registados"
                  value={ouvintesCount}
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
                  const isBanned = platformUsers.find(
                    (u) =>
                      u.displayName === entry.profile.displayName && u.banned,
                  );
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
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground truncate">
                              {entry.profile.displayName}
                            </p>
                            {isBanned && (
                              <Badge
                                variant="outline"
                                className="text-xs border-red-500/30 text-red-400 bg-red-500/10"
                              >
                                Banido
                              </Badge>
                            )}
                          </div>
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
                        <div className="flex items-center gap-1">
                          <Button
                            data-ocid={`admin.artists.view_button.${idx + 1}`}
                            variant="ghost"
                            size="icon"
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => setViewArtistPrincipal(principalStr)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            data-ocid={`admin.artists.delete_button.${idx + 1}`}
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              setConfirmDeleteArtistId(principalStr)
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* USERS / OUVINTES */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Gestão de Utilizadores
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Músicos e ouvintes registados na plataforma
                </p>
              </div>
              <Input
                placeholder="Pesquisar por nome..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full sm:w-72 bg-card border-border"
              />
            </div>

            {platformUsersQuery.isLoading ? (
              <div className="space-y-3" data-ocid="admin.users.loading_state">
                {SKELETON_USERS.map((k) => (
                  <Skeleton key={k} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div
                className="text-center py-16 text-muted-foreground"
                data-ocid="admin.users.empty_state"
              >
                Nenhum utilizador registado ainda
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user, idx) => (
                  <Card
                    key={user.emailHash}
                    className="bg-card border-border"
                    data-ocid={`admin.users.item.${idx + 1}`}
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                        {user.role === "ouvinte" ? (
                          <Headphones className="w-4 h-4 text-primary" />
                        ) : (
                          <Music className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground text-sm truncate">
                            {user.displayName || user.emailHash}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              user.role === "artista"
                                ? "border-primary/30 text-primary bg-primary/10"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            {user.role === "artista" ? "Músico" : "Ouvinte"}
                          </Badge>
                          {user.banned && (
                            <Badge
                              variant="outline"
                              className="text-xs border-red-500/30 text-red-400 bg-red-500/10"
                            >
                              Banido
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Registado em{" "}
                          {user.registeredAt
                            ? formatDate(user.registeredAt)
                            : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          data-ocid={`admin.users.toggle.${idx + 1}`}
                          variant="ghost"
                          size="sm"
                          className={`text-xs gap-1.5 ${
                            user.banned
                              ? "text-green-400 hover:text-green-400 hover:bg-green-500/10"
                              : "text-amber-400 hover:text-amber-400 hover:bg-amber-500/10"
                          }`}
                          onClick={() => setConfirmBanUser(user)}
                          disabled={banUserMutation.isPending}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          {user.banned ? "Desbanir" : "Banir"}
                        </Button>
                        <Button
                          data-ocid={`admin.users.delete_button.${idx + 1}`}
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            deleteUserMutation.mutate(user.emailHash)
                          }
                          disabled={deleteUserMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* PAGAMENTOS */}
          <TabsContent value="pagamentos" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Métodos de Pagamento
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configura as coordenadas de pagamento para cada método
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {paymentMethodsConfig.map((method, idx) => {
                const active = paymentMethods[method.key];
                const coords = paymentCoords[method.key];
                const isEditing = editingCoord === method.key;

                return (
                  <Card
                    key={method.key}
                    className="bg-card border-border"
                    data-ocid={`admin.pagamentos.item.${idx + 1}`}
                  >
                    <CardContent className="p-5 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-muted">
                            <CreditCard className={`w-5 h-5 ${method.color}`} />
                          </div>
                          <p className="font-bold text-foreground text-base">
                            {method.name}
                          </p>
                        </div>
                        <button
                          data-ocid={`admin.pagamentos.toggle.${idx + 1}`}
                          onClick={() =>
                            setPaymentMethods((prev) => ({
                              ...prev,
                              [method.key]: !prev[method.key],
                            }))
                          }
                          className="focus:outline-none"
                          type="button"
                        >
                          <Badge
                            className={`text-xs cursor-pointer select-none ${
                              active
                                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30"
                                : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30"
                            }`}
                            variant="outline"
                          >
                            {active ? "Ativo" : "Inativo"}
                          </Badge>
                        </button>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {method.desc}
                      </p>

                      {/* Coordinates section */}
                      <div className="border-t border-border pt-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Coordenadas de Pagamento
                          </p>
                          {!isEditing ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs gap-1 text-primary hover:text-primary"
                              onClick={() => startEditCoord(method.key)}
                            >
                              <Edit2 className="w-3 h-3" />
                              Editar
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs gap-1 text-green-400 hover:text-green-400"
                              onClick={saveCoord}
                            >
                              <Save className="w-3 h-3" />
                              Guardar
                            </Button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Número / IBAN / Referência"
                              value={coordDraft.number}
                              onChange={(e) =>
                                setCoordDraft((d) => ({
                                  ...d,
                                  number: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary placeholder:text-muted-foreground/50"
                            />
                            <input
                              type="text"
                              placeholder="Nome do titular"
                              value={coordDraft.name}
                              onChange={(e) =>
                                setCoordDraft((d) => ({
                                  ...d,
                                  name: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary placeholder:text-muted-foreground/50"
                            />
                            <textarea
                              placeholder="Instruções adicionais para o cliente"
                              value={coordDraft.instructions}
                              onChange={(e) =>
                                setCoordDraft((d) => ({
                                  ...d,
                                  instructions: e.target.value,
                                }))
                              }
                              rows={2}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:border-primary placeholder:text-muted-foreground/50 resize-none"
                            />
                          </div>
                        ) : coords.number || coords.name ? (
                          <div className="space-y-1">
                            {coords.number && (
                              <div className="flex gap-2">
                                <span className="text-xs text-muted-foreground w-20 flex-shrink-0">
                                  Número:
                                </span>
                                <span className="text-xs text-foreground font-mono">
                                  {coords.number}
                                </span>
                              </div>
                            )}
                            {coords.name && (
                              <div className="flex gap-2">
                                <span className="text-xs text-muted-foreground w-20 flex-shrink-0">
                                  Titular:
                                </span>
                                <span className="text-xs text-foreground">
                                  {coords.name}
                                </span>
                              </div>
                            )}
                            {coords.instructions && (
                              <div className="flex gap-2">
                                <span className="text-xs text-muted-foreground w-20 flex-shrink-0">
                                  Instruções:
                                </span>
                                <span className="text-xs text-foreground">
                                  {coords.instructions}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground/60 italic">
                            Nenhuma coordenada configurada. Clica em Editar para
                            adicionar.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ASSINATURAS */}
          <TabsContent value="assinaturas" className="space-y-6">
            <AdminSubscriptionsTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Song Dialog */}
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

      {/* View Artist Dialog */}
      <Dialog
        open={!!viewArtistPrincipal}
        onOpenChange={(open) => !open && setViewArtistPrincipal(null)}
      >
        <DialogContent
          className="bg-card border-border max-w-md"
          data-ocid="admin.artist_view.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Perfil do Artista
            </DialogTitle>
          </DialogHeader>
          {artistToView && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-primary">
                  {artistToView.profile.coverBlobId && (
                    <AvatarImage
                      src={artistToView.profile.coverBlobId.getDirectURL()}
                    />
                  )}
                  <AvatarFallback className="bg-primary/15 text-primary font-bold text-xl">
                    {artistToView.profile.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-lg">
                    {artistToView.profile.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground/70 break-all">
                    {truncatePrincipal(artistToView.principal.toString())}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Music className="w-3 h-3" />
                    <span>
                      {
                        songs.filter(
                          (s) =>
                            s.uploader.toString() ===
                            artistToView.principal.toString(),
                        ).length
                      }{" "}
                      músicas
                    </span>
                  </div>
                </div>
              </div>
              {artistToView.profile.bio && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Biografia
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {artistToView.profile.bio}
                  </p>
                </div>
              )}
              {artistToView.profile.socialLinks && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Redes Sociais
                  </p>
                  <div className="space-y-1">
                    {parseSocialLinks(artistToView.profile.socialLinks).map(
                      (link) => (
                        <div
                          key={link.label}
                          className="flex items-center gap-2"
                        >
                          <Instagram className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {link.label}:
                          </span>
                          <span className="text-xs text-primary truncate">
                            {link.url}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setViewArtistPrincipal(null)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Artist Dialog */}
      <Dialog
        open={!!confirmDeleteArtistId}
        onOpenChange={(open) => !open && setConfirmDeleteArtistId(null)}
      >
        <DialogContent
          className="bg-card border-border"
          data-ocid="admin.artist_delete.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Eliminar Artista
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Tens a certeza que queres eliminar o artista{" "}
              <span className="text-foreground font-medium">
                {artistToDelete?.profile.displayName ?? "este artista"}
              </span>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmDeleteArtistId(null)}
              disabled={deleteArtistMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              data-ocid="admin.artist_delete.confirm_button"
              variant="destructive"
              onClick={() =>
                confirmDeleteArtistId &&
                deleteArtistMutation.mutate(confirmDeleteArtistId)
              }
              disabled={deleteArtistMutation.isPending}
            >
              {deleteArtistMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog
        open={!!confirmBanUser}
        onOpenChange={(open) => !open && setConfirmBanUser(null)}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {confirmBanUser?.banned
                ? "Desbanir Utilizador"
                : "Banir Utilizador"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {confirmBanUser?.banned
                ? "Queres restaurar o acesso de "
                : "Queres suspender o acesso de "}
              <span className="text-foreground font-medium">
                {confirmBanUser?.displayName || confirmBanUser?.emailHash}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmBanUser(null)}
              disabled={banUserMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant={confirmBanUser?.banned ? "default" : "destructive"}
              onClick={() =>
                confirmBanUser &&
                banUserMutation.mutate({
                  emailHash: confirmBanUser.emailHash,
                  banned: !confirmBanUser.banned,
                })
              }
              disabled={banUserMutation.isPending}
              className={
                confirmBanUser?.banned ? "bg-green-600 hover:bg-green-700" : ""
              }
            >
              {banUserMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Ban className="w-4 h-4 mr-2" />
              )}
              {confirmBanUser?.banned ? "Desbanir" : "Banir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
