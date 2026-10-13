"use client";

import { useMemo, useState } from "react";
import { Receipt, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CategoriaRail } from "./CategoriaRail";
import { GradeProdutos } from "./GradeProdutos";
import { ComandaViva } from "./ComandaViva";
import { AberturaCaixa } from "./AberturaCaixa";
import { PinAutorizacao } from "./PinAutorizacao";
import { ImpressaoComanda } from "./ImpressaoComanda";
import { Pagamento, type PagamentoFeito } from "./Pagamento";
import {
  useDadosStore,
  useSessaoStore,
  useComandaStore,
} from "@/lib/store";
import { registrarEvento } from "@/lib/domain";
import { novoId, agoraISO } from "@/lib/id";
import { formatBRL } from "@/lib/format";
import type {
  Comanda,
  IconeCategoria,
  LojaId,
  Pagamento as TPagamento,
  SessaoCaixa,
} from "@/types";

const PRESET_DESCONTO = [2, 3, 5, 10];

function totalComanda(c: Comanda) {
  const sub = c.itens.reduce((s, it) => s + it.precoUnit * it.qtd, 0);
  return Math.max(0, sub - (c.desconto ?? 0));
}

export function PdvClient() {
  const usuarioId = useSessaoStore((s) => s.usuarioId);
  const lojaAtiva = useSessaoStore((s) => s.lojaAtiva);
  const usuarios = useDadosStore((s) => s.usuarios);
  const produtos = useDadosStore((s) => s.produtos);
  const categorias = useDadosStore((s) => s.categorias);
  const comandas = useDadosStore((s) => s.comandas);
  const sessoesCaixa = useDadosStore((s) => s.sessoesCaixa);
  const enviarComandaStore = useDadosStore((s) => s.enviarComanda);
  const registrarPagamento = useDadosStore((s) => s.registrarPagamento);
  const abrirCaixaStore = useDadosStore((s) => s.abrirCaixa);
  const adicionarEvento = useDadosStore((s) => s.adicionarEvento);

  const cart = useComandaStore();

  const usuario = usuarios.find((u) => u.id === usuarioId) ?? null;
  const lojaAtual: LojaId =
    lojaAtiva === "todas" ? (usuario?.lojaId ?? "loja-1") : lojaAtiva;

  const sessaoAberta = sessoesCaixa.find(
    (s) => s.lojaId === lojaAtual && s.usuarioId === usuarioId && !s.fechamento,
  );

  const iconePorCategoria = useMemo(
    () =>
      Object.fromEntries(categorias.map((c) => [c.id, c.icone])) as Record<
        string,
        IconeCategoria
      >,
    [categorias],
  );

  const [categoriaSel, setCategoriaSel] = useState<string | null>(null);
  const [descontoAberto, setDescontoAberto] = useState(false);
  const [descontoValor, setDescontoValor] = useState(0);
  const [cortesia, setCortesia] = useState(false);
  const [impressao, setImpressao] = useState<Comanda | null>(null);
  const [pagamentoComanda, setPagamentoComanda] = useState<Comanda | null>(null);

  const produtosFiltrados = produtos.filter(
    (p) => p.ativo && (!categoriaSel || p.categoriaId === categoriaSel),
  );

  const abertas = comandas.filter(
    (c) =>
      c.lojaId === lojaAtual &&
      (c.status === "enviada" ||
        c.status === "preparando" ||
        c.status === "pronta"),
  );

  const subtotalCart = cart.itens.reduce(
    (s, it) => s + it.precoUnit * it.qtd,
    0,
  );
  const totalCart = Math.max(0, subtotalCart - cart.desconto);

  if (!usuario) return null;

  function abrirDesconto() {
    setDescontoValor(0);
    setCortesia(false);
    setDescontoAberto(true);
  }

  function aplicarDesconto(autorizador: (typeof usuarios)[number], motivo: string) {
    const valor = cortesia ? subtotalCart : descontoValor;
    cart.aplicarDesconto(valor, cortesia, motivo);
    adicionarEvento(
      registrarEvento(
        {
          tipo: cortesia ? "cortesia" : "desconto",
          lojaId: lojaAtual,
          usuarioId: usuario!.id,
          autorizadoPor: autorizador.id,
          descricao: cortesia
            ? `Cortesia autorizada por ${autorizador.nome}: ${motivo}`
            : `Desconto de ${formatBRL(valor)} autorizado por ${autorizador.nome}: ${motivo}`,
          valorImpacto: -valor,
        },
        novoId("ev"),
        agoraISO(),
      ),
    );
    toast.success(cortesia ? "Cortesia autorizada" : "Desconto autorizado");
  }

  function proximoNumero() {
    const base = lojaAtual === "loja-1" ? 1000 : 2000;
    const nums = comandas
      .filter((c) => c.lojaId === lojaAtual)
      .map((c) => c.numero);
    return (nums.length ? Math.max(...nums) : base) + 1;
  }

  function enviar() {
    if (cart.itens.length === 0 || !sessaoAberta) return;
    const criadaEm = agoraISO();
    const comanda: Comanda = {
      id: novoId("cmd"),
      numero: proximoNumero(),
      lojaId: lojaAtual,
      atendenteId: usuario!.id,
      tipo: cart.tipo,
      identificador: cart.identificador.trim(),
      itens: cart.itens,
      status: "enviada",
      criadaEm,
      enviadaEm: criadaEm,
      desconto: cart.desconto || undefined,
      cortesia: cart.cortesia || undefined,
    };
    enviarComandaStore(comanda);
    cart.limpar();
    setImpressao(comanda);
  }

  function abrirCaixa(valorInicial: number) {
    const sessao: SessaoCaixa = {
      id: novoId("sess"),
      lojaId: lojaAtual,
      usuarioId: usuario!.id,
      abertura: agoraISO(),
      valorInicial,
      sangrias: [],
    };
    abrirCaixaStore(sessao);
    toast.success("Caixa aberto", {
      description: `Troco inicial: ${formatBRL(valorInicial)}`,
    });
  }

  function receber(feitos: PagamentoFeito[]) {
    if (!pagamentoComanda) return;
    const data = agoraISO();
    const pags: TPagamento[] = feitos.map((pf) => ({
      id: novoId("pag"),
      comandaId: pagamentoComanda.id,
      lojaId: lojaAtual,
      forma: pf.forma,
      valor: pf.valor,
      troco: pf.troco,
      data,
    }));
    registrarPagamento(pags);
    toast.success(`Comanda #${pagamentoComanda.numero} recebida`);
    setPagamentoComanda(null);
  }

  return (
    <div className="flex h-full flex-col gap-4 lg:flex-row">
      {/* Trilho de categorias */}
      <div className="shrink-0 lg:w-24">
        <CategoriaRail
          categorias={categorias}
          selecionada={categoriaSel}
          onSelecionar={setCategoriaSel}
        />
      </div>

      {/* Grade de produtos */}
      <div className="min-h-0 flex-1">
        <GradeProdutos
          produtos={produtosFiltrados}
          iconePorCategoria={iconePorCategoria}
          onAdd={cart.adicionar}
        />
      </div>

      {/* Comanda viva (desktop) */}
      <div className="hidden w-[360px] shrink-0 lg:block">
        <ComandaViva onEnviar={enviar} onPedirDesconto={abrirDesconto} />
      </div>

      {/* Barra + comanda (mobile) */}
      <div className="fixed inset-x-0 bottom-16 z-20 flex gap-2 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        {abertas.length > 0 && (
          <ComandasAbertasSheet
            abertas={abertas}
            onPagar={setPagamentoComanda}
          />
        )}
        <Sheet>
          <SheetTrigger
            render={<Button className="h-12 flex-1 justify-between text-base" />}
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingBag className="size-4" />
              Comanda · {cart.itens.length}
            </span>
            <span className="tnum">{formatBRL(totalCart)}</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[88dvh] rounded-t-[20px] p-0">
            <SheetHeader className="px-4">
              <SheetTitle className="font-display text-xl">Comanda</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(88dvh-3.5rem)]">
              <ComandaViva onEnviar={enviar} onPedirDesconto={abrirDesconto} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Comandas abertas (desktop) */}
      {abertas.length > 0 && (
        <div className="fixed bottom-6 right-6 z-20 hidden lg:block">
          <ComandasAbertasSheet abertas={abertas} onPagar={setPagamentoComanda} />
        </div>
      )}

      {/* Abertura de caixa obrigatória */}
      <AberturaCaixa aberto={!sessaoAberta} onAbrir={abrirCaixa} />

      {/* Desconto / cortesia com PIN */}
      <PinAutorizacao
        aberto={descontoAberto}
        onOpenChange={setDescontoAberto}
        titulo="Autorizar desconto"
        descricao="Preço não se digita. Desconto ou cortesia só com a gerente ou a Sarah."
        confirmarHabilitado={cortesia || descontoValor > 0}
        onAutorizado={aplicarDesconto}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {PRESET_DESCONTO.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setDescontoValor(v);
                  setCortesia(false);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  !cortesia && descontoValor === v
                    ? "border-cereja bg-cereja text-white"
                    : "border-border bg-card text-foreground hover:bg-muted",
                )}
              >
                {formatBRL(v)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setCortesia(true);
                setDescontoValor(0);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                cortesia
                  ? "border-cereja bg-cereja text-white"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              Cortesia (grátis)
            </button>
          </div>
        </div>
      </PinAutorizacao>

      {/* Momento da impressão */}
      {impressao && (
        <ImpressaoComanda
          comanda={impressao}
          atendenteNome={usuario.nome}
          onReceber={() => {
            setPagamentoComanda(impressao);
            setImpressao(null);
          }}
          onNova={() => setImpressao(null)}
        />
      )}

      {/* Pagamento */}
      {pagamentoComanda && (
        <Pagamento
          aberto
          onOpenChange={(o) => !o && setPagamentoComanda(null)}
          total={totalComanda(pagamentoComanda)}
          onConfirmar={receber}
        />
      )}
    </div>
  );
}

function ComandasAbertasSheet({
  abertas,
  onPagar,
}: {
  abertas: Comanda[];
  onPagar: (c: Comanda) => void;
}) {
  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="outline" size="lg" className="h-12 shadow-soft" />}
      >
        <Receipt className="size-4" />
        Comandas abertas
        <span className="ml-1 grid min-w-5 place-items-center rounded-full bg-cereja px-1 text-xs text-white tnum">
          {abertas.length}
        </span>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">Comandas abertas</SheetTitle>
        </SheetHeader>
        <div className="space-y-2 overflow-y-auto px-4 pb-8">
          {abertas.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-[14px] border border-border bg-card p-3"
            >
              <div className="min-w-0">
                <p className="font-display text-lg leading-none">
                  #{String(c.numero).padStart(4, "0")}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.tipo === "mesa" ? "Mesa" : c.tipo === "balcao" ? "Balcão" : "Viagem"}
                  {c.identificador ? ` ${c.identificador}` : ""} · {c.itens.length} itens
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold tnum">{formatBRL(totalComanda(c))}</span>
                <Button size="sm" onClick={() => onPagar(c)}>
                  Receber
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
