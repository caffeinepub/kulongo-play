import { Headphones, Loader2, Mic2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type Step = "choose" | "login";
type Role = "artista" | "ouvinte";

export default function AuthPage() {
  const { login, isLoggingIn } = useInternetIdentity();
  const [step, setStep] = useState<Step>("choose");
  const [role, setRole] = useState<Role | null>(null);

  function handleRoleSelect(selected: Role) {
    setRole(selected);
    localStorage.setItem("kulongo_user_role", selected);
    setStep("login");
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden"
      data-ocid="auth.page"
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div
          className="absolute top-1/4 left-1/4 w-[200px] h-[200px] rounded-full bg-primary/5 blur-[80px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[150px] h-[150px] rounded-full bg-violet-500/5 blur-[60px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Wave decoration */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 opacity-10 pointer-events-none"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-full fill-primary"
          aria-hidden="true"
        >
          <path d="M0,60 C150,100 350,0 600,60 C850,120 1050,20 1200,60 L1200,120 L0,120 Z" />
        </svg>
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: "backOut" }}
          className="mb-6"
        >
          <img
            src="/assets/uploads/img-20260324-wa0012_3-019d2186-3c1a-7650-b08c-92b83c484338-1.jpg"
            alt="Kulongo Play"
            className="w-20 h-20 rounded-2xl object-cover shadow-glow"
          />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-center mb-8"
        >
          <h1 className="text-foreground font-extrabold text-3xl tracking-tight mb-2">
            Kulongo <span className="text-primary">Play</span>
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            A tua música angolana, em qualquer lugar.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "choose" ? (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full space-y-4"
            >
              <p className="text-center text-muted-foreground text-sm font-medium mb-2">
                Como queres entrar?
              </p>

              {/* Artista */}
              <button
                type="button"
                onClick={() => handleRoleSelect("artista")}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card text-foreground font-medium hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Mic2 className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-base">Sou Artista</div>
                  <div className="text-xs text-muted-foreground">
                    Partilha a tua música
                  </div>
                </div>
              </button>

              {/* Ouvinte */}
              <button
                type="button"
                onClick={() => handleRoleSelect("ouvinte")}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card text-foreground font-medium hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Headphones className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-base">Sou Ouvinte</div>
                  <div className="text-xs text-muted-foreground">
                    Descobre música angolana
                  </div>
                </div>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full space-y-3"
            >
              <div className="text-center mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {role === "ouvinte" ? (
                    <Headphones className="w-3.5 h-3.5" />
                  ) : (
                    <Mic2 className="w-3.5 h-3.5" />
                  )}
                  {role === "ouvinte" ? "Ouvinte" : "Artista"}
                </span>
              </div>

              {/* Google button */}
              <button
                type="button"
                onClick={login}
                disabled={isLoggingIn}
                data-ocid="auth.google.button"
                className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-muted/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 48 48"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                      fill="#FFC107"
                    />
                    <path
                      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                      fill="#FF3D00"
                    />
                    <path
                      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                      fill="#4CAF50"
                    />
                    <path
                      d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                      fill="#1976D2"
                    />
                  </svg>
                )}
                {isLoggingIn ? "A entrar..." : "Continuar com Google"}
              </button>

              {/* Facebook button */}
              <button
                type="button"
                onClick={login}
                disabled={isLoggingIn}
                data-ocid="auth.facebook.button"
                className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-muted/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect width="24" height="24" rx="4" fill="#1877F2" />
                    <path
                      d="M16.5 8H14c-.3 0-.5.2-.5.5V10H16l-.3 2H13.5v6H11v-6H9.5v-2H11V8.3C11 6.5 12.2 5 14 5h2.5v3z"
                      fill="white"
                    />
                  </svg>
                )}
                {isLoggingIn ? "A entrar..." : "Continuar com Facebook"}
              </button>

              {/* TikTok button */}
              <button
                type="button"
                onClick={login}
                disabled={isLoggingIn}
                data-ocid="auth.tiktok.button"
                className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-muted/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect width="24" height="24" rx="4" fill="#010101" />
                    <path
                      d="M17 8.2a4.2 4.2 0 0 1-2.5-.8v5.4a4.3 4.3 0 1 1-4.3-4.3h.4v2.1a2.2 2.2 0 1 0 1.8 2.2V4h2.1a4.2 4.2 0 0 0 2.5 3.4v.8z"
                      fill="white"
                    />
                    <path
                      d="M10.2 12.8a2.2 2.2 0 1 0 2.2 2.2v-6a4.2 4.2 0 0 0 2.5.8V8a4.2 4.2 0 0 1-2.5-3.4h-2.1v8.5c0 .3-.1.5-.1.7z"
                      fill="#EE1D52"
                      opacity="0.6"
                    />
                  </svg>
                )}
                {isLoggingIn ? "A entrar..." : "Continuar com TikTok"}
              </button>

              {/* Email button */}
              <button
                type="button"
                onClick={login}
                disabled={isLoggingIn}
                data-ocid="auth.email.button"
                className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-sm"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                )}
                {isLoggingIn ? "A entrar..." : "Entrar com Email"}
              </button>

              <button
                type="button"
                onClick={() => setStep("choose")}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
              >
                ← Voltar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terms */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-6 text-center text-muted-foreground text-xs leading-relaxed px-4"
        >
          Ao entrar, concordas com os nossos{" "}
          <span className="text-foreground/60 underline cursor-pointer hover:text-primary transition-colors">
            Termos de Uso
          </span>
        </motion.p>
      </motion.div>
    </div>
  );
}
