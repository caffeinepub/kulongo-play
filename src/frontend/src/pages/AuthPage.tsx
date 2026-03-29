import { Eye, EyeOff, Headphones, Loader2, Mic2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";

type Step = "choose" | "login" | "register";
type Role = "artista" | "ouvinte";

interface StoredUser {
  email: string;
  role: Role;
  displayName?: string;
  banned?: boolean;
}

function hashEmail(email: string): string {
  return `u_${btoa(email.toLowerCase().trim()).replace(/=/g, "")}`;
}

function hashPassword(password: string, email: string): string {
  return `p_${btoa(password + email.toLowerCase().trim()).replace(/=/g, "")}`;
}

export function logoutUser() {
  localStorage.removeItem("kulongo_session");
}

export function getCurrentUser(): StoredUser | null {
  try {
    return JSON.parse(localStorage.getItem("kulongo_session") ?? "null");
  } catch {
    return null;
  }
}

function saveSession(user: StoredUser) {
  localStorage.setItem("kulongo_session", JSON.stringify(user));
  localStorage.setItem("kulongo_user_role", user.role);
}

export default function AuthPage() {
  const [step, setStep] = useState<Step>("choose");
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const { actor } = useActor();

  function handleRoleSelect(selected: Role) {
    setRole(selected);
    localStorage.setItem("kulongo_user_role", selected);
    setStep("login");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const emailHash = hashEmail(email);
    const passwordHash = hashPassword(password, email);
    const name = displayName || email.split("@")[0];

    try {
      if (isRegister) {
        if (password.length < 4) {
          setError("A senha deve ter pelo menos 4 caracteres.");
          setLoading(false);
          return;
        }

        if (actor) {
          const result = await (actor as any).registerPlatformUserWithPassword(
            emailHash,
            passwordHash,
            role!,
            name,
          );

          if (result && "emailTaken" in result) {
            setError("Este email já está registado.");
            setLoading(false);
            return;
          }

          // #ok — save session
          saveSession({ email, role: role!, displayName: name });
          window.location.reload();
        } else {
          // Actor not ready — save locally as fallback
          saveSession({ email, role: role!, displayName: name });
          window.location.reload();
        }
      } else {
        // Login
        if (actor) {
          const result = await (actor as any).loginPlatformUser(
            emailHash,
            passwordHash,
          );

          if (result && "ok" in result) {
            const { role: backendRole, displayName: backendName } = result.ok;
            saveSession({
              email,
              role: backendRole as Role,
              displayName: backendName,
            });
            window.location.reload();
          } else if (result && "err" in result) {
            setError(result.err || "Email ou senha incorretos.");
            setLoading(false);
          } else {
            setError("Erro ao entrar. Tenta novamente.");
            setLoading(false);
          }
        } else {
          // Actor unavailable — fall back to legacy localStorage check
          const legacyUsers: Array<{
            email: string;
            password: string;
            role: Role;
            displayName?: string;
            banned?: boolean;
          }> = [];
          try {
            const stored = localStorage.getItem("kulongo_users");
            if (stored) legacyUsers.push(...JSON.parse(stored));
          } catch {
            /* ignore */
          }

          const legacyUser = legacyUsers.find(
            (u) => u.email === email && u.password === password,
          );

          if (!legacyUser) {
            setError("Não foi possível conectar ao servidor. Tenta novamente.");
            setLoading(false);
            return;
          }

          if (legacyUser.banned) {
            setError("A tua conta foi suspensa. Contacta o suporte.");
            setLoading(false);
            return;
          }

          saveSession({
            email,
            role: legacyUser.role,
            displayName: legacyUser.displayName,
          });
          window.location.reload();
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Ocorreu um erro. Tenta novamente.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden"
      data-ocid="auth.page"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div
          className="absolute top-1/4 left-1/4 w-[200px] h-[200px] rounded-full bg-primary/5 blur-[80px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-10 pointer-events-none">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-full fill-primary"
          aria-hidden="true"
        >
          <path d="M0,60 C150,100 350,0 600,60 C850,120 1050,20 1200,60 L1200,120 L0,120 Z" />
        </svg>
      </div>

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

              <button
                type="button"
                onClick={() => handleRoleSelect("artista")}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card text-foreground font-medium hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                data-ocid="auth.artista.button"
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

              <button
                type="button"
                onClick={() => handleRoleSelect("ouvinte")}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card text-foreground font-medium hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                data-ocid="auth.ouvinte.button"
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
              className="w-full"
            >
              <div className="text-center mb-5">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {role === "ouvinte" ? (
                    <Headphones className="w-3.5 h-3.5" />
                  ) : (
                    <Mic2 className="w-3.5 h-3.5" />
                  )}
                  {role === "ouvinte" ? "Ouvinte" : "Artista"}
                </span>
              </div>

              <div className="flex rounded-lg overflow-hidden border border-border mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError("");
                  }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    !isRegister
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                  data-ocid="auth.login.tab"
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError("");
                  }}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    isRegister
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                  data-ocid="auth.register.tab"
                >
                  Registar
                </button>
              </div>

              {!actor && (
                <div className="flex items-center justify-center gap-2 mb-3 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />A conectar ao
                  servidor...
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {isRegister && role === "artista" && (
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="reg-name"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Nome artístico
                    </label>
                    <input
                      type="text"
                      id="reg-name"
                      placeholder="O teu nome de artista"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                      data-ocid="auth.name.input"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="auth-email"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="O teu email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                    data-ocid="auth.email.input"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="auth-password"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="A tua senha"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      required
                      className="w-full px-4 py-3 pr-11 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                      data-ocid="auth.password.input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p
                    className="text-xs text-destructive text-center"
                    data-ocid="auth.error_state"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                  data-ocid="auth.submit.button"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading
                    ? isRegister
                      ? "A criar conta..."
                      : "A entrar..."
                    : isRegister
                      ? "Criar Conta"
                      : "Entrar"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setStep("choose");
                  setError("");
                  setEmail("");
                  setPassword("");
                }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors pt-3"
                data-ocid="auth.back.button"
              >
                ← Voltar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

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
