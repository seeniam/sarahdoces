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
  | "quebrou";

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
  | "transferencia";

export type Fornecedor =
  | "Mateus"
  | "Atacadão"
  | "Açougue Bom Corte"
  | "Hortifruti";

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
  pagaEm?: ISODate;
  /** Desconto aplicado (R$), se houver (autorizado por gerente). */
  desconto?: number;
  cortesia?: boolean;
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
}

export interface SessaoCaixa {
  id: Id;
  lojaId: LojaId;
  usuarioId: UsuarioId;
  abertura: ISODate;
  fechamento?: ISODate;
  valorInicial: number;
  /** Informado às cegas pelo atendente no fechamento. */
  valorInformado?: number;
  /** Esperado pelo sistema (inicial + dinheiro − sangrias). */
  valorEsperado?: number;
  /** valorInformado − valorEsperado (negativo = falta). */
  diferenca?: number;
  sangrias: Sangria[];
}

export interface Despesa {
  id: Id;
  lojaId?: LojaId;
  descricao: string;
  categoria: CategoriaDespesa;
  valor: number;
  vencimento: ISODate;
  pagoEm?: ISODate;
}

export interface ItemEncomenda {
  produtoId: ProdutoId;
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
