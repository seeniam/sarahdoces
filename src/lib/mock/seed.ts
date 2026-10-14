import type {
  BancoMock,
  Comanda,
  Compra,
  Contagem,
  Despesa,
  Encomenda,
  EstoqueLoja,
  EventoAuditoria,
  Fornecedor,
  InsumoId,
  ItemComanda,
  LojaId,
  Pagamento,
  Perda,
  Produto,
  SessaoCaixa,
  StatusComanda,
  TipoComanda,
  UsuarioId,
} from "@/types";
import { criarRng } from "./rng";
import { consumoDaComanda } from "@/lib/domain/estoque";
import { fecharCaixaCegoPorForma } from "@/lib/domain/financeiro";
import { formatBRL, formatBRLSinalado, formatQuantidade } from "@/lib/format";
import {
  CATEGORIAS,
  FICHAS,
  FICHA_POR_PRODUTO,
  INSUMOS,
  INSUMO_POR_ID,
  LOJAS,
  PRODUTOS,
  PRODUTO_POR_ID,
  USUARIOS,
} from "./data";

/** São Luís usa o mesmo fuso de Fortaleza (UTC-3, sem horário de verão). */
export const TZ = "America/Fortaleza";
const TZ_OFFSET = "-03:00";
const DIAS = 30;
const SEED = 42;
/** Bump invalida o cache persistido (força re-seed). */
export const VERSAO_SEED = 7;
const pad = (n: number) => String(n).padStart(2, "0");

/** Data de hoje (YYYY-MM-DD) no fuso de São Luís. */
export function dataFortaleza(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

/** Relógio de parede (ano/mês/dia/hora/minuto) em São Luís para um instante. */
function relogioFortaleza(d: Date) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const num = (t: string) => Number(p.find((x) => x.type === t)!.value);
  return {
    ano: num("year"),
    mes: num("month"),
    dia: num("day"),
    hora: num("hour"),
    minuto: num("minute"),
  };
}

/** O cache persistido vira inválido quando a versão muda ou quando vira o dia. */
export function cacheInvalido(
  dataAncoraSalva: string | undefined,
  versaoSalva: number | undefined,
  agora: Date,
): boolean {
  return versaoSalva !== VERSAO_SEED || dataAncoraSalva !== dataFortaleza(agora);
}

const ATENDENTES_LOJA: Record<LojaId, UsuarioId[]> = {
  "loja-1": ["u-larissa", "u-thiago"],
  "loja-2": ["u-camila", "u-rafael"],
};
const COZINHA_LOJA: Record<LojaId, UsuarioId> = {
  "loja-1": "u-antonio",
  "loja-2": "u-lucia",
};
const GERENTE = "u-marta";

const HORAS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const PESOS_HORA = [3, 8, 10, 9, 5, 4, 9, 10, 7, 4, 4, 5, 5, 4, 3, 2];

const DOCES = new Set([
  "prod-fatia-bolo",
  "prod-brigadeiro",
  "prod-torta-limao",
  "prod-bolo-pote",
]);

// Pools de produto por faixa do dia: [produtoId, peso]
const POOL_MANHA: [string, number][] = [
  ["prod-cafe", 10], ["prod-cafe-leite", 8], ["prod-cuscuz-ovo", 7],
  ["prod-cuscuz-completo", 6], ["prod-tapioca-coco", 4], ["prod-tapioca-frango", 4],
  ["prod-pao-chapa", 5], ["prod-ovos", 4], ["prod-suco", 5], ["prod-cafe-gelado", 3],
];
const POOL_ALMOCO: [string, number][] = [
  ["prod-pf-carne", 10], ["prod-pf-frango", 9], ["prod-porcao-frango", 5],
  ["prod-porcao-carne", 4], ["prod-suco", 6], ["prod-refri", 5],
  ["prod-agua", 3], ["prod-cuscuz-completo", 3],
];
const POOL_TARDE: [string, number][] = [
  ["prod-fatia-bolo", 8], ["prod-brigadeiro", 7], ["prod-torta-limao", 5],
  ["prod-bolo-pote", 6], ["prod-cafe", 6], ["prod-cafe-leite", 4],
  ["prod-suco", 5], ["prod-cafe-gelado", 4],
];
const POOL_NOITE: [string, number][] = [
  ["prod-porcao-frango", 6], ["prod-porcao-carne", 5], ["prod-fatia-bolo", 5],
  ["prod-brigadeiro", 4], ["prod-refri", 5], ["prod-suco", 4],
];

