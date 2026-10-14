/**
 * Modelo de dados do sistema "Cereja" (PRD §7.3).
 * Domínio em português do Brasil. Datas em ISO 8601 (string) para serem
 * serializáveis no localStorage e determinísticas no seed.
 */

// ----------------------------------------------------------------------------
// Identificadores (aliases para documentar; continuam sendo string)
// ----------------------------------------------------------------------------
export type Id = string;
export type LojaId = Id;
export type UsuarioId = Id;
export type CategoriaId = Id;
export type ProdutoId = Id;
export type InsumoId = Id;
export type FichaTecnicaId = Id;
export type ComandaId = Id;

/** ISO 8601, ex.: "2026-10-13T07:42:00.000Z". */
export type ISODate = string;

// ----------------------------------------------------------------------------
// Enums (uniões de string)
// ----------------------------------------------------------------------------
export type Perfil = "dona" | "gerente" | "atendente" | "cozinha";

export type TipoComanda = "mesa" | "balcao" | "viagem";

export type StatusComanda =
  | "aberta" // em edição no PDV, ainda não enviada
  | "enviada" // criada e enviada para a cozinha
  | "preparando"
  | "pronta"
  | "paga"
  | "cancelada";

export type FormaPagamento = "pix" | "dinheiro" | "debito" | "credito";

export type UnidadeInsumo = "kg" | "g" | "L" | "ml" | "un" | "pct" | "dz";

export type CategoriaInsumo =
  | "proteina"
  | "graos"
  | "laticinios"
  | "hortifruti"
  | "mercearia"
  | "bebidas"
  | "confeitaria"
  | "descartaveis";

export type IconeCategoria =
  | "xicara"
  | "cuscuzeira"
  | "prato"
  | "frango"
  | "suco"
  | "bolo";

export type MotivoPerda =
  | "estragou"
  | "azedou"
  | "queimou"
  | "preparado_a_mais"
  | "caiu"
  | "vencido"
  | "consumo_equipe"
  | "quebrou"
  | "cancelado_apos_preparo"; // perda automática ao cancelar item já preparado

export type StatusEncomenda =
  | "orcamento"
  | "confirmada"
  | "em_producao"
  | "pronta"
  | "entregue";

export type Severidade = "info" | "atencao" | "critico";

export type TipoEvento =
  | "cancelamento"
  | "desconto"
  | "cortesia"
  | "reimpressao"
  | "caixa_diferenca"
  | "contagem_divergencia"
  | "preco_alterado"
  | "perda"
  | "transferencia"
  | "sangria"
  | "equipe";

export type Fornecedor =
  | "Mateus"
  | "Atacadão"
  | "Açougue Bom Corte"
  | "Hortifruti";

/**
 * Tipo de movimentação de estoque. Toda alteração do estoque teórico é uma
 * entrada (+) ou uma saída (−). O estoque teórico é a soma das movimentações.
 */
export type TipoMovimentacao =
  | "saldo_inicial" // abertura do período (+)
  | "compra" // entrada por compra (+)
  | "consumo" // baixa por venda, via ficha técnica (−)
  | "estorno" // devolução ao estoque (item cancelado antes do preparo) (+)
  | "perda" // baixa por perda registrada (−)
  | "transferencia_entrada" // recebida de outra loja (+)
  | "transferencia_saida" // enviada para outra loja (−)
  | "ajuste_contagem"; // acerto do teórico ao físico após a contagem (±)

export type CategoriaDespesa =
  | "aluguel"
  | "salarios"
  | "energia"
  | "agua"
  | "gas"
  | "internet"
  | "marketing"
  | "manutencao"
  | "impostos"
  | "outros";

// ----------------------------------------------------------------------------
// Cadastros
// ----------------------------------------------------------------------------
export interface Loja {
  id: LojaId;
  nome: string;
  endereco: string;
  /** Cor da loja na linguagem do sistema. */
  cor: "loja-1" | "loja-2";
}

export interface Usuario {
  id: UsuarioId;
  nome: string;
  perfil: Perfil;
  pin: string;
  /** Loja base. A Dona não tem loja fixa (null = todas). */
  lojaId: LojaId | null;
  ativo: boolean;
  /** Iniciais ou caminho de avatar. */
  avatar: string;
}

export interface Categoria {
  id: CategoriaId;
  nome: string;
  icone: IconeCategoria;
  ordem: number;
}

export interface Adicional {
  id: Id;
  nome: string;
  preco: number;
}

export interface Produto {
  id: ProdutoId;
  nome: string;
  categoriaId: CategoriaId;
  preco: number;
  /** CMV (custo da ficha técnica). Pré-calculado no seed. */
  custo: number;
  ativo: boolean;
  /** Caminho em /public/images/produtos. */
  foto: string | null;
  fichaTecnicaId?: FichaTecnicaId;
  adicionais: Adicional[];
}

