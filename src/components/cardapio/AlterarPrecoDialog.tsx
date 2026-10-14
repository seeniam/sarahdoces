"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PinAutorizacao } from "@/components/pdv/PinAutorizacao";
import { useDadosStore } from "@/lib/store";
import { margem } from "@/lib/domain";
import { formatBRL, formatPorcentagem } from "@/lib/format";
import type { Produto, Usuario } from "@/types";

function corMargem(m: number): string {
  if (m >= 0.6) return "text-pistache";
  if (m >= 0.4) return "text-doce-de-leite";
  return "text-alerta";
}

export function AlterarPrecoDialog({
  produto,
  onClose,
}: {
  produto: Produto | null;
  onClose: () => void;
}) {
  const alterarPrecoProduto = useDadosStore((s) => s.alterarPrecoProduto);
  const [novo, setNovo] = useState("");
  const [prefId, setPrefId] = useState<string | null>(null);

  // Sincroniza o campo quando troca de produto (padrão de ajuste no render).
  if (produto && prefId !== produto.id) {
    setPrefId(produto.id);
    setNovo(String(produto.preco));
  }
  if (!produto && prefId !== null) setPrefId(null);

  const novoPreco = Number(novo) || 0;
  const margemAtual = produto ? margem(produto.preco, produto.custo) : 0;
  const margemNova = produto ? margem(novoPreco, produto.custo) : 0;

  function confirmar(autorizador: Usuario) {
    if (!produto) return;
    if (novoPreco <= 0) {
      toast.error("Informe um preço válido.");
      return;
    }
    if (novoPreco === produto.preco) {
      toast.info("O preço não mudou.");
      onClose();
      return;
    }
    alterarPrecoProduto({
      produtoId: produto.id,
      novoPreco: Number(novoPreco.toFixed(2)),
      autorizadorId: autorizador.id,
    });
    toast.success(`Preço de ${produto.nome} atualizado`, {
      description: `${formatBRL(produto.preco)} → ${formatBRL(novoPreco)} · por ${autorizador.nome}`,
    });
    onClose();
  }

  return (
    <PinAutorizacao
      aberto={produto !== null}
      onOpenChange={(v) => !v && onClose()}
      titulo="Alterar preço"
      descricao="Mudar preço é uma ação sensível — exige a gerente ou a Sarah e fica registrada."
      exigeMotivoTexto={false}
      confirmarHabilitado={novoPreco > 0}
      onAutorizado={(autorizador) => confirmar(autorizador)}
    >
      {produto && (
        <div className="space-y-3">
          <div className="rounded-[14px] border border-border bg-secondary/40 px-3 py-2 text-sm">
            <p className="font-medium text-foreground">{produto.nome}</p>
            <p className="text-xs text-muted-foreground">
              Custo (CMV): {formatBRL(produto.custo)}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="novo-preco">Novo preço</Label>
            <div className="flex items-center gap-2">
              <span className="text-lg text-muted-foreground">R$</span>
              <Input
                id="novo-preco"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={novo}
                onChange={(e) => setNovo(e.target.value)}
                className="h-12 text-right text-xl tnum"
              />
            </div>
          </div>
          {/* Impacto na margem */}
          <div className="flex items-center justify-between rounded-[14px] border border-border px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">Margem</span>
            <span className="inline-flex items-center gap-2 tnum">
              <span className={corMargem(margemAtual)}>{formatPorcentagem(margemAtual, 0)}</span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
              <span className={cn("font-semibold", corMargem(margemNova))}>
                {formatPorcentagem(margemNova, 0)}
              </span>
            </span>
          </div>
        </div>
      )}
    </PinAutorizacao>
  );
}
