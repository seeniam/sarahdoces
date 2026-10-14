"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle, LockKeyhole, MoreHorizontal } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PinAutorizacao } from "./PinAutorizacao";
import { useDadosStore } from "@/lib/store";
import { formatBRL, formatHora } from "@/lib/format";
import type { SessaoCaixa, Usuario } from "@/types";

export function CaixaControle({
  sessao,
  onFecharCaixa,
  className,
}: {
  sessao: SessaoCaixa;
  /** Abre a folha de fechamento (gerida pelo PDV, para sobreviver ao fechar). */
  onFecharCaixa: () => void;
  className?: string;
}) {
  const registrarSangria = useDadosStore((s) => s.registrarSangria);
  const registrarSuprimento = useDadosStore((s) => s.registrarSuprimento);

  const [sangriaAberta, setSangriaAberta] = useState(false);
  const [suprimentoAberto, setSuprimentoAberto] = useState(false);
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");

  function abrirSangria() {
    setValor("");
    setSangriaAberta(true);
  }
  function abrirSuprimento() {
    setValor("");
    setMotivo("");
    setSuprimentoAberto(true);
  }

  function confirmarSangria(autorizador: Usuario, motivoTexto: string) {
    const v = Number(valor);
    if (v > 0) {
      registrarSangria({
        sessaoId: sessao.id,
        valor: v,
        motivo: motivoTexto || "Retirada",
        autorizadorId: autorizador.id,
      });
      toast.success(`Sangria de ${formatBRL(v)} registrada`, {
        description: `Autorizada por ${autorizador.nome}`,
      });
    }
  }

  function confirmarSuprimento() {
    const v = Number(valor);
    if (v <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    registrarSuprimento({ sessaoId: sessao.id, valor: v, motivo: motivo.trim() || "Troco" });
    setSuprimentoAberto(false);
    toast.success(`Suprimento de ${formatBRL(v)} registrado`);
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-[16px] border border-border bg-card px-3.5 py-2.5",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pistache/12 text-pistache">
          <LockKeyhole className="size-4" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-sm font-medium text-foreground">Caixa aberto</p>
          <p className="truncate text-xs text-muted-foreground">
            desde {formatHora(sessao.abertura)} · troco {formatBRL(sessao.valorInicial)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          size="sm"
          onClick={onFecharCaixa}
          className="bg-cereja text-white hover:bg-cereja-calda"
        >
          Fechar caixa
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="icon-sm" aria-label="Mais ações do caixa" />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={abrirSuprimento}>
              <ArrowUpCircle className="size-4" />
              Suprimento (entrada)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={abrirSangria}>
              <ArrowDownCircle className="size-4" />
              Sangria (retirada)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sangria (PIN de gerente) */}
      <PinAutorizacao
        aberto={sangriaAberta}
        onOpenChange={setSangriaAberta}
        titulo="Sangria (retirada do caixa)"
        descricao="Retirar dinheiro do caixa exige a gerente ou a Sarah."
        confirmarHabilitado={Number(valor) > 0}
        onAutorizado={confirmarSangria}
      >
        <div className="space-y-1.5">
          <Label htmlFor="sangria-valor">Valor da retirada</Label>
          <div className="flex items-center gap-2">
            <span className="text-lg text-muted-foreground">R$</span>
            <Input
              id="sangria-valor"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="h-12 text-right text-xl tnum"
            />
          </div>
        </div>
      </PinAutorizacao>

      {/* Suprimento (sem PIN) */}
      <Dialog open={suprimentoAberto} onOpenChange={setSuprimentoAberto}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Suprimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="supr-valor">Valor que entrou no caixa</Label>
              <div className="flex items-center gap-2">
                <span className="text-lg text-muted-foreground">R$</span>
                <Input
                  id="supr-valor"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  className="h-12 text-right text-xl tnum"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supr-motivo">Motivo</Label>
              <Input
                id="supr-motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Troco para o turno"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={confirmarSuprimento}
              className="w-full bg-cereja text-white hover:bg-cereja-calda"
            >
              Registrar suprimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
