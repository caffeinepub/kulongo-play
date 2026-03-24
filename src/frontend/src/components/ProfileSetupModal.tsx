import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Headphones, Loader2, Mic2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveProfile } from "../hooks/useQueries";

type Step = "role" | "form";

interface Props {
  open: boolean;
  onComplete: () => void;
}

export default function ProfileSetupModal({ open, onComplete }: Props) {
  const [step, setStep] = useState<Step>("role");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const save = useSaveProfile();

  const handleRoleSelect = (selected: "artista" | "ouvinte") => {
    if (selected === "ouvinte") {
      // Listeners skip profile setup entirely
      localStorage.setItem("kulongo_user_role", "ouvinte");
      onComplete();
      return;
    }
    setStep("form");
  };

  const handleBack = () => {
    setStep("role");
  };

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      toast.error("Por favor insere o teu nome");
      return;
    }
    try {
      await save.mutateAsync({
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
      });
      localStorage.setItem("kulongo_user_role", "artista");
      toast.success("Perfil criado com sucesso!");
      onComplete();
    } catch {
      toast.error("Erro ao criar perfil");
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="bg-card border-border max-w-md p-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        data-ocid="profile_setup.dialog"
      >
        <AnimatePresence mode="wait">
          {step === "role" ? (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="p-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-foreground text-xl font-bold mb-1">
                  Bem-vindo ao Kulongo Play!
                </h2>
                <p className="text-muted-foreground text-sm">
                  Como queres usar o Kulongo Play?
                </p>
              </div>

              <div
                className="grid grid-cols-2 gap-4"
                data-ocid="profile_setup.role.panel"
              >
                <button
                  type="button"
                  onClick={() => handleRoleSelect("artista")}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border bg-muted/40 hover:border-primary hover:bg-primary/10 transition-all duration-200 cursor-pointer"
                  data-ocid="profile_setup.artista.button"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/15 group-hover:bg-primary/25 flex items-center justify-center transition-colors">
                    <Mic2 className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-foreground font-bold text-base">
                      Artista
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5 leading-snug">
                      Carrega e partilha a tua música
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect("ouvinte")}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-border bg-muted/40 hover:border-primary hover:bg-primary/10 transition-all duration-200 cursor-pointer"
                  data-ocid="profile_setup.ouvinte.button"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/15 group-hover:bg-primary/25 flex items-center justify-center transition-colors">
                    <Headphones className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-foreground font-bold text-base">
                      Ouvinte
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5 leading-snug">
                      Descobre e ouve música angolana
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-ocid="profile_setup.back_button"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-foreground font-bold text-lg leading-tight">
                    Perfil de Artista
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    Conta-nos sobre a tua música
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="display-name" className="text-foreground">
                    Nome artístico *
                  </Label>
                  <Input
                    id="display-name"
                    placeholder="Ex: DJ Marcelino, Ana Firmino..."
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                    data-ocid="profile_setup.input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bio" className="text-foreground">
                    Bio (opcional)
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Fala um pouco sobre ti e a tua música..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
                    rows={3}
                    data-ocid="profile_setup.textarea"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={save.isPending}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  data-ocid="profile_setup.submit_button"
                >
                  {save.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {save.isPending ? "A criar perfil..." : "Começar a partilhar"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
