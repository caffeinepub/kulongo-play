import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Music } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveProfile } from "../hooks/useQueries";

interface Props {
  open: boolean;
  onComplete: () => void;
}

export default function ProfileSetupModal({ open, onComplete }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const save = useSaveProfile();

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
      toast.success("Perfil criado com sucesso!");
      onComplete();
    } catch {
      toast.error("Erro ao criar perfil");
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="bg-card border-border max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        data-ocid="profile_setup.dialog"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Music className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-foreground text-xl">
              Bem-vindo ao Kulongo Play!
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            Cria o teu perfil de artista para começar a partilhar música
            angolana.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
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
              placeholder="Fala um pouco sobre ti..."
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
            {save.isPending ? "A criar perfil..." : "Começar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
