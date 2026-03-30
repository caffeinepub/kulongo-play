import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";

function getSession() {
  try {
    return JSON.parse(localStorage.getItem("kulongo_session") ?? "null");
  } catch {
    return null;
  }
}

export function useSubscription() {
  const { actor, isFetching } = useActor();
  const session = getSession();
  const emailHash = session?.email ? btoa(session.email) : null;

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", emailHash],
    queryFn: async () => {
      if (!actor || !emailHash) return null;
      try {
        const result = await (actor as any).getUserSubscription(emailHash);
        if (Array.isArray(result)) return result[0] ?? null;
        return result ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!emailHash,
  });

  const planKind = (subscription as any)?.plan?.__kind__ ?? "free";

  const planLabel =
    planKind === "premium"
      ? "Premium"
      : planKind === "basic"
        ? "Básico"
        : "Gratuito";

  const isPremium = planKind === "premium";
  const isBasic = planKind === "basic";
  const isFree = planKind === "free";

  const daysRemaining = (() => {
    if (!subscription) return 0;
    const exp = Number((subscription as any).expirationDate ?? 0);
    if (!exp) return 0;
    const ms = exp / 1_000_000 - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  })();

  return {
    subscription,
    isLoading,
    emailHash,
    planLabel,
    isPremium,
    isBasic,
    isFree,
    daysRemaining,
  };
}
