"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Info, Pencil, Plus, UserMinus } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EstadoVazio } from "@/components/shared/EstadoVazio";
import { EventoLinha } from "@/components/auditoria/EventoLinha";
import { EventoDetalhe } from "@/components/auditoria/EventoDetalhe";
import { UsuarioForm } from "./UsuarioForm";
import { useDadosStore, useSessaoStore, useHidratado } from "@/lib/store";
import type { DadosState } from "@/lib/store";
import { pontosDeAtencao } from "@/lib/domain";
import { formatBRL } from "@/lib/format";
import type { EventoAuditoria, Perfil, Usuario } from "@/types";

const ROTULO_PERFIL: Record<Perfil, string> = {
  dona: "Dona",
  gerente: "Gerente",
  atendente: "Atendente",
  cozinha: "Cozinha",
};

const OBSERVACAO_FIXA =
  "Padrões fora da média indicam onde conversar e acompanhar, não comprovam irregularidade.";

export function EquipeClient() {
  const hidratado = useHidratado();
  const banco = useDadosStore() as DadosState;
  const desativarUsuario = useDadosStore((s) => s.desativarUsuario);
  const usuarioId = useSessaoStore((s) => s.usuarioId);

  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [desativar, setDesativar] = useState<Usuario | null>(null);
  const [evento, setEvento] = useState<EventoAuditoria | null>(null);
  const [agora] = useState(() => new Date());

  const usuarios = useMemo(
    () => [...banco.usuarios].sort((a, b) => Number(b.ativo) - Number(a.ativo)),
    [banco.usuarios],
  );
  const nomeLoja = (id: string | null) =>
    id ? (banco.lojas.find((l) => l.id === id)?.nome.replace(/^Loja \d+\s*[—-]\s*/, "") ?? "") : "Todas";

  function abrirNovo() {
    setEditando(null);
    setFormAberto(true);
  }

  if (!hidratado) return <div className="h-64 animate-pulse rounded-[20px] bg-muted" />;

  const pessoa = selecionado ? banco.usuarios.find((u) => u.id === selecionado) : null;

  if (pessoa) {
    return (
      <PessoaView
        pessoa={pessoa}
        banco={banco}
        agora={agora}
        nomeLoja={nomeLoja}
        onVoltar={() => setSelecionado(null)}
        onEditar={() => {
          setEditando(pessoa);
          setFormAberto(true);
        }}
        onDesativar={() => setDesativar(pessoa)}
        onAbrirEvento={setEvento}
        formAberto={formAberto}
        setFormAberto={setFormAberto}
        editando={editando}
        autorId={usuarioId ?? "u-sarah"}
        evento={evento}
        onCloseEvento={() => setEvento(null)}
        desativar={desativar}
        onCloseDesativar={() => setDesativar(null)}
        confirmarDesativar={() => {
          if (desativar) {
            desativarUsuario(desativar.id, usuarioId ?? "u-sarah");
            toast.success(`${desativar.nome} desativado`);
          }
          setDesativar(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl leading-tight">Equipe</h1>
          <p className="text-sm text-muted-foreground">
            Perfis, loja e PIN. Desativar preserva o histórico de auditoria.
          </p>
        </div>
        <Button onClick={abrirNovo} className="bg-cereja text-white hover:bg-cereja-calda">
          <Plus className="size-4" />
          Novo
        </Button>
      </header>

      {usuarios.length === 0 ? (
        <EstadoVazio titulo="Sem usuários" descricao="Cadastre a equipe da confeitaria." />
      ) : (
        <ul className="space-y-2">
          {usuarios.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => setSelecionado(u.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[16px] border border-border bg-card p-3.5 text-left transition-colors hover:border-cereja/30",
                  !u.ativo && "opacity-60",
                )}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-cereja/10 font-display text-sm text-cereja">
                  {u.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{u.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROTULO_PERFIL[u.perfil]} · {nomeLoja(u.lojaId)}
                  </p>
                </div>
                {!u.ativo && (
                  <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    Inativo
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <UsuarioForm
        aberto={formAberto}
        onOpenChange={setFormAberto}
        banco={banco}
        usuario={editando}
        autorId={usuarioId ?? "u-sarah"}
      />
    </div>
  );
}

function PessoaView({
  pessoa,
  banco,
  agora,
  nomeLoja,
  onVoltar,
  onEditar,
  onDesativar,
  onAbrirEvento,
  formAberto,
  setFormAberto,
  editando,
  autorId,
  evento,
  onCloseEvento,
  desativar,
  onCloseDesativar,
  confirmarDesativar,
}: {
  pessoa: Usuario;
  banco: DadosState;
  agora: Date;
  nomeLoja: (id: string | null) => string;
  onVoltar: () => void;
  onEditar: () => void;
  onDesativar: () => void;
  onAbrirEvento: (e: EventoAuditoria) => void;
  formAberto: boolean;
  setFormAberto: (v: boolean) => void;
  editando: Usuario | null;
  autorId: string;
  evento: EventoAuditoria | null;
  onCloseEvento: () => void;
  desativar: Usuario | null;
  onCloseDesativar: () => void;
  confirmarDesativar: () => void;
}) {
  const de = useMemo(() => new Date(agora.getTime() - 30 * 86400000), [agora]);
  const ponto = useMemo(() => {
    if (pessoa.perfil !== "atendente") return null;
    return pontosDeAtencao(banco, de, agora).find((p) => p.usuarioId === pessoa.id) ?? null;
  }, [banco, de, agora, pessoa]);

  const eventos = useMemo(
    () =>
      banco.eventos
        .filter((e) => e.usuarioId === pessoa.id)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 20),
    [banco.eventos, pessoa.id],
  );

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onVoltar}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </button>

      <div className="rounded-[18px] border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-cereja/10 font-display text-xl text-cereja">
            {pessoa.avatar}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl leading-tight">{pessoa.nome}</h1>
            <p className="text-sm text-muted-foreground">
              {ROTULO_PERFIL[pessoa.perfil]} · {nomeLoja(pessoa.lojaId)} · PIN ••••
              {!pessoa.ativo && " · inativo"}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button variant="outline" size="sm" onClick={onEditar}>
              <Pencil className="size-4" />
              Editar
            </Button>
            {pessoa.ativo && (
              <Button variant="outline" size="icon-sm" aria-label="Desativar" onClick={onDesativar}>
                <UserMinus className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {ponto && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metrica rotulo="Cancelamentos" valor={ponto.cancelamentos} />
              <Metrica rotulo="Descontos" valor={ponto.descontos} />
              <Metrica rotulo="Cortesias" valor={ponto.cortesias} />
              <Metrica rotulo="Caixa c/ diferença" valor={ponto.caixaDiferencas} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Impacto financeiro (30 dias): {formatBRL(ponto.valorImpacto)}
            </p>
            {ponto.observacoes.length > 0 && (
              <ul className="mt-2 space-y-1">
                {ponto.observacoes.map((o, i) => (
                  <li key={i} className="text-sm text-foreground">• {o}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Eventos recentes</h2>
        {eventos.length === 0 ? (
          <EstadoVazio titulo="Sem eventos" descricao="Nenhum registro desta pessoa." tom="cereja" />
        ) : (
          <ul className="space-y-2">
            {eventos.map((e) => (
              <EventoLinha key={e.id} evento={e} banco={banco} onClick={() => onAbrirEvento(e)} />
            ))}
          </ul>
        )}
      </section>

      {pessoa.perfil === "atendente" && (
        <p className="flex items-start gap-2 rounded-[14px] border border-azulejo/25 bg-azulejo/8 px-3.5 py-3 text-sm text-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-azulejo" />
          {OBSERVACAO_FIXA}
        </p>
      )}

      <UsuarioForm
        aberto={formAberto}
        onOpenChange={setFormAberto}
        banco={banco}
        usuario={editando}
        autorId={autorId}
      />
      <EventoDetalhe evento={evento} banco={banco} onClose={onCloseEvento} />

      <Dialog open={desativar !== null} onOpenChange={(v) => !v && onCloseDesativar()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Desativar usuário</DialogTitle>
            <DialogDescription>
              {desativar?.nome} não poderá mais entrar, mas o histórico de auditoria é preservado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onCloseDesativar}>Cancelar</Button>
            <Button className="bg-alerta text-white hover:bg-alerta/90" onClick={confirmarDesativar}>
              Desativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-[14px] bg-secondary/50 p-3 text-center">
      <p className="font-display text-2xl tnum">{valor}</p>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
    </div>
  );
}
