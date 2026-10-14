"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDadosStore } from "@/lib/store";
import { novoId } from "@/lib/id";
import type { BancoMock, Perfil, Usuario, UsuarioId } from "@/types";

const PERFIS: { id: Perfil; label: string }[] = [
  { id: "atendente", label: "Atendente" },
  { id: "cozinha", label: "Cozinha" },
  { id: "gerente", label: "Gerente" },
  { id: "dona", label: "Dona" },
];

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? partes[0]?.[1] ?? "")).toUpperCase();
}

export function UsuarioForm({
  aberto,
  onOpenChange,
  banco,
  usuario,
  autorId,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  banco: BancoMock;
  usuario: Usuario | null;
  autorId: UsuarioId;
}) {
  const salvarUsuario = useDadosStore((s) => s.salvarUsuario);

  const [nome, setNome] = useState("");
  const [perfil, setPerfil] = useState<Perfil>("atendente");
  const [loja, setLoja] = useState<string>("loja-1");
  const [pin, setPin] = useState("");
  const [prefKey, setPrefKey] = useState("");

  const chave = aberto ? (usuario?.id ?? "novo") : "fechado";
  if (aberto && prefKey !== chave) {
    setPrefKey(chave);
    setNome(usuario?.nome ?? "");
    setPerfil(usuario?.perfil ?? "atendente");
    setLoja(usuario?.lojaId ?? "loja-1");
    setPin(usuario?.pin ?? "");
  }

  function salvar() {
    if (!nome.trim()) return toast.error("Informe o nome.");
    if (!/^\d{4}$/.test(pin)) return toast.error("O PIN deve ter 4 dígitos.");
    const jaExiste = banco.usuarios.some(
      (u) => u.pin === pin && u.id !== usuario?.id,
    );
    if (jaExiste) return toast.error("Esse PIN já está em uso.");

    const novo: Usuario = {
      id: usuario?.id ?? novoId("u"),
      nome: nome.trim(),
      perfil,
      pin,
      lojaId: perfil === "dona" ? null : (loja as Usuario["lojaId"]),
      ativo: usuario?.ativo ?? true,
      avatar: iniciais(nome),
    };
    salvarUsuario(novo, autorId);
    onOpenChange(false);
    toast.success(usuario ? "Usuário atualizado" : "Usuário cadastrado");
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {usuario ? "Editar usuário" : "Novo usuário"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="u-nome">Nome</Label>
            <Input id="u-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome e sobrenome" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Perfil</Label>
              <Select value={perfil} onValueChange={(v) => setPerfil((v as Perfil) ?? "atendente")} items={Object.fromEntries(PERFIS.map((p) => [p.id, p.label]))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERFIS.map((p) => (<SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Loja</Label>
              <Select
                value={perfil === "dona" ? "todas" : loja}
                onValueChange={(v) => setLoja(v ?? "loja-1")}
                items={{ todas: "Todas", ...Object.fromEntries(banco.lojas.map((l) => [l.id, l.nome.replace(/^Loja \d+\s*[—-]\s*/, "")])) }}
              >
                <SelectTrigger className="w-full" disabled={perfil === "dona"}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {perfil === "dona" && <SelectItem value="todas">Todas</SelectItem>}
                  {banco.lojas.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.nome.replace(/^Loja \d+\s*[—-]\s*/, "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-pin">PIN (4 dígitos)</Label>
            <Input
              id="u-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              className="tnum tracking-[0.3em]"
            />
          </div>
        </div>
        <Button onClick={salvar} className="mt-2 w-full bg-cereja text-white hover:bg-cereja-calda">
          {usuario ? "Salvar" : "Cadastrar"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
