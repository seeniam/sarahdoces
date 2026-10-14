"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstadoVazio } from "@/components/shared/EstadoVazio";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ComandaDetalhe } from "./ComandaDetalhe";
import { ImpressaoComanda } from "@/components/pdv/ImpressaoComanda";
import {
  ROTULO_STATUS_COMANDA,
  ROTULO_TIPO_COMANDA,
  VARIANTE_STATUS_COMANDA,
} from "./rotulos";
import { useDadosStore, useHidratado } from "@/lib/store";
import type { DadosState } from "@/lib/store";
import { formatBRL, formatData, formatHora } from "@/lib/format";
import type {
  Comanda,
  FormaPagamento,
  LojaId,
  StatusComanda,
  TipoComanda,
} from "@/types";

const DIA_MS = 86400000;
const FORMA_LABEL: Record<FormaPagamento, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  debito: "Débito",
  credito: "Crédito",
};

export function ComandasClient() {
  const hidratado = useHidratado();
  const banco = useDadosStore() as DadosState;

  const [busca, setBusca] = useState("");
  const [fLoja, setFLoja] = useState<LojaId | "todas">("todas");
  const [fStatus, setFStatus] = useState<StatusComanda | "todos">("todos");
  const [fAtendente, setFAtendente] = useState<string>("todos");
  const [fForma, setFForma] = useState<FormaPagamento | "todas">("todas");
  const [fTipo, setFTipo] = useState<TipoComanda | "todos">("todos");
  const [fPeriodo, setFPeriodo] = useState<"7" | "30" | "tudo">("7");
  const [aberta, setAberta] = useState<Comanda | null>(null);
  const [impressao, setImpressao] = useState<{ comanda: Comanda; via: "cliente" | "cozinha" } | null>(null);
  const [agora] = useState(() => Date.now());

  const formaPorComanda = useMemo(() => {
    const m = new Map<string, FormaPagamento>();
    for (const p of banco.pagamentos) if (!m.has(p.comandaId)) m.set(p.comandaId, p.forma);
    return m;
  }, [banco.pagamentos]);

  const atendentes = useMemo(
    () => banco.usuarios.filter((u) => u.perfil === "atendente" || u.perfil === "gerente"),
    [banco.usuarios],
  );
  const nomeUsuario = (id?: string) => banco.usuarios.find((u) => u.id === id)?.nome ?? "—";

  const comandas = useMemo(() => {
    const q = busca.trim();
    const corte = fPeriodo === "tudo" ? 0 : agora - Number(fPeriodo) * DIA_MS;
    return banco.comandas
      .filter((c) => {
        if (new Date(c.criadaEm).getTime() < corte) return false;
        if (fLoja !== "todas" && c.lojaId !== fLoja) return false;
        if (fStatus !== "todos" && c.status !== fStatus) return false;
        if (fAtendente !== "todos" && c.atendenteId !== fAtendente) return false;
        if (fTipo !== "todos" && c.tipo !== fTipo) return false;
        if (fForma !== "todas" && formaPorComanda.get(c.id) !== fForma) return false;
        if (q && !String(c.numero).includes(q)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime());
  }, [banco.comandas, busca, fLoja, fStatus, fAtendente, fForma, fTipo, fPeriodo, formaPorComanda, agora]);

  function totalComanda(c: Comanda) {
    return (
      c.itens.filter((it) => !it.cancelado).reduce((s, it) => s + it.precoUnit * it.qtd, 0) -
      (c.desconto ?? 0)
    );
  }

  if (!hidratado) return <div className="h-64 animate-pulse rounded-[20px] bg-muted" />;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl leading-tight">Comandas</h1>
        <p className="text-sm text-muted-foreground">
          Histórico de pedidos com a linha do tempo de cada um.
        </p>
      </header>

      {/* Busca + filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            inputMode="numeric"
            placeholder="Buscar por número da comanda…"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Select value={fPeriodo} onValueChange={(v) => setFPeriodo((v as "7" | "30" | "tudo") ?? "7")} items={{ "7": "7 dias", "30": "30 dias", tudo: "Tudo" }}>
            <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="tudo">Tudo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fStatus} onValueChange={(v) => setFStatus((v as StatusComanda) ?? "todos")} items={{ todos: "Status", ...ROTULO_STATUS_COMANDA }}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {(Object.keys(ROTULO_STATUS_COMANDA) as StatusComanda[]).map((st) => (
                <SelectItem key={st} value={st}>{ROTULO_STATUS_COMANDA[st]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fAtendente} onValueChange={(v) => setFAtendente(v ?? "todos")} items={{ todos: "Atendente", ...Object.fromEntries(atendentes.map((u) => [u.id, u.nome])) }}>
            <SelectTrigger><SelectValue placeholder="Atendente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {atendentes.map((u) => (<SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={fTipo} onValueChange={(v) => setFTipo((v as TipoComanda) ?? "todos")} items={{ todos: "Tipo", ...ROTULO_TIPO_COMANDA }}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {(Object.keys(ROTULO_TIPO_COMANDA) as TipoComanda[]).map((t) => (
                <SelectItem key={t} value={t}>{ROTULO_TIPO_COMANDA[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fForma} onValueChange={(v) => setFForma((v as FormaPagamento) ?? "todas")} items={{ todas: "Pagamento", ...FORMA_LABEL }}>
            <SelectTrigger><SelectValue placeholder="Pagamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Pagamento</SelectItem>
              {(Object.keys(FORMA_LABEL) as FormaPagamento[]).map((f) => (
                <SelectItem key={f} value={f}>{FORMA_LABEL[f]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fLoja} onValueChange={(v) => setFLoja((v as LojaId) ?? "todas")} items={{ todas: "Loja", ...Object.fromEntries(banco.lojas.map((l) => [l.id, l.nome])) }}>
            <SelectTrigger><SelectValue placeholder="Loja" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as lojas</SelectItem>
              {banco.lojas.map((l) => (<SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {comandas.length} comanda{comandas.length === 1 ? "" : "s"}
      </p>

      {comandas.length === 0 ? (
        <EstadoVazio titulo="Nenhuma comanda" descricao="Ajuste os filtros ou o período para ver o histórico." />
      ) : (
        <ul className="space-y-2">
          {comandas.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setAberta(c)}
                className="flex w-full items-center justify-between gap-3 rounded-[16px] border border-border bg-card p-4 text-left transition-colors hover:border-cereja/30"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    #{c.numero}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      · {ROTULO_TIPO_COMANDA[c.tipo]} {c.identificador}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatData(c.criadaEm)} · {formatHora(c.criadaEm)} · {nomeUsuario(c.atendenteId)}
                    {formaPorComanda.get(c.id) ? ` · ${FORMA_LABEL[formaPorComanda.get(c.id)!]}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="tnum font-medium">{formatBRL(totalComanda(c))}</span>
                  <StatusBadge variante={VARIANTE_STATUS_COMANDA[c.status]}>
                    {ROTULO_STATUS_COMANDA[c.status]}
                  </StatusBadge>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <ComandaDetalhe
        comanda={aberta}
        banco={banco}
        onClose={() => setAberta(null)}
        onReimprimir={(comanda, via) => setImpressao({ comanda, via })}
      />

      {impressao && (
        <ImpressaoComanda
          comanda={impressao.comanda}
          atendenteNome={nomeUsuario(impressao.comanda.atendenteId)}
          via={impressao.via}
          onNova={() => setImpressao(null)}
        />
      )}
    </div>
  );
}
