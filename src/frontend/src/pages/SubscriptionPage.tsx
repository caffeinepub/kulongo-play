import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Headphones,
  Loader2,
  Music,
  Shield,
  Smartphone,
  Star,
  TrendingUp,
  Volume2,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useSubscription } from "../hooks/useSubscription";

function loadPaymentCoords() {
  try {
    return (
      JSON.parse(localStorage.getItem("kulongo_payment_coords") ?? "null") ?? {}
    );
  } catch {
    return {};
  }
}

function formatDate(ns: bigint | number) {
  const ms = Number(ns) / 1_000_000;
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("pt-PT");
}

const PLANS = [
  {
    id: "free",
    label: "Gratuito",
    price: 0,
    priceLabel: "Grátis",
    color: "border-border",
    badge: null,
    features: [
      { icon: Wifi, text: "Streaming limitado", included: true },
      { icon: AlertTriangle, text: "Exibição de anúncios", included: false },
      { icon: Download, text: "Downloads offline", included: false },
      { icon: Volume2, text: "Qualidade padrão", included: true },
    ],
  },
  {
    id: "basic",
    label: "Básico",
    price: 500,
    priceLabel: "500 Kz/mês",
    color: "border-primary/50",
    badge: null,
    features: [
      { icon: Wifi, text: "Streaming completo", included: true },
      { icon: AlertTriangle, text: "Poucos anúncios", included: true },
      { icon: Download, text: "Downloads offline", included: false },
      { icon: Volume2, text: "Qualidade padrão", included: true },
    ],
  },
  {
    id: "premium",
    label: "Premium",
    price: 1000,
    priceLabel: "1.000 Kz/mês",
    color: "border-primary",
    badge: "Recomendado",
    features: [
      { icon: Wifi, text: "Streaming ilimitado", included: true },
      { icon: Shield, text: "Sem anúncios", included: true },
      { icon: Download, text: "Download offline", included: true },
      { icon: Volume2, text: "Alta qualidade de áudio", included: true },
    ],
  },
];