export interface Insumo {
  id: InsumoId;
  nome: string;
  unidade: UnidadeInsumo;
  /** Custo por unidade base (R$ por kg/L/un…). */
  custoMedio: number;
  estoqueMinimo: number;
  categoria: CategoriaInsumo;
}

export interface EstoqueLoja {
  insumoId: InsumoId;
  lojaId: LojaId;
  /** Estoque teórico (compras − baixa por ficha − perdas ± transferências). */
  qtdTeorica: number;
  qtdUltimaContagem: number;
  dataContagem: ISODate | null;
}

/**
 * Uma linha do extrato de estoque (movimentação). Derivada das coleções do
 * banco (compras, comandas, perdas, transferências, contagens) por
 * `construirMovimentacoes` em `lib/domain/estoque.ts` — não é persistida.
 */
export interface Movimentacao {
  id: string;
  data: ISODate;
  lojaId: LojaId;
  insumoId: InsumoId;
  tipo: TipoMovimentacao;
  /** Delta no estoque na unidade do insumo: positivo = entrada, negativo = saída. */
  qtd: number;
  /** Custo unitário (R$/unidade) associado, quando aplicável (compra). */
  custoUnit?: number;
  /** Responsável, quando houver. */
  usuarioId?: UsuarioId;
  /** Referência à entidade de origem (compra, comanda, perda, contagem…). */
  refId?: string;
  /** Rótulo pronto para o extrato (ex.: "Compra · Açougue Bom Corte"). */
  descricao: string;
}

export interface ItemFicha {
  insumoId: InsumoId;
  /** Quantidade na unidade do insumo. */
  qtd: number;
}

export interface FichaTecnica {
  id: FichaTecnicaId;
  produtoId: ProdutoId;
  itens: ItemFicha[];
  /** Fator de rendimento para proteínas (ex.: 0,65 cru→cozido). */
  rendimento?: number;
}

// ----------------------------------------------------------------------------
// Movimento
// ----------------------------------------------------------------------------
export interface ItemComanda {
  produtoId: ProdutoId;
  qtd: number;
  precoUnit: number;
  /** Preço de tabela (para detectar alteração). */
  precoOriginal: number;
  adicionais: Adicional[];
  obs?: string;
  // ---- Cancelamento de item após o envio (M1/M2). Opcional = compatível com
  // o seed e com comandas antigas (undefined = item ativo). Referenciado por
  // índice dentro da comanda; não tem id próprio (ver docs/DECISOES.md).
  cancelado?: boolean;
  /** Gerente/Dona que autorizou o cancelamento do item. */
  canceladoPor?: UsuarioId;
  /** Motivo do cancelamento (label escolhido ou texto livre). */
  motivoCancelamento?: string;
  canceladoEm?: ISODate;
  /** Item já tinha sido preparado quando cancelou (virou perda, não estorno). */
  canceladoAposPreparo?: boolean;
}

export interface Comanda {
  id: ComandaId;
  numero: number;
  lojaId: LojaId;
  atendenteId: UsuarioId;
  tipo: TipoComanda;
  /** Nº da mesa, nome do cliente (balcão) ou nome (viagem). */
  identificador: string;
  itens: ItemComanda[];
  status: StatusComanda;
  criadaEm: ISODate;
  enviadaEm?: ISODate;
  prontaEm?: ISODate;
  /** Entregue na cozinha (sai do KDS; a comanda segue para pagamento no PDV). */
  entregueEm?: ISODate;
  pagaEm?: ISODate;
  /** Desconto aplicado (R$), se houver (autorizado por gerente). */
  desconto?: number;
  cortesia?: boolean;
  /** Quem autorizou o desconto/cortesia (para exibir "autorizado por X"). */
  descontoAutorizadoPor?: UsuarioId;
  motivoCancelamento?: string;
}

export interface Pagamento {
  id: Id;
  comandaId: ComandaId;
  lojaId: LojaId;
  forma: FormaPagamento;
  valor: number;
  troco?: number;
  data: ISODate;
}

export interface ItemCompra {
  insumoId: InsumoId;
  qtd: number;
  valor: number;
}

export interface Compra {
  id: Id;
  lojaId: LojaId;
  fornecedor: Fornecedor;
  data: ISODate;
  itens: ItemCompra[];
  total: number;
  fotoCupom?: string | null;
  usuarioId: UsuarioId;
}

export interface Perda {
  id: Id;
  lojaId: LojaId;
  insumoId?: InsumoId;
  produtoId?: ProdutoId;
  qtd: number;
  motivo: MotivoPerda;
  /** Custo estimado (R$). */
  custo: number;
  usuarioId: UsuarioId;
  data: ISODate;
  foto?: string | null;
}

