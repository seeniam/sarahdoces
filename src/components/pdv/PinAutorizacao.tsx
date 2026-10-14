"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PinPad } from "@/components/auth/PinPad";
import { useDadosStore } from "@/lib/store";
import { podeAutorizar } from "@/lib/domain";
import type { Usuario } from "@/types";

/**
 * Autorização de ação sensível: só o PIN de Gerente ou Dona autoriza (o PIN de
 * atendente é recusado). Motivo obrigatório. Tudo vira EventoAuditoria no caller.
 */
export function PinAutorizacao({
  aberto,
  onOpenChange,
  titulo,
  descricao,
  onAutorizado,
  children,
  confirmarHabilitado = true,
  exigeMotivoTexto = true,
}: {
  aberto: boolean;
  onOpenChange: (o: boolean) => void;
  titulo: string;
  descricao: string;
  onAutorizado: (autorizador: Usuario, motivo: string) => void;
  /** Conteúdo extra acima do motivo (ex.: escolha do valor do desconto). */
  children?: React.ReactNode;
  /** Condição extra para liberar o botão "Autorizar". */
  confirmarHabilitado?: boolean;
  /**
   * Mostra a caixa de texto do motivo (padrão). Quando `false`, o motivo vem
   * de botões no `children` e o caller o passa já resolvido em `onAutorizado`.
   */
  exigeMotivoTexto?: boolean;
}) {
  const [pin, setPin] = useState("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState(false);
  // Valida contra a equipe ATUAL (a /equipe pode ter editado PINs/usuários) e
  // só aceita conta ativa.
  const usuarios = useDadosStore((s) => s.usuarios);
  const resolver = (v: string) =>
    usuarios.find((u) => u.pin === v && u.ativo && podeAutorizar(u.perfil)) ?? null;

  const autorizador = pin.length === 4 ? resolver(pin) : null;

  function aoDigitar(v: string) {
    setPin(v);
    setErro(false);
    if (v.length === 4 && !resolver(v)) {
      setErro(true);
      setTimeout(() => {
        setErro(false);
        setPin("");
      }, 650);
    }
  }

  function limpar() {
    setPin("");
    setMotivo("");
    setErro(false);
  }

  function confirmar() {
    const motivoOk = !exigeMotivoTexto || motivo.trim();
    if (autorizador && motivoOk && confirmarHabilitado) {
      onAutorizado(autorizador, motivo.trim());
      limpar();
      onOpenChange(false);
    }
  }

  return (
    <Dialog
      open={aberto}
      onOpenChange={(o) => {
        if (!o) limpar();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>

        {children}

        {exigeMotivoTexto && (
          <Textarea
            placeholder="Motivo (obrigatório)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="min-h-16"
          />
        )}

        <div className="flex flex-col items-center gap-3 pt-1">
          <PinPad value={pin} onChange={aoDigitar} erro={erro} />
          {autorizador ? (
            <p className="text-sm font-medium text-pistache">
              Autorizado por {autorizador.nome}
            </p>
          ) : erro ? (
            <p className="text-sm font-medium text-alerta">
              PIN sem permissão. Peça para a gerente ou a Sarah.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              PIN da gerente ou da Sarah
            </p>
          )}
        </div>

        <Button
          size="lg"
          disabled={
            !autorizador ||
            (exigeMotivoTexto && !motivo.trim()) ||
            !confirmarHabilitado
          }
          onClick={confirmar}
        >
          Autorizar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