export default function SubscriptionPage() {
  const qc = useQueryClient();
  const { actor } = useActor();
  const {
    subscription,
    isLoading,
    emailHash,
    planLabel,
    isFree,
    daysRemaining,
  } = useSubscription();

  const [payDialog, setPayDialog] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<"unitel" | "africell" | "kwik">(
    "unitel",
  );
  const [txRef, setTxRef] = useState("");
  const [cancelDialog, setCancelDialog] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);

  const coords = loadPaymentCoords();
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["payment_history", emailHash],
    queryFn: async () => {
      if (!actor || !emailHash) return [];
      try {
        const result = await (actor as any).getPaymentHistory(emailHash);
        return Array.isArray(result) ? result : [];
      } catch {
        return [];
      }
    },
    enabled: !!actor && !!emailHash,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (plan: string) => {
      if (!actor || !emailHash) throw new Error("Não autenticado");
      const planObj = { __kind__: plan };
      const month = new Date().toISOString().slice(0, 7);
      const paymentId = await (actor as any).createOrUpdateSubscription(
        emailHash,
        planObj,
        payMethod === "unitel"
          ? "Unitel Money"
          : payMethod === "kwik"
            ? "Kwik"
            : "Africell Money",
        month,
      );
      return paymentId;
    },
    onSuccess: () => {
      setPendingConfirm(true);
      qc.invalidateQueries({ queryKey: ["subscription"] });
      qc.invalidateQueries({ queryKey: ["payment_history"] });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Erro ao processar assinatura");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !emailHash) throw new Error("Não autenticado");
      await (actor as any).cancelSubscription(emailHash);
    },
    onSuccess: () => {
      toast.success("Assinatura cancelada");
      setCancelDialog(false);
      qc.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Erro ao cancelar");
    },
  });

  const currentPlanId = (subscription as any)?.plan?.__kind__ ?? "free";
  const startDate = (subscription as any)?.startDate ?? 0n;
  const expDate = (subscription as any)?.expirationDate ?? 0n;
  const autoRenew = (subscription as any)?.autoRenew ?? false;

  function handleUpgrade(planId: string) {
    if (planId === "free") {
      setCancelDialog(true);
      return;
    }
    setPayDialog(planId);
    setTxRef("");
    setPendingConfirm(false);
  }

  function handleSubmitPayment() {
    if (!txRef.trim()) {
      toast.error("Insira o número de referência da transação");
      return;
    }
    if (payDialog) subscribeMutation.mutate(payDialog);
  }

  const payCoords =
    payMethod === "unitel"
      ? (coords.unitel ?? {})
      : payMethod === "kwik"
        ? (coords.kwik ?? {})
        : (coords.africell ?? {});

  return (
    <div className="space-y-8 max-w-5xl mx-auto" data-ocid="subscription.page">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Assinatura</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Escolhe o plano ideal para ti e desfruta de música sem limites
        </p>
      </div>

      {/* Current status */}
      {!isFree && subscription && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="pt-5 pb-4">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Plano atual:
                </span>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  {planLabel}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Início: {formatDate(startDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Expira: {formatDate(expDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-muted-foreground">
                  {daysRemaining > 0
                    ? `${daysRemaining} dias restantes`
                    : "Expirado"}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Switch checked={autoRenew} disabled />
                <Label className="text-sm text-muted-foreground">
                  Renovação automática
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          return (
            <Card
              key={plan.id}
              className={`relative transition-all hover:shadow-lg hover:shadow-primary/10 ${
                isCurrent
                  ? "border-primary shadow-md shadow-primary/20"
                  : plan.color
              } ${plan.id === "premium" ? "bg-gradient-to-b from-primary/5 to-card" : ""}`}
              data-ocid={`subscription.${plan.id}.card`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold">
                    <Zap className="w-3 h-3 mr-1" />
                    {plan.badge}
                  </Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Atual
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{plan.label}</CardTitle>
                <div className="text-2xl font-extrabold text-primary">
                  {plan.priceLabel}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li
                      key={f.text}
                      className="flex items-center gap-2 text-sm"
                    >
                      <f.icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          f.included
                            ? "text-primary"
                            : "text-muted-foreground/40"
                        }`}
                      />
                      <span
                        className={
                          f.included
                            ? "text-foreground"
                            : "text-muted-foreground line-through"
                        }
                      >
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button
                    variant="outline"
                    className="w-full opacity-60"
                    disabled
                    data-ocid={`subscription.${plan.id}.current_button`}
                  >
                    Plano Atual
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${
                      plan.id === "premium"
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : plan.id === "free"
                          ? "variant-outline border-destructive/50 text-destructive hover:bg-destructive/10"
                          : ""
                    }`}
                    variant={plan.id === "free" ? "outline" : "default"}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isLoading}
                    data-ocid={`subscription.${plan.id}.primary_button`}
                  >
                    {plan.id === "free"
                      ? "Cancelar assinatura"
                      : currentPlanId === "free" ||
                          (plan.id === "premium" && currentPlanId === "basic")
                        ? "Fazer upgrade"
                        : "Mudar para este plano"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment history */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Headphones className="w-5 h-5 text-primary" />
          Histórico de Pagamentos
        </h2>
        {paymentsLoading ? (
          <div
            className="flex items-center gap-2 py-4"
            data-ocid="subscription.payments.loading_state"
          >
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">A carregar...</span>
          </div>
        ) : !payments?.length ? (
          <Card>
            <CardContent
              className="py-8 text-center"
              data-ocid="subscription.payments.empty_state"
            >
              <Music className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Sem pagamentos registados
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody data-ocid="subscription.payments.table">
                {payments.map((p: any, i: number) => {
                  const plan = p.plan?.__kind__ ?? "free";
                  const status = p.status?.__kind__ ?? "pending";
                  return (
                    <TableRow
                      key={p.paymentId ?? i}
                      data-ocid={`subscription.payments.item.${i + 1}`}
                    >
                      <TableCell className="text-sm">
                        {formatDate(p.timestamp ?? 0n)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {plan === "premium"
                            ? "Premium"
                            : plan === "basic"
                              ? "Básico"
                              : "Gratuito"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.paymentMethod ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {Number(p.amount ?? 0).toLocaleString("pt-PT")} Kz
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            status === "confirmed"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : status === "failed"
                                ? "bg-destructive/20 text-destructive border-destructive/30"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          }
                        >
                          {status === "confirmed"
                            ? "Confirmado"
                            : status === "failed"
                              ? "Falhado"
                              : "Pendente"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Payment dialog */}
      <Dialog
        open={!!payDialog}
        onOpenChange={(open) => {
          if (!open) {
            setPayDialog(null);
            setPendingConfirm(false);
          }
        }}
      >
        <DialogContent
          className="max-w-md"
          data-ocid="subscription.payment.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Pagamento via Mobile Money
            </DialogTitle>
            <DialogDescription>
              Escolhe o teu método de pagamento e segue as instruções
            </DialogDescription>
          </DialogHeader>

          {pendingConfirm ? (
            <div className="py-6 text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
              <div>
                <p className="font-semibold text-foreground">
                  Pagamento Submetido!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  O teu pagamento está a aguardar confirmação do admin. O teu
                  plano será ativado assim que o pagamento for confirmado.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  setPayDialog(null);
                  setPendingConfirm(false);
                }}
                data-ocid="subscription.payment.close_button"
              >
                Fechar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Method selection */}
              <div className="space-y-2">
                <Label>Método de pagamento</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod("unitel")}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      payMethod === "unitel"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                    data-ocid="subscription.payment.unitel.toggle"
                  >
                    <Smartphone className="w-4 h-4 mx-auto mb-1" />
                    Unitel Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("africell")}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      payMethod === "africell"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                    data-ocid="subscription.payment.africell.toggle"
                  >
                    <Smartphone className="w-4 h-4 mx-auto mb-1" />
                    Africell Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("kwik")}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      payMethod === "kwik"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                    data-ocid="subscription.payment.kwik.toggle"
                  >
                    <Smartphone className="w-4 h-4 mx-auto mb-1" />
                    Kwik
                  </button>
                </div>
              </div>

              <Separator />

              {/* Payment instructions */}
              <div className="space-y-2 bg-muted/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Instruções
                </p>
                {payCoords.number && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Número:
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {payCoords.number}
                    </span>
                  </div>
                )}
                {payCoords.name && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Titular:
                    </span>
                    <span className="text-sm text-foreground">
                      {payCoords.name}
                    </span>
                  </div>
                )}
                <p className="text-sm text-foreground/80">
                  {payCoords.instructions ||
                    (payMethod === "unitel"
                      ? "Faz a transferência via Unitel Money e insere a referência da transação abaixo."
                      : payMethod === "kwik"
                        ? "Transfere o valor via Kwik e insere a referência abaixo."
                        : "Faz a transferência via Africell Money e insere a referência da transação abaixo.")}
                </p>
                <div className="mt-2 text-lg font-extrabold text-primary">
                  {payDialog === "premium" ? "1.000" : "500"} Kz
                </div>
              </div>

              {/* Transaction ref */}
              <div className="space-y-2">
                <Label htmlFor="txRef">Referência da transação *</Label>
                <Input
                  id="txRef"
                  placeholder="Ex: TXN123456789"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  data-ocid="subscription.payment.txref.input"
                />
                <p className="text-xs text-muted-foreground">
                  Insere o código de confirmação que recebeste após o pagamento
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPayDialog(null)}
                  data-ocid="subscription.payment.cancel_button"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitPayment}
                  disabled={subscribeMutation.isPending || !txRef.trim()}
                  data-ocid="subscription.payment.submit_button"
                >
                  {subscribeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Confirmar Pagamento
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent data-ocid="subscription.cancel.dialog">
          <DialogHeader>
            <DialogTitle>Cancelar Assinatura</DialogTitle>
            <DialogDescription>
              Tens a certeza que queres cancelar a tua assinatura? Perderás
              acesso às funcionalidades do teu plano atual.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialog(false)}
              data-ocid="subscription.cancel.cancel_button"
            >
              Manter assinatura
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              data-ocid="subscription.cancel.confirm_button"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              Cancelar Assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
