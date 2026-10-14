"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Timer, Trash2, UtensilsCrossed, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CerejaMark } from "@/components/brand/Logo";
import { KdsColuna } from "./KdsColuna";
import { RegistrarPerdaModal } from "./RegistrarPerdaModal";
import {
  useDadosStore,
  useSessaoStore,
  useHidratado,
} from "@/lib/store";
import { podeAcessarRota, rotaInicial } from "@/lib/auth/navegacao";
import { registrarEvento, ROTULO_MOTIVO_PERDA } from "@/lib/domain";
import { novoId, agoraISO } from "@/lib/id";
import { formatNumero, formatQuantidade } from "@/lib/format";
import { tocarSinoNovoPedido } from "@/lib/som";
import type { CategoriaIcone } from "@/components/brand/icons";
import type { Comanda, Perda, StatusComanda } from "@/types";

function Skeleton() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#1c1210]">
      <div className="size-10 animate-pulse rounded-full bg-white/10" />
    </main>
  );
}

export function CozinhaClient() {
  const hidratado = useHidratado();
  const router = useRouter();
  const usuarioId = useSessaoStore((s) => s.usuarioId);
  const usuarios = useDadosStore((s) => s.usuarios);
  const lojas = useDadosStore((s) => s.lojas);
  const produtos = useDadosStore((s) => s.produtos);
  const insumos = useDadosStore((s) => s.insumos);
  const categorias = useDadosStore((s) => s.categorias);
  const comandas = useDadosStore((s) => s.comandas);
  const avancarStatusComanda = useDadosStore((s) => s.avancarStatusComanda);
  const marcarEntregueComanda = useDadosStore((s) => s.marcarEntregueComanda);
  const adicionarPerda = useDadosStore((s) => s.adicionarPerda);
  const adicionarEvento = useDadosStore((s) => s.adicionarEvento);
  const sair = useSessaoStore((s) => s.sair);

  const usuario = useMemo(
    () => usuarios.find((u) => u.id === usuarioId) ?? null,
    [usuarios, usuarioId],
  );
  const lojaAtual = usuario?.lojaId ?? "loja-1";
  const iconePorCategoria = useMemo(
    () =>
      Object.fromEntries(categorias.map((c) => [c.id, c.icone])) as Record<
        string,
        CategoriaIcone
      >,
    [categorias],
  );

  // Guard próprio (a /cozinha fica fora do AppShell).
  useEffect(() => {
    if (!hidratado) return;
    if (!usuario) {
      router.replace("/login");
      return;
    }
    if (!podeAcessarRota(usuario.perfil, "/cozinha")) {
      router.replace(rotaInicial(usuario.perfil));
    }
  }, [hidratado, usuario, router]);

  // Relógio do board (atualiza os cronômetros sem recarregar).
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const abertas = useMemo(
    () =>
      comandas
        .filter(
          (c) =>
            c.lojaId === lojaAtual &&
            (c.status === "enviada" ||
              c.status === "preparando" ||
              c.status === "pronta"),
        )
        .sort(
          (a, b) =>
            new Date(a.enviadaEm ?? a.criadaEm).getTime() -
            new Date(b.enviadaEm ?? b.criadaEm).getTime(),
        ),
    [comandas, lojaAtual],
  );

  const novos = abertas.filter((c) => c.status === "enviada");
  const preparando = abertas.filter((c) => c.status === "preparando");
  // Prontos: enquanto não entregue e por até 10 min (depois some sozinho).
  const LIMITE_PRONTO_MS = 10 * 60 * 1000;
  const prontos = abertas.filter(
    (c) =>
      c.status === "pronta" &&
      !c.entregueEm &&
      agora -
        new Date(c.prontaEm ?? c.enviadaEm ?? c.criadaEm).getTime() <
        LIMITE_PRONTO_MS,
  );
  const naFila = novos.length + preparando.length + prontos.length;

  // Tempo médio de preparo de hoje (comandas já prontas/pagas da loja).
  const tempoMedio = useMemo(() => {
    const hoje = new Date().toDateString();
    const feitas = comandas.filter(
      (c) =>
        c.lojaId === lojaAtual &&
        c.enviadaEm &&
        c.prontaEm &&
        new Date(c.enviadaEm).toDateString() === hoje,
    );
    if (feitas.length === 0) return null;
    const soma = feitas.reduce(
      (s, c) =>
        s +
        (new Date(c.prontaEm!).getTime() - new Date(c.enviadaEm!).getTime()) /
          60000,
      0,
    );
    return Math.round(soma / feitas.length);
  }, [comandas, lojaAtual]);

  // Som dos pedidos: o autoplay é bloqueado até um gesto do usuário. Mostramos
  // uma faixa "Toque para ativar" e lembramos a escolha na sessão da aba.
  const [somAtivado, setSomAtivado] = useState(() => {
    try {
      return typeof window !== "undefined" && sessionStorage.getItem("cereja-kds-som") === "1";
    } catch {
      return false;
    }
  });
  function ativarSom() {
    setSomAtivado(true);
    try { sessionStorage.setItem("cereja-kds-som", "1"); } catch {}
    tocarSinoNovoPedido(); // dentro do gesto → libera o áudio e confirma
  }

  // Pedido novo (de outra aba, via sync do persist): som suave + destaque único.
  const vistos = useRef<Set<string> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [destaques, setDestaques] = useState<Set<string>>(() => new Set());
  const chaveAbertas = abertas.map((c) => `${c.id}:${c.status}`).join(",");

  // Limpa timers pendentes só no desmonte (não a cada novo pedido).
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    // Baseline só DEPOIS da hidratação: na carga inicial os pedidos semeados
    // não disparam som/destaque — isso fica só para os que chegam depois.
    if (!hidratado) return;
    const idsEnviada = new Set(novos.map((c) => c.id));
    if (vistos.current === null) {
      vistos.current = idsEnviada;
      return;
    }
    const frescos = [...idsEnviada].filter((id) => !vistos.current!.has(id));
    vistos.current = idsEnviada;
    if (frescos.length === 0) return;
    if (somAtivado) tocarSinoNovoPedido();
    setDestaques((prev) => new Set([...prev, ...frescos]));
    const t = setTimeout(() => {
      setDestaques((prev) => {
        const n = new Set(prev);
        frescos.forEach((id) => n.delete(id));
        return n;
      });
      timers.current = timers.current.filter((x) => x !== t);
    }, 4500);
    timers.current.push(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveAbertas, hidratado, somAtivado]);

  const [perdaAberta, setPerdaAberta] = useState(false);

  if (!hidratado || !usuario || !podeAcessarRota(usuario.perfil, "/cozinha")) {
    return <Skeleton />;
  }

  const loja = lojas.find((l) => l.id === lojaAtual);
  const lojaNome = loja?.nome.replace(/^Loja \d+\s*[—-]\s*/, "") ?? "";

  function avancar(c: Comanda, proximo: StatusComanda) {
    avancarStatusComanda(c.id, proximo);
  }

  function entregar(c: Comanda) {
    marcarEntregueComanda(c.id);
  }

  function registrarPerda(perda: Perda, custo: number) {
    adicionarPerda(perda);
    const insumoAlvo = insumos.find((i) => i.id === perda.insumoId);
    const nomeAlvo =
      produtos.find((p) => p.id === perda.produtoId)?.nome ?? insumoAlvo?.nome ?? "item";
    // Insumo → quantidade com unidade ("2,4 kg"); produto → nº de unidades ("2×").
    const qtdLabel = insumoAlvo
      ? formatQuantidade(perda.qtd, insumoAlvo.unidade)
      : `${formatNumero(perda.qtd)}×`;
    adicionarEvento(
      registrarEvento(
        {
          tipo: "perda",
          lojaId: lojaAtual,
          usuarioId: usuario!.id,
          descricao: `Perda registrada na cozinha: ${qtdLabel} ${nomeAlvo} (${ROTULO_MOTIVO_PERDA[perda.motivo]})`,
          valorImpacto: -custo,
          refId: perda.id,
        },
        novoId("ev"),
        agoraISO(),
      ),
    );
    toast.success("Perda registrada");
  }

  return (
    <main className="flex h-dvh w-dvw flex-col overflow-hidden bg-[#2b1b18] text-white dark:bg-[#1c1210]">
      {/* Topo */}
      <header className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-3">
          <CerejaMark className="size-7" />
          <div className="leading-tight">
            <p className="font-display text-xl">Cozinha</p>
            <p className="text-xs text-white/55">{lojaNome}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 sm:flex">
            <span className="inline-flex items-center gap-2 text-sm text-white/80">
              <UtensilsCrossed className="size-4 text-white/50" />
              <span className="font-display text-lg tnum">{naFila}</span>
              na fila
            </span>
            <span className="inline-flex items-center gap-2 text-sm text-white/80">
              <Timer className="size-4 text-white/50" />
              <span className="font-display text-lg tnum">
                {tempoMedio ?? "—"}
              </span>
              min médio hoje
            </span>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="h-14 border-white/20 bg-white/5 text-white hover:bg-white/10"
            onClick={() => setPerdaAberta(true)}
          >
            <Trash2 className="size-4" />
            Registrar perda
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sair"
            className="size-14 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={() => {
              sair();
              router.replace("/login");
            }}
          >
            <LogOut className="size-5" />
          </Button>
        </div>
      </header>

      {/* Autoplay é bloqueado: faixa discreta para ativar o som dos pedidos. */}
      {!somAtivado && (
        <button
          type="button"
          onClick={ativarSom}
          className="flex items-center justify-center gap-2 border-b border-white/10 bg-white/[0.04] py-2 text-sm text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          <Volume2 className="size-4" />
          Toque para ativar o som dos pedidos
        </button>
      )}

      {/* Colunas */}
      <div className="flex min-h-0 flex-1 gap-4 p-4">
        <KdsColuna
          titulo="Novos"
          comandas={novos}
          agora={agora}
          onAvancar={avancar}
          onEntregue={entregar}
          destaques={destaques}
        />
        <KdsColuna
          titulo="Preparando"
          comandas={preparando}
          agora={agora}
          onAvancar={avancar}
          onEntregue={entregar}
          destaques={destaques}
        />
        <KdsColuna
          titulo="Prontos"
          comandas={prontos}
          agora={agora}
          onAvancar={avancar}
          onEntregue={entregar}
          destaques={destaques}
        />
      </div>

      <RegistrarPerdaModal
        aberto={perdaAberta}
        onOpenChange={setPerdaAberta}
        lojaId={lojaAtual}
        usuarioId={usuario.id}
        produtos={produtos.filter((p) => p.ativo)}
        insumos={insumos}
        iconePorCategoria={iconePorCategoria}
        onRegistrar={registrarPerda}
      />
    </main>
  );
}
