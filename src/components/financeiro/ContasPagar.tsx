"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Check, Plus } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstadoVazio } from "@/components/shared/EstadoVazio";
import { useDadosStore } from "@/lib/store";
import {
  ROTULO_CATEGORIA_DESPESA,
  ROTULO_STATUS_CONTA,
  statusConta,
  type StatusConta,
} from "@/lib/domain";
import { novoId } from "@/lib/id";
import { formatBRL, formatData } from "@/lib/format";
import type { CategoriaDespesa, Despesa, LojaId } from "@/types";

const ORDEM_STATUS: Record<StatusConta, number> = {
  vencida: 0,
  vence_em_breve: 1,
  a_vencer: 2,
  paga: 3,
};
const COR_STATUS: Record<StatusConta, string> = {
  vencida: "bg-alerta",
  vence_em_breve: "bg-doce-de-leite",
  a_vencer: "bg-muted-foreground",
  paga: "bg-pistache",
};
const COR_STATUS_TEXTO: Record<StatusConta, string> = {
  vencida: "text-alerta",
  vence_em_breve: "text-doce-de-leite",
  a_vencer: "text-muted-foreground",
  paga: "text-pistache",
};

const CATEGORIAS: CategoriaDespesa[] = [
  "aluguel", "salarios", "energia", "agua", "gas",
  "internet", "marketing", "manutencao", "impostos", "outros",
];

export function ContasPagar({
  filtro,
  agora,
}: {
  filtro: LojaId | "todas";
  agora: Date;
}) {
  const banco = useDadosStore();
  const marcarDespesaPaga = useDadosStore((s) => s.marcarDespesaPaga);
  const adicionarDespesa = useDadosStore((s) => s.adicionarDespesa);

  const [novaAberta, setNovaAberta] = useState(false);
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState<CategoriaDespesa>("outros");
  const [vencimento, setVencimento] = useState("");

  const contas = useMemo(() => {
    return banco.despesas
      .filter((d) => filtro === "todas" || !d.lojaId || d.lojaId === filtro)
      .map((d) => ({ d, status: statusConta(d, agora) }))
      .sort((a, b) => {
        const o = ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status];
        if (o !== 0) return o;
        return new Date(a.d.vencimento).getTime() - new Date(b.d.vencimento).getTime();
      });
  }, [banco.despesas, filtro, agora]);

  const totais = useMemo(() => {
    let aPagar = 0;
    let vencido = 0;
    let pago = 0;
    for (const { d, status } of contas) {
      if (status === "paga") {
        // "Pago no mês": só o que foi pago no mês corrente.
        if (
          d.pagoEm &&
          new Date(d.pagoEm).getFullYear() === agora.getFullYear() &&
          new Date(d.pagoEm).getMonth() === agora.getMonth()
        ) {
          pago += d.valor;
        }
      } else {
        aPagar += d.valor;
        if (status === "vencida") vencido += d.valor;
      }
    }
    return { aPagar, vencido, pago };
  }, [contas, agora]);

  function salvarNova() {
    const v = Number(valor);
    if (!desc.trim() || v <= 0 || !vencimento) {
      toast.error("Preencha descrição, valor e vencimento.");
      return;
    }
    const despesa: Despesa = {
      id: novoId("desp"),
      descricao: desc.trim(),
      categoria,
      valor: v,
      vencimento: new Date(`${vencimento}T00:00:00-03:00`).toISOString(),
      ...(filtro !== "todas" ? { lojaId: filtro } : {}),
    };
    adicionarDespesa(despesa);
    setNovaAberta(false);
    setDesc("");
    setValor("");
    setVencimento("");
    setCategoria("outros");
    toast.success("Conta adicionada");
  }

  return (
    <div className="space-y-4">
      {/* Totais */}
      <div className="grid grid-cols-3 gap-3">
        <Totais rotulo="A pagar" valor={totais.aPagar} />
        <Totais rotulo="Vencido" valor={totais.vencido} classe="text-alerta" />
        <Totais rotulo="Pago no mês" valor={totais.pago} classe="text-pistache" />
      </div>

      <Button onClick={() => setNovaAberta(true)} className="bg-cereja text-white hover:bg-cereja-calda">
        <Plus className="size-4" />
        Nova conta
      </Button>

      {contas.length === 0 ? (
        <EstadoVazio titulo="Nenhuma conta" descricao="As contas a pagar do mês aparecem aqui." />
      ) : (
        <ul className="space-y-2">
          {contas.map(({ d, status }) => (
            <li
              key={d.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-[16px] border bg-card p-4",
                status === "vencida" ? "border-alerta/30" : "border-border",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className={cn("size-2.5 shrink-0 rounded-full", COR_STATUS[status])} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{d.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROTULO_CATEGORIA_DESPESA[d.categoria] ?? d.categoria} · vence{" "}
                    {formatData(d.vencimento)}
                    {" · "}
                    <span className={COR_STATUS_TEXTO[status]}>{ROTULO_STATUS_CONTA[status]}</span>
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="tnum font-medium">{formatBRL(d.valor)}</span>
                {status !== "paga" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      marcarDespesaPaga(d.id);
                      toast.success(`"${d.descricao}" marcada como paga`);
                    }}
                  >
                    <Check className="size-4" />
                    Pagar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={novaAberta} onOpenChange={setNovaAberta}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Nova conta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="conta-desc">Descrição</Label>
              <Input id="conta-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex.: Conta de luz" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="conta-valor">Valor</Label>
                <Input
                  id="conta-valor"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  className="tnum"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="conta-venc">Vencimento</Label>
                <Input
                  id="conta-venc"
                  type="date"
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={categoria}
                onValueChange={(v) => setCategoria((v as CategoriaDespesa) ?? "outros")}
                items={Object.fromEntries(CATEGORIAS.map((c) => [c, ROTULO_CATEGORIA_DESPESA[c]]))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {ROTULO_CATEGORIA_DESPESA[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={salvarNova} className="w-full bg-cereja text-white hover:bg-cereja-calda">
              <CalendarClock className="size-4" />
              Adicionar conta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Totais({ rotulo, valor, classe }: { rotulo: string; valor: number; classe?: string }) {
  return (
    <div className="rounded-[16px] border border-border bg-card p-3.5">
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className={cn("mt-1 font-display text-lg tnum sm:text-xl", classe)}>{formatBRL(valor)}</p>
    </div>
  );
}
