"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  DoorClosed,
  DoorOpen,
  Wallet,
} from "lucide-react";
import { cn } from "cn";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EstadoVazio } from "@/components/shared/EstadoVazio";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FORMAS_CONTADAS, ROTULO_FORMA } from "@/lib/domain";
import { formatBRL, formatBRLSinalado, formatData, formatHora } from "@/lib/format";
import type { BancoMock, LojaId, SessaoCaixa } from "@/types";

export function ListaCaixas({
  banco,
  filtro,
  de,
  ate,
}: {
  banco: BancoMock;
  filtro: LojaId | "todas";
  de: Date;
  ate: Date;
}) {
  const [aberta, setAberta] = useState<SessaoCaixa | null>(null);

  const nomeUsuario = useMemo(
    () => new Map(banco.usuarios.map((u) => [u.id, u.nome])),
    [banco.usuarios],
  );
  const nomeLoja = (id: LojaId) =>
    banco.lojas.find((l) => l.id === id)?.nome.replace(/^Loja \d+\s*[—-]\s*/, "") ?? "";

  const sessoes = useMemo(() => {
    const deMs = de.getTime();
    const ateMs = ate.getTime();
    return banco.sessoesCaixa
      .filter((s) => {
        if (filtro !== "todas" && s.lojaId !== filtro) return false;
        const t = new Date(s.abertura).getTime();
        return t >= deMs && t <= ateMs;
      })
      .sort((a, b) => new Date(b.abertura).getTime() - new Date(a.abertura).getTime());
  }, [banco.sessoesCaixa, filtro, de, ate]);

  if (sessoes.length === 0) {
    return (
      <EstadoVazio
        titulo="Nenhuma sessão de caixa"
        descricao="Os fechamentos de caixa do período aparecem aqui, com o esperado × informado."
      />
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {sessoes.map((s) => {
          const fechado = Boolean(s.fechamento);
          const dif = s.diferenca ?? 0;
          const zerado = Math.abs(dif) < 0.005;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setAberta(s)}
                className="flex w-full items-center justify-between gap-3 rounded-[16px] border border-border bg-card p-4 text-left transition-colors hover:border-cereja/30"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full",
                      fechado ? "bg-secondary text-muted-foreground" : "bg-pistache/12 text-pistache",
                    )}
                  >
                    {fechado ? <DoorClosed className="size-4" /> : <DoorOpen className="size-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {nomeUsuario.get(s.usuarioId) ?? "—"}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        · {nomeLoja(s.lojaId)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatData(s.abertura)} · {formatHora(s.abertura)}
                      {s.fechamento ? ` → ${formatHora(s.fechamento)}` : " · em aberto"}
                    </p>
                  </div>
                </div>
                {fechado ? (
                  <StatusBadge variante={zerado ? "ok" : "critico"}>
                    {zerado ? "Caixa certo" : formatBRLSinalado(dif)}
                  </StatusBadge>
                ) : (
                  <StatusBadge variante="info">Aberto</StatusBadge>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <Sheet open={aberta !== null} onOpenChange={(v) => !v && setAberta(null)}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          {aberta && (
            <>
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle className="font-display text-xl">
                  Caixa de {nomeUsuario.get(aberta.usuarioId) ?? "—"}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {nomeLoja(aberta.lojaId)} · {formatData(aberta.abertura)}
                </p>
              </SheetHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {/* Linha do tempo */}
                <ol className="space-y-2.5">
                  <Evento
                    icone={<DoorOpen className="size-4" />}
                    titulo="Abertura"
                    hora={formatHora(aberta.abertura)}
                    detalhe={`Troco inicial ${formatBRL(aberta.valorInicial)}`}
                  />
                  {(aberta.suprimentos ?? []).map((su) => (
                    <Evento
                      key={su.id}
                      icone={<ArrowUpCircle className="size-4 text-pistache" />}
                      titulo="Suprimento"
                      hora={formatHora(su.data)}
                      detalhe={`${formatBRL(su.valor)} · ${su.motivo}`}
                    />
                  ))}
                  {aberta.sangrias.map((sa) => (
                    <Evento
                      key={sa.id}
                      icone={<ArrowDownCircle className="size-4 text-doce-de-leite" />}
                      titulo="Sangria"
                      hora={formatHora(sa.data)}
                      detalhe={`${formatBRL(sa.valor)} · ${sa.motivo}`}
                    />
                  ))}
                  {aberta.fechamento && (
                    <Evento
                      icone={<DoorClosed className="size-4" />}
                      titulo="Fechamento"
                      hora={formatHora(aberta.fechamento)}
                      detalhe="Conferência às cegas"
                    />
                  )}
                </ol>

                {/* Conferência por forma */}
                {aberta.fechamento && aberta.esperadoPorForma && aberta.diferencaPorForma && (
                  <div className="rounded-[16px] border border-border p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                      <Wallet className="size-4 text-muted-foreground" />
                      Conferência
                    </p>
                    <div className="space-y-2 text-sm">
                      {FORMAS_CONTADAS.map((f) => {
                        const dif = aberta.diferencaPorForma![f];
                        const zerado = Math.abs(dif) < 0.005;
                        return (
                          <div key={f} className="flex items-center justify-between">
                            <span className="text-muted-foreground">{ROTULO_FORMA[f]}</span>
                            <span className="flex items-center gap-3 tnum">
                              <span className="text-muted-foreground">
                                {formatBRL(aberta.esperadoPorForma![f])}
                              </span>
                              <span className={cn(zerado ? "text-pistache" : "text-alerta")}>
                                {zerado ? "ok" : formatBRLSinalado(dif)}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-between border-t border-border pt-2 font-semibold">
                        <span>Diferença total</span>
                        <span
                          className={cn(
                            "tnum",
                            Math.abs(aberta.diferenca ?? 0) < 0.005 ? "text-pistache" : "text-alerta",
                          )}
                        >
                          {Math.abs(aberta.diferenca ?? 0) < 0.005
                            ? formatBRL(0)
                            : formatBRLSinalado(aberta.diferenca ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Evento({
  icone,
  titulo,
  hora,
  detalhe,
}: {
  icone: React.ReactNode;
  titulo: string;
  hora: string;
  detalhe: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground">
        {icone}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{titulo}</p>
          <p className="shrink-0 text-xs text-muted-foreground">{hora}</p>
        </div>
        <p className="text-xs text-muted-foreground">{detalhe}</p>
      </div>
    </li>
  );
}
