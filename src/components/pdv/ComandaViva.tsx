"use client";

import { useState, type CSSProperties } from "react";
import { Minus, Plus, Send, Tag, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumeroHeroi } from "@/components/shared/NumeroHeroi";
import { ItemSheet } from "./ItemSheet";
import { useComandaStore } from "@/lib/store";
import { PRODUTO_POR_ID } from "@/lib/mock/data";
import { formatBRL } from "@/lib/format";
import type { TipoComanda } from "@/types";

const TIPOS: { id: TipoComanda; label: string; placeholder: string; erro: string }[] = [
  { id: "mesa", label: "Mesa", placeholder: "Nº da mesa", erro: "Informe o número da mesa" },
  { id: "balcao", label: "Balcão", placeholder: "Nome do cliente", erro: "Informe o nome do cliente" },
  { id: "viagem", label: "Viagem", placeholder: "Nome", erro: "Informe o nome" },
];

// Força aparência clara ("papel"), mesmo no tema cacau (direção de arte §6).
const PAPEL = {
  "--background": "#ffffff",
  "--foreground": "#2b1b18",
  "--card": "#ffffff",
  "--card-foreground": "#2b1b18",
  "--muted": "#edeff2",
  "--muted-foreground": "#6b5f5b",
  "--border": "rgb(43 27 24 / 0.12)",
  "--input": "rgb(43 27 24 / 0.16)",
  "--ring": "#9e1b32",
  "--primary": "#9e1b32",
  "--primary-foreground": "#ffffff",
  "--accent": "#f6dddf",
  "--accent-foreground": "#6f0f22",
  "--secondary": "#eceef1",
  "--secondary-foreground": "#2b1b18",
  "--acucar": "#f6dddf",
  "--cereja": "#9e1b32",
  "--cereja-calda": "#6f0f22",
  "--pistache": "#5e7f36",
} as CSSProperties;

const INPUT_ID = "comanda-identificador";

export function ComandaViva({
  onEnviar,
  onPedirDesconto,
}: {
  onEnviar: () => void;
  onPedirDesconto: () => void;
}) {
  const {
    tipo,
    identificador,
    itens,
    desconto,
    cortesia,
    autorizadoPorNome,
    setTipo,
    setIdentificador,
    incluir,
    reduzir,
    remover,
    atualizarItem,
  } = useComandaStore();

  const [editando, setEditando] = useState<number | null>(null);
  const [erroId, setErroId] = useState(false);

  const subtotal = itens.reduce((s, it) => s + it.precoUnit * it.qtd, 0);
  const total = Math.max(0, subtotal - desconto);
  const tipoAtual = TIPOS.find((t) => t.id === tipo)!;

  function tentarEnviar() {
    if (!identificador.trim()) {
      setErroId(true);
      document.getElementById(INPUT_ID)?.focus();
      return;
    }
    onEnviar();
  }

  return (
    <div
      style={PAPEL}
      className="serrilha-baixo flex h-full flex-col bg-white pb-6 text-[#2b1b18] shadow-comanda"
    >
      {/* Cabeçalho: tipo + identificador */}
      <div className="space-y-2 border-b border-dashed border-border p-4">
        <div className="grid grid-cols-3 gap-1.5">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTipo(t.id)}
              className={cn(
                "rounded-[10px] border py-2 text-sm font-medium transition-colors",
                tipo === t.id
                  ? "border-cereja bg-acucar/60 text-cereja"
                  : "border-border bg-white text-muted-foreground hover:bg-muted",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Input
          id={INPUT_ID}
          value={identificador}
          onChange={(e) => {
            setIdentificador(e.target.value);
            if (e.target.value.trim()) setErroId(false);
          }}
          placeholder={tipoAtual.placeholder}
          aria-invalid={erroId}
          className="h-10 bg-white"
        />
        {erroId && (
          <p className="text-xs font-medium text-alerta">{tipoAtual.erro}</p>
        )}
      </div>

      {/* Itens */}
      <div className="flex-1 overflow-y-auto px-4">
        {itens.length === 0 ? (
          <p className="px-2 py-12 text-center text-sm text-muted-foreground">
            Toque nos produtos para montar a comanda.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {itens.map((item, i) => {
              const produto = PRODUTO_POR_ID.get(item.produtoId);
              if (!produto) return null;
              return (
                <li key={i} className="py-3">
                  <div className="flex items-start gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label="Menos"
                        onClick={() => reduzir(i)}
                        className="grid size-8 place-items-center rounded-full border border-border text-[#2b1b18] transition-colors hover:bg-muted"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-5 text-center font-display text-base tnum">
                        {item.qtd}
                      </span>
                      <button
                        type="button"
                        aria-label="Mais"
                        onClick={() => incluir(i)}
                        className="grid size-8 place-items-center rounded-full border border-border text-[#2b1b18] transition-colors hover:bg-muted"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditando(i)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="text-sm font-semibold">{produto.nome}</p>
                      {item.adicionais.map((a) => (
                        <p key={a.id} className="text-xs text-muted-foreground">
                          + {a.nome}
                        </p>
                      ))}
                      {item.obs && (
                        <p className="text-xs font-semibold text-cereja-calda">
                          obs: {item.obs}
                        </p>
                      )}
                    </button>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm tnum">
                        {formatBRL(item.precoUnit * item.qtd)}
                      </span>
                      <button
                        type="button"
                        aria-label="Remover item"
                        onClick={() => remover(i)}
                        className="text-muted-foreground transition-colors hover:text-alerta"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Rodapé: desconto + total + enviar */}
      <div className="space-y-3 px-4 pt-3">
        {desconto > 0 && (
          <div className="flex items-start justify-between gap-2 text-sm text-pistache">
            <span className="min-w-0">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Tag className="size-3.5" />
                {cortesia ? "Cortesia" : "Desconto"}
              </span>
              {autorizadoPorNome && (
                <span className="block text-xs text-muted-foreground">
                  autorizado por {autorizadoPorNome}
                </span>
              )}
            </span>
            <span className="tnum">−{formatBRL(desconto)}</span>
          </div>
        )}

        <div className="flex items-end justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <NumeroHeroi valor={total} tamanho="medio" />
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-2">
          <Button
            variant="outline"
            size="lg"
            className="h-12 border-border bg-white"
            disabled={itens.length === 0}
            onClick={onPedirDesconto}
          >
            <Tag className="size-4" />
            Desconto
          </Button>
          <Button
            size="lg"
            className="h-12 text-base"
            disabled={itens.length === 0}
            onClick={tentarEnviar}
          >
            <Send className="size-4" />
            Enviar para cozinha
          </Button>
        </div>
      </div>

      {editando !== null && itens[editando] && (
        <ItemSheet
          key={editando}
          aberto
          onOpenChange={(o) => !o && setEditando(null)}
          produto={PRODUTO_POR_ID.get(itens[editando].produtoId)!}
          item={itens[editando]}
          onSalvar={(adicionais, obs) =>
            atualizarItem(editando, { adicionais, obs })
          }
        />
      )}
    </div>
  );
}