export interface ItemContagem {
  insumoId: InsumoId;
  teorico: number;
  contado: number;
  /** contado − teorico (negativo = falta). */
  diferenca: number;
}

export interface Contagem {
  id: Id;
  lojaId: LojaId;
  data: ISODate;
  usuarioId: UsuarioId;
  itens: ItemContagem[];
}

export interface ItemTransferencia {
  insumoId: InsumoId;
  qtd: number;
}

export interface Transferencia {
  id: Id;
  origemId: LojaId;
  destinoId: LojaId;
  itens: ItemTransferencia[];
  usuarioId: UsuarioId;
  data: ISODate;
}

export interface Sangria {
  id: Id;
  valor: number;
  motivo: string;
  data: ISODate;
  /** Gerente/Dona que liberou a retirada (PIN). */
  autorizadorId?: UsuarioId;
}

/** Suprimento (entrada de troco no caixa durante o turno). */
export interface Suprimento {
  id: Id;
  valor: number;
  motivo: string;
  data: ISODate;
}

/** Formas que o atendente conta às cegas no fechamento (Pix não entra). */
export type FormaContada = "dinheiro" | "debito" | "credito";
export type ValoresPorForma = Record<FormaContada, number>;

export interface SessaoCaixa {
  id: Id;
  lojaId: LojaId;
  usuarioId: UsuarioId;
  abertura: ISODate;
  fechamento?: ISODate;
  valorInicial: number;
  /** Informado às cegas pelo atendente no fechamento (dinheiro, p/ compat). */
  valorInformado?: number;
  /** Esperado pelo sistema em dinheiro (inicial + dinheiro − sangrias). */
  valorEsperado?: number;
  /** Diferença TOTAL (soma das formas contadas). Negativo = falta. */
  diferenca?: number;
  // ---- Fechamento cego por forma (Fase 7) ----
  /** O que o sistema espera, por forma (dinheiro já com inicial/sangria/supr.). */
  esperadoPorForma?: ValoresPorForma;
  /** O que o atendente informou, por forma. */
  informadoPorForma?: ValoresPorForma;
  /** informado − esperado, por forma. */
  diferencaPorForma?: ValoresPorForma;
  sangrias: Sangria[];
  suprimentos?: Suprimento[];
}

export interface Despesa {
  id: Id;
  lojaId?: LojaId;
  descricao: string;
  categoria: CategoriaDespesa;
  valor: number;
  vencimento: ISODate;
  pagoEm?: ISODate;
  /**
   * Custo fixo mensal (aluguel, folha…) — rateado por dia na DRE. Avulsas
   * (undefined/false) contam pelo valor cheio só quando caem no período.
   */
  recorrente?: boolean;
}

export interface ItemEncomenda {
  /** Produto do cardápio; ausente quando é um item livre (bolo sob medida). */
  produtoId?: ProdutoId;
  /** Nome do item livre (ex.: "Bolo 2 andares chocolate"). */
  nomeLivre?: string;
  /** Preço unitário do item livre (produtos usam o preço do cardápio). */
  valorUnit?: number;
  qtd: number;
  obs?: string;
}

export interface Encomenda {
  id: Id;
  cliente: string;
  whatsapp: string;
  itens: ItemEncomenda[];
  dataEntrega: ISODate;
  sinal: number;
  total: number;
  status: StatusEncomenda;
  lojaId: LojaId;
  obs?: string;
  /** Forma de pagamento do saldo, informada na entrega. */
  formaPagamentoSaldo?: FormaPagamento;
  entregueEm?: ISODate;
}

export interface EventoAuditoria {
  id: Id;
  tipo: TipoEvento;
  lojaId: LojaId;
  usuarioId: UsuarioId;
  autorizadoPor?: UsuarioId;
  descricao: string;
  valorImpacto?: number;
  data: ISODate;
  severidade: Severidade;
  /** Referência à entidade de origem (comanda, contagem…). */
  refId?: Id;
  /** Valor anterior → novo (ex.: alteração de preço). Texto já formatado. */
  antes?: string;
  depois?: string;
}

// ----------------------------------------------------------------------------
// Banco mock completo (o que o seed produz e os stores guardam)
// ----------------------------------------------------------------------------
export interface BancoMock {
  lojas: Loja[];
  usuarios: Usuario[];
  categorias: Categoria[];
  produtos: Produto[];
  insumos: Insumo[];
  fichas: FichaTecnica[];
  estoque: EstoqueLoja[];
  comandas: Comanda[];
  pagamentos: Pagamento[];
  compras: Compra[];
  perdas: Perda[];
  contagens: Contagem[];
  transferencias: Transferencia[];
  sessoesCaixa: SessaoCaixa[];
  despesas: Despesa[];
  encomendas: Encomenda[];
  eventos: EventoAuditoria[];
}