const NOMES_CLIENTE = [
  "João", "Maria", "Ana", "Pedro", "Lucas", "Beatriz", "Carlos",
  "Fernanda", "Rafael", "Juliana", "Marcos", "Patrícia", "Gabriel", "Helena",
];

const FORNECEDOR_CATS: Record<Fornecedor, string[]> = {
  "Açougue Bom Corte": ["proteina"],
  Hortifruti: ["hortifruti"],
  Mateus: ["laticinios", "bebidas", "mercearia", "descartaveis"],
  Atacadão: ["graos", "confeitaria"],
};

function poolDoHorario(hora: number): [string, number][] {
  if (hora <= 10) return POOL_MANHA;
  if (hora <= 14) return POOL_ALMOCO;
  if (hora <= 18) return POOL_TARDE;
  return POOL_NOITE;
}

export function gerarSeed(agora: Date = new Date()): BancoMock {
  const rng = criarRng(SEED);

  // Âncora = HOJE (São Luís). Os 30 dias são os 29 anteriores + hoje (índice 29).
  const rel = relogioFortaleza(agora);
  const ancoraUTC = Date.UTC(rel.ano, rel.mes - 1, rel.dia);
  const minutosAgora = rel.hora * 60 + rel.minuto;

  // Calendário (ano/mês/dia) do dia `offset` (0 = há 29 dias, 29 = hoje).
  const diaCalendario = (offset: number) => {
    const d = new Date(ancoraUTC);
    d.setUTCDate(d.getUTCDate() - (DIAS - 1 - offset));
    return { ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1, dia: d.getUTCDate() };
  };
  // Instante ISO (UTC) de uma hora local de São Luís — independe do fuso do host.
  const dataNoDia = (offset: number, hora: number, minuto: number) => {
    const { ano, mes, dia } = diaCalendario(offset);
    return new Date(
      `${ano}-${pad(mes)}-${pad(dia)}T${pad(hora)}:${pad(minuto)}:00${TZ_OFFSET}`,
    ).toISOString();
  };
  const ehFimDeSemana = (offset: number) => {
    const { ano, mes, dia } = diaCalendario(offset);
    const w = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
    return w === 0 || w === 6;
  };

  const comandas: Comanda[] = [];
  const pagamentos: Pagamento[] = [];
  const eventos: EventoAuditoria[] = [];
  const perdas: Perda[] = [];
  const compras: Compra[] = [];
  const contagens: Contagem[] = [];
  const sessoesCaixa: SessaoCaixa[] = [];
  const despesas: Despesa[] = [];
  const encomendas: Encomenda[] = [];

  let seqComanda = 0;
  let seqEvento = 0;
  const numeroLoja: Record<LojaId, number> = { "loja-1": 1000, "loja-2": 2000 };
  const novoEventoId = () => `ev-${(++seqEvento).toString().padStart(4, "0")}`;

  // ---- Comandas, pagamentos, eventos de venda, por dia/loja ----
  for (let offset = 0; offset < DIAS; offset++) {
    const fds = ehFimDeSemana(offset);
    const hoje = offset === DIAS - 1;

    for (const loja of LOJAS) {
      // Volume de um café movimentado (Centro um pouco mais que Cohama).
      const base = loja.id === "loja-1" ? 56 : 46;
      const qtd = Math.round(base * (fds ? 1.1 : 1) * rng.range(0.85, 1.15));
      const atendentes = ATENDENTES_LOJA[loja.id];

      for (let n = 0; n < qtd; n++) {
        const hora = rng.pickPonderado(HORAS, PESOS_HORA);
        const minuto = rng.int(0, 59);
        // Hoje é parcial: nada depois do horário atual (painel nunca vê o futuro).
        if (hoje && hora * 60 + minuto > minutosAgora) continue;
        const atendenteId = rng.pick(atendentes);

        // Itens
        const pool = poolDoHorario(hora);
        const ids = pool.map((p) => p[0]);
        const pesos = pool.map((p) =>
          fds && DOCES.has(p[0]) ? p[1] * 1.8 : p[1],
        );
        const nItens = rng.pickPonderado([1, 2, 3], [5, 4, 2]);
        const itens: ItemComanda[] = [];
        for (let k = 0; k < nItens; k++) {
          const produtoId = rng.pickPonderado(ids, pesos);
          const produto = PRODUTO_POR_ID.get(produtoId) as Produto;
          const qtdItem = rng.pickPonderado([1, 2], [8, 2]);
          const adicionais =
            produto.adicionais.length > 0 && rng.chance(0.18)
              ? [rng.pick(produto.adicionais)]
              : [];
          const precoUnit =
            produto.preco + adicionais.reduce((s, a) => s + a.preco, 0);
          itens.push({
            produtoId,
            qtd: qtdItem,
            precoUnit,
            precoOriginal: precoUnit,
            adicionais,
            obs: rng.chance(0.08) ? "ovo mole" : undefined,
          });
        }

        const tipo: TipoComanda = rng.pickPonderado(
          ["mesa", "balcao", "viagem"],
          [5, 4, 2],
        );
        // Mesa guarda só o número (como o PDV); o rótulo "Mesa" é da UI.
        const identificador =
          tipo === "mesa" ? String(rng.int(1, 12)) : rng.pick(NOMES_CLIENTE);

        const subtotal = itens.reduce((s, it) => s + it.precoUnit * it.qtd, 0);

        // Desconto (autorizado) em alguns casos
        let desconto: number | undefined;
        if (rng.chance(0.05)) {
          desconto = rng.pick([2, 3, 5]);
        }
        const total = Math.max(0, subtotal - (desconto ?? 0));

        // Cancelamento: Thiago cancela ~3× mais que os demais
        const taxaCancel = atendenteId === "u-thiago" ? 0.09 : 0.03;
        const cancelada = rng.chance(taxaCancel);

        const criadaEm = dataNoDia(offset, hora, minuto);
        const enviadaEm = dataNoDia(offset, hora, Math.min(59, minuto + 1));
        const prontaEm = dataNoDia(offset, hora, Math.min(59, minuto + 8));
        const pagaEm = dataNoDia(offset, hora, Math.min(59, minuto + 12));

        // Pedidos em andamento (KDS) são semeados à parte, logo após este laço,
        // com idades controladas (2–18 min). Aqui, tudo é pago ou cancelado.
        let status: StatusComanda = "paga";
        if (cancelada) status = "cancelada";

        const id = `cmd-${(++seqComanda).toString().padStart(5, "0")}`;
        const comanda: Comanda = {
          id,
          numero: ++numeroLoja[loja.id],
          lojaId: loja.id,
          atendenteId,
          tipo,
          identificador,
          itens,
          status,
          criadaEm,
          enviadaEm,
          prontaEm: status === "paga" ? prontaEm : undefined,
          pagaEm: status === "paga" ? pagaEm : undefined,
          desconto: cancelada ? undefined : desconto,
          motivoCancelamento: cancelada ? "cliente desistiu" : undefined,
        };
        comandas.push(comanda);

        if (cancelada) {
          eventos.push({
            id: novoEventoId(),
            tipo: "cancelamento",
            lojaId: loja.id,
            usuarioId: atendenteId,
            autorizadoPor: GERENTE,
            descricao: `Comanda #${comanda.numero} cancelada`,
            valorImpacto: -subtotal,
            data: criadaEm,
            severidade: "atencao",
            refId: id,
          });
          continue; // sem pagamento
        }

        if (desconto) {
          eventos.push({
            id: novoEventoId(),
            tipo: "desconto",
            lojaId: loja.id,
            usuarioId: atendenteId,
            autorizadoPor: GERENTE,
            descricao: `Desconto de ${formatBRL(desconto)} na comanda #${comanda.numero}`,
            valorImpacto: -desconto,
            data: criadaEm,
            severidade: "atencao",
            refId: id,
          });
        }

        // Pagamento apenas para comandas pagas
        if (status === "paga") {
          const forma = rng.pickPonderado(
            ["pix", "dinheiro", "debito", "credito"] as const,
            [40, 25, 20, 15],
          );
          const troco =
            forma === "dinheiro"
              ? Math.max(0, rng.pick([0, 0, 0, 5, 10, 20]) - (total % 10 || 0))
              : undefined;
          pagamentos.push({
            id: `pag-${id}`,
            comandaId: id,
            lojaId: loja.id,
            forma,
            valor: total,
            troco: troco && troco > 0 ? troco : undefined,
            data: pagaEm,
          });
        }
      }
    }
  }

  // ---- Pedidos "em andamento" de agora, para o KDS sempre ter conteúdo com
  // idades variadas (2–18 min) mostrando as 3 cores do cronômetro; nada acima
  // de ~20 min. Ancorado em `agora` (independe do horário de funcionamento). ----
  const haMin = (m: number) =>
    new Date(agora.getTime() - m * 60000).toISOString();
  const PLANO_KDS: { idade: number; status: StatusComanda; prontoHa?: number }[] = [
    { idade: 3, status: "enviada" }, // verde (Novos)
    { idade: 6, status: "enviada" }, // verde (Novos)
    { idade: 9, status: "preparando" }, // amarelo (Preparando)
    { idade: 13, status: "preparando" }, // amarelo (Preparando)
    { idade: 17, status: "preparando" }, // vermelho (Preparando)
    { idade: 12, status: "pronta", prontoHa: 2 }, // Prontos
    { idade: 16, status: "pronta", prontoHa: 6 }, // Prontos
  ];
  for (const loja of LOJAS) {
    const atendentes = ATENDENTES_LOJA[loja.id];
    const pool = poolDoHorario(rel.hora);
    const ids = pool.map((p) => p[0]);
    const pesos = pool.map((p) => p[1]);
    for (const plano of PLANO_KDS) {
      const nItens = rng.pickPonderado([1, 2], [3, 2]);
      const itens: ItemComanda[] = [];
      for (let k = 0; k < nItens; k++) {
        const produtoId = rng.pickPonderado(ids, pesos);
        const produto = PRODUTO_POR_ID.get(produtoId) as Produto;
        itens.push({
          produtoId,
          qtd: rng.pickPonderado([1, 2], [8, 2]),
          precoUnit: produto.preco,
          precoOriginal: produto.preco,
          adicionais: [],
        });
      }
      const tipo: TipoComanda = rng.pickPonderado(
        ["mesa", "balcao", "viagem"],
        [6, 2, 2],
      );
      const identificador =
        tipo === "mesa" ? String(rng.int(1, 20)) : rng.pick(NOMES_CLIENTE);
      const id = `cmd-${(++seqComanda).toString().padStart(5, "0")}`;
      comandas.push({
        id,
        numero: ++numeroLoja[loja.id],
        lojaId: loja.id,
        atendenteId: rng.pick(atendentes),
        tipo,
        identificador,
        itens,
        status: plano.status,
        criadaEm: haMin(plano.idade + 1),
        enviadaEm: haMin(plano.idade),
        prontaEm:
          plano.status === "pronta" ? haMin(plano.prontoHa ?? 1) : undefined,
      });
    }
  }

  // A contagem física da semana acontece 2 dias atrás, no fim do expediente
  // (23h). A hora fica DEPOIS do último pedido do dia para que o consumo diário
  // (agregado por dia nas movimentações) caia inteiro antes da contagem — assim
  // a soma reconcilia e o balanço "sem explicação" bate exatamente com o painel.
  const OFFSET_CONTAGEM = DIAS - 2;
  const dataContagemISO = dataNoDia(OFFSET_CONTAGEM, 23, 0);

  // ---- Consumo teórico acumulado por loja/insumo (total e até a contagem) ----
  const consumo: Record<LojaId, Map<InsumoId, number>> = {
    "loja-1": new Map(),
    "loja-2": new Map(),
  };
  const consumoAteContagem: Record<LojaId, Map<InsumoId, number>> = {
    "loja-1": new Map(),
    "loja-2": new Map(),
  };
  for (const c of comandas) {
    if (c.status === "cancelada") continue;
    const uso = consumoDaComanda(c, FICHA_POR_PRODUTO);
    const alvo = consumo[c.lojaId];
    const ate = c.criadaEm <= dataContagemISO ? consumoAteContagem[c.lojaId] : null;
    for (const [ins, q] of uso) {
      alvo.set(ins, (alvo.get(ins) ?? 0) + q);
      if (ate) ate.set(ins, (ate.get(ins) ?? 0) + q);
    }
  }

  // ---- Perdas (ovo acima do normal na Loja 1; carne eventual) ----
  const perdaQtd: Record<LojaId, Map<InsumoId, number>> = {
    "loja-1": new Map(),
    "loja-2": new Map(),
  };
  const perdaQtdAteContagem: Record<LojaId, Map<InsumoId, number>> = {
    "loja-1": new Map(),
    "loja-2": new Map(),
  };
  let seqPerda = 0;
  const registrarPerda = (
    loja: LojaId,
    insumoId: InsumoId,
    qtd: number,
    motivo: Perda["motivo"],
    offset: number,
  ) => {
    const insumo = INSUMO_POR_ID.get(insumoId);
    if (!insumo) return;
    const custo = Number((qtd * insumo.custoMedio).toFixed(2));
    const data = dataNoDia(offset, rng.int(9, 18), rng.int(0, 59));
    perdas.push({
      id: `perda-${(++seqPerda).toString().padStart(4, "0")}`,
      lojaId: loja,
      insumoId,
      qtd,
      motivo,
      custo,
      usuarioId: COZINHA_LOJA[loja],
      data,
    });
    perdaQtd[loja].set(insumoId, (perdaQtd[loja].get(insumoId) ?? 0) + qtd);
    if (data <= dataContagemISO) {
      perdaQtdAteContagem[loja].set(
        insumoId,
        (perdaQtdAteContagem[loja].get(insumoId) ?? 0) + qtd,
      );
    }
    if (custo >= 25) {
      eventos.push({
        id: novoEventoId(),
        tipo: "perda",
        lojaId: loja,
        usuarioId: COZINHA_LOJA[loja],
        descricao: `Perda de ${insumo.nome} (${formatQuantidade(qtd, insumo.unidade)})`,
        valorImpacto: -custo,
        data,
        severidade: "info",
      });
    }
  };

  for (let offset = 0; offset < DIAS; offset++) {
    // Ovo "acima do normal" na Loja 1
    if (rng.chance(0.55)) registrarPerda("loja-1", "ins-ovo", rng.int(3, 8), "quebrou", offset);
    if (rng.chance(0.2)) registrarPerda("loja-2", "ins-ovo", rng.int(1, 3), "quebrou", offset);
    // Outras perdas ocasionais
    if (rng.chance(0.25))
      registrarPerda(rng.pick(LOJAS).id, "ins-frango", rng.range(0.3, 0.8), "estragou", offset);
    if (rng.chance(0.15))
      registrarPerda(rng.pick(LOJAS).id, "ins-carne", rng.range(0.2, 0.5), "queimou", offset);
    if (rng.chance(0.2))
      registrarPerda(rng.pick(LOJAS).id, "ins-leite", rng.range(0.5, 1.5), "azedou", offset);
  }

  // ---- Estoque teórico final = inicial + compras − consumo − perdas ----
  // Geramos compras suficientes para manter o estoque num nível saudável.
  const estoque: EstoqueLoja[] = [];
  // Teórico na data da contagem (as compras do mês ocorrem todas antes dela):
  // teórico_contagem = inicial + comprado − consumo_até_contagem − perda_até_contagem.
  const teoricoNaContagem = new Map<string, number>();
  let seqCompra = 0;
  const comprasPorFornecedorSemana: Record<string, Compra> = {};

  for (const loja of LOJAS) {
    for (const insumo of INSUMOS) {
      const cons = consumo[loja.id].get(insumo.id) ?? 0;
      const perd = perdaQtd[loja.id].get(insumo.id) ?? 0;
      const consAte = consumoAteContagem[loja.id].get(insumo.id) ?? 0;
      const perdAte = perdaQtdAteContagem[loja.id].get(insumo.id) ?? 0;
      const inicial = insumo.estoqueMinimo * 4;
      const desejadoFinal = insumo.estoqueMinimo * 3;
      const totalComprar = Math.max(0, cons + perd + desejadoFinal - inicial);
      const qtdFinal = Number((inicial + totalComprar - cons - perd).toFixed(3));
      teoricoNaContagem.set(
        `${loja.id}:${insumo.id}`,
        Number((inicial + totalComprar - consAte - perdAte).toFixed(3)),
      );

      estoque.push({
        insumoId: insumo.id,
        lojaId: loja.id,
        qtdTeorica: qtdFinal,
        qtdUltimaContagem: qtdFinal,
        dataContagem: null,
      });

      // Distribui a compra em ~4 semanas no fornecedor da categoria
      if (totalComprar > 0) {
        const fornecedor = (Object.keys(FORNECEDOR_CATS) as Fornecedor[]).find(
          (f) => FORNECEDOR_CATS[f].includes(insumo.categoria),
        );
        if (fornecedor) {
          const porSemana = totalComprar / 4;
          for (let s = 0; s < 4; s++) {
            const offset = Math.min(DIAS - 1, s * 7 + 1);
            const chave = `${loja.id}-${fornecedor}-${s}`;
            if (!comprasPorFornecedorSemana[chave]) {
              comprasPorFornecedorSemana[chave] = {
                id: `cmp-${(++seqCompra).toString().padStart(4, "0")}`,
                lojaId: loja.id,
                fornecedor,
                data: dataNoDia(offset, 8, 0),
                itens: [],
                total: 0,
                fotoCupom: null,
                usuarioId: GERENTE,
              };
            }
            const compra = comprasPorFornecedorSemana[chave];
            const valor = Number((porSemana * insumo.custoMedio).toFixed(2));
            compra.itens.push({ insumoId: insumo.id, qtd: Number(porSemana.toFixed(3)), valor });
            compra.total = Number((compra.total + valor).toFixed(2));
          }
        }
      }
    }
  }
  compras.push(...Object.values(comprasPorFornecedorSemana).filter((c) => c.itens.length > 0));

  // ---- Contagem recente com divergências (carne Loja 1: −2,4 kg sem explicação) ----
  const estoquePorChave = new Map(estoque.map((e) => [`${e.lojaId}:${e.insumoId}`, e]));
  const INSUMOS_CONTAGEM = [
    "ins-carne", "ins-frango", "ins-arroz", "ins-feijao", "ins-ovo",
    "ins-queijo", "ins-flocao", "ins-cafe-po",
  ];
  for (const loja of LOJAS) {
    const dataContagem = dataContagemISO;
    const itensContagem = INSUMOS_CONTAGEM.map((insumoId) => {
      const e = estoquePorChave.get(`${loja.id}:${insumoId}`)!;
      // Teórico AO MOMENTO da contagem (não o teórico final de hoje): assim a
      // soma das movimentações reconcilia e o balanço bate com o painel.
      const teorico =
        teoricoNaContagem.get(`${loja.id}:${insumoId}`) ??
        Number(e.qtdTeorica.toFixed(3));
      // Divergência plantada: carne na Loja 1 some 2,4 kg "sem explicação"
      let contado: number;
      if (loja.id === "loja-1" && insumoId === "ins-carne") {
        contado = Number((teorico - 2.4).toFixed(3));
      } else {
        contado = Number((teorico + rng.range(-0.3, 0.2)).toFixed(3));
      }
      e.qtdUltimaContagem = contado;
      e.dataContagem = dataContagem;
      return { insumoId, teorico, contado, diferenca: Number((contado - teorico).toFixed(3)) };
    });
    contagens.push({
      id: `cont-${loja.id}`,
      lojaId: loja.id,
      data: dataContagem,
      usuarioId: GERENTE,
      itens: itensContagem,
    });

    // Evento da divergência da carne (Loja 1) — descrição e valor DERIVADOS da
    // divergência real da contagem (não repetem o "-2.4" plantado acima: o
    // arredondamento do teórico pode deixá-lo ligeiramente diferente).
    if (loja.id === "loja-1") {
      const carne = INSUMO_POR_ID.get("ins-carne")!;
      const itemCarne = itensContagem.find((i) => i.insumoId === "ins-carne")!;
      const faltaQtd = Math.abs(itemCarne.diferenca);
      eventos.push({
        id: novoEventoId(),
        tipo: "contagem_divergencia",
        lojaId: loja.id,
        usuarioId: GERENTE,
        descricao: `Carne: ${formatQuantidade(faltaQtd, carne.unidade)} sem explicação na contagem da semana`,
        valorImpacto: Number((itemCarne.diferenca * carne.custoMedio).toFixed(2)),
        data: dataContagem,
        severidade: "critico",
        refId: `cont-${loja.id}`,
      });
    }
  }

  // ---- Sessões de caixa (uma por atendente/dia) + fechamento cego ----
  const atendenteDaComanda = new Map(comandas.map((c) => [c.id, c.atendenteId]));
  let seqSessao = 0;
  for (let offset = 0; offset < DIAS; offset++) {
    if (offset === DIAS - 1) continue; // "hoje" o caixa ainda está aberto
    for (const loja of LOJAS) {
      for (const atendenteId of ATENDENTES_LOJA[loja.id]) {
        // Janela do dia em horário de São Luís (instantes UTC): [00:00, próximo 00:00)
        const inicioDia = dataNoDia(offset, 0, 0);
        const inicioProximo = dataNoDia(offset + 1, 0, 0);
        // Vendas do dia por forma (Pix fica fora do caixa físico).
        const vendas = { dinheiro: 0, debito: 0, credito: 0 };
        for (const p of pagamentos) {
          if (
            p.lojaId !== loja.id ||
            p.data < inicioDia ||
            p.data >= inicioProximo ||
            atendenteDaComanda.get(p.comandaId) !== atendenteId ||
            p.forma === "pix"
          ) {
            continue;
          }
          vendas[p.forma] += p.valor;
        }

        const valorInicial = 100;
        const totalSangrias = rng.chance(0.2) ? rng.pick([50, 100]) : 0;

        // Anomalia: um fechamento com −R$ 37,00 em dinheiro (Camila / Loja 2)
        const anomalia =
          loja.id === "loja-2" && atendenteId === "u-camila" && offset === DIAS - 4;
        const ruidoDinheiro = anomalia ? -37 : rng.pick([0, 0, 0, 0, -2, 3, -5]);

        const esperadoDinheiro = valorInicial + vendas.dinheiro - totalSangrias;
        // No mundo real, cartão quase nunca "sobra/falta" (vem da maquininha);
        // o atendente informa exatamente o relatório. A diferença mora no dinheiro.
        const informado = {
          dinheiro: Number((esperadoDinheiro + ruidoDinheiro).toFixed(2)),
          debito: Number(vendas.debito.toFixed(2)),
          credito: Number(vendas.credito.toFixed(2)),
        };
        const fech = fecharCaixaCegoPorForma({
          valorInicial,
          vendas,
          totalSangrias,
          totalSuprimentos: 0,
          informado,
        });
        const diferenca = fech.diferencaTotal;

        const id = `sess-${(++seqSessao).toString().padStart(4, "0")}`;
        sessoesCaixa.push({
          id,
          lojaId: loja.id,
          usuarioId: atendenteId,
          abertura: dataNoDia(offset, 6, 0),
          fechamento: dataNoDia(offset, 21, 0),
          valorInicial,
          valorInformado: informado.dinheiro,
          valorEsperado: fech.esperado.dinheiro,
          diferenca,
          esperadoPorForma: fech.esperado,
          informadoPorForma: fech.informado,
          diferencaPorForma: fech.diferenca,
          sangrias: totalSangrias
            ? [{ id: `sang-${id}`, valor: totalSangrias, motivo: "Depósito bancário", data: dataNoDia(offset, 14, 0) }]
            : [],
          suprimentos: [],
        });

        if (Math.abs(diferenca) >= 15) {
          eventos.push({
            id: novoEventoId(),
            tipo: "caixa_diferenca",
            lojaId: loja.id,
            usuarioId: atendenteId,
            descricao: `Caixa fechou com diferença de ${formatBRLSinalado(diferenca)}`,
            valorImpacto: Number(diferenca.toFixed(2)),
            data: dataNoDia(offset, 21, 5),
            severidade: "critico",
            refId: id,
          });
        }
      }
    }
  }

  // ---- Despesas fixas do mês ----
  // [descrição, categoria, valor, dia de vencimento, loja (aluguel é por loja)]
  const despesasFixas: [string, Despesa["categoria"], number, number, LojaId?][] = [
    ["Aluguel Loja 1", "aluguel", 4500, 5, "loja-1"],
    ["Aluguel Loja 2", "aluguel", 3800, 5, "loja-2"],
    ["Energia elétrica", "energia", 2200, 10],
    ["Água", "agua", 480, 12],
    ["Gás", "gas", 620, 8],
    ["Internet", "internet", 300, 15],
    ["Folha de pagamento", "salarios", 9800, 5],
  ];
  despesasFixas.forEach(([descricao, categoria, valor, diaVenc, lojaId], i) => {
    despesas.push({
      id: `desp-${(i + 1).toString().padStart(3, "0")}`,
      descricao,
      categoria,
      valor,
      recorrente: true,
      ...(lojaId ? { lojaId } : {}),
      vencimento: new Date(
        `${rel.ano}-${pad(rel.mes)}-${pad(diaVenc)}T00:00:00${TZ_OFFSET}`,
      ).toISOString(),
      pagoEm:
        diaVenc < rel.dia
          ? new Date(
              `${rel.ano}-${pad(rel.mes)}-${pad(diaVenc)}T10:00:00${TZ_OFFSET}`,
            ).toISOString()
          : undefined,
    });
  });

  // Despesas avulsas ancoradas em HOJE, para a aba Contas a pagar ter uma
  // vencida, uma vencendo em breve, uma a vencer e uma recém-paga.
  const dataRelHoje = (deltaDias: number, hora = 0) => {
    const d = new Date(ancoraUTC);
    d.setUTCDate(d.getUTCDate() + deltaDias);
    return new Date(
      `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(hora)}:00:00${TZ_OFFSET}`,
    ).toISOString();
  };
  const avulsas: [string, Despesa["categoria"], number, number, boolean, LojaId?][] = [
    // [descrição, categoria, valor, vencimento(Δdias de hoje), paga?, loja?]
    ["Conserto da geladeira", "manutencao", 680, -2, false, "loja-1"],
    ["Fornecedor de embalagens", "outros", 420, 2, false, "loja-2"],
    ["Material de limpeza", "outros", 260, 9, false],
    ["Contador (mensal)", "impostos", 900, -5, true],
  ];
  avulsas.forEach(([descricao, categoria, valor, dv, paga, lojaId], i) => {
    despesas.push({
      id: `desp-av-${(i + 1).toString().padStart(3, "0")}`,
      descricao,
      categoria,
      valor,
      ...(lojaId ? { lojaId } : {}),
      vencimento: dataRelHoje(dv),
      pagoEm: paga ? dataRelHoje(dv, 11) : undefined,
    });
  });

  // ---- Encomendas (confeitaria) ----
  // [cliente, status, Δdias da entrega (hoje=0), hora, bolo livre?, total, obs?]
  const planoEnc: [
    string, Encomenda["status"], number, number, string | null, number, string?,
  ][] = [
    ["Dona Fátima", "orcamento", 5, 15, "Bolo 2 andares — chocolate com morango", 320, "Topo 'Parabéns Fátima'"],
    ["Escritório Alfa", "orcamento", 3, 10, null, 180],
    ["Léo (aniversário)", "confirmada", 2, 16, "Bolo redondo — brigadeiro (15 fatias)", 160, "Sem lactose"],
    ["Vânia", "confirmada", 4, 9, null, 120],
    ["Cléo", "em_producao", 1, 14, "Bolo vulcão — doce de leite", 140],
    ["Marina", "em_producao", 0, 17, null, 90, "Retirar no fim da tarde"],
    ["Seu Jorge", "pronta", 0, 11, "Bolo de pote sortido (20)", 240],
    ["Padaria Cohama", "pronta", -1, 12, null, 200, "ATRASADA — cliente avisado"],
    ["Rafaela", "entregue", -2, 15, "Bolo de aniversário — chantilly", 180],
    ["Tia Zu", "entregue", -4, 10, null, 110],
  ];
  const whatsFixo = [
    "98991", "98992", "98988", "98977", "98961",
    "98954", "98943", "98936", "98925", "98918",
  ];
  planoEnc.forEach(([cliente, status, dDias, hora, boloLivre, total, obs], i) => {
    const cal = new Date(ancoraUTC);
    cal.setUTCDate(cal.getUTCDate() + dDias);
    const dataEntrega = new Date(
      `${cal.getUTCFullYear()}-${pad(cal.getUTCMonth() + 1)}-${pad(cal.getUTCDate())}T${pad(hora)}:00:00${TZ_OFFSET}`,
    ).toISOString();
    const itens = boloLivre
      ? [{ nomeLivre: boloLivre, valorUnit: total, qtd: 1 }]
      : [
          { produtoId: "prod-bolo-pote", qtd: rng.int(6, 20) },
          ...(rng.chance(0.5) ? [{ produtoId: "prod-brigadeiro", qtd: rng.int(20, 50) }] : []),
        ];
    const entregue = status === "entregue";
    encomendas.push({
      id: `enc-${(i + 1).toString().padStart(3, "0")}`,
      cliente,
      whatsapp: `(98) 9${whatsFixo[i].slice(1)}-${rng.int(1000, 9999)}`,
      itens,
      dataEntrega,
      sinal: Number((total * 0.5).toFixed(2)),
      total,
      status,
      lojaId: i % 2 === 0 ? "loja-1" : "loja-2",
      obs,
      ...(entregue
        ? {
            entregueEm: dataEntrega,
            formaPagamentoSaldo: rng.pick(["pix", "dinheiro", "debito"] as const),
          }
        : {}),
    });
  });

  return {
    lojas: LOJAS,
    usuarios: USUARIOS,
    categorias: CATEGORIAS,
    produtos: PRODUTOS,
    insumos: INSUMOS,
    fichas: FICHAS,
    estoque,
    comandas,
    pagamentos,
    compras,
    perdas,
    contagens,
    transferencias: [],
    sessoesCaixa,
    despesas,
    encomendas,
    eventos,
  };
}

/** Restaura o banco mock ao estado inicial (seed determinístico para `agora`). */
export function resetarDemo(agora: Date = new Date()): BancoMock {
  return gerarSeed(agora);
}
