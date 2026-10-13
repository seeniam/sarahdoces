import type { Route } from "next";
import type { Perfil } from "@/types";
import {
  LayoutDashboard,
  ShoppingCart,
  ReceiptText,
  CakeSlice,
  Boxes,
  ClipboardList,
  Trash2,
  Wallet,
  Eye,
  UtensilsCrossed,
  Users,
  Settings,
  Bell,
  type LucideIcon,
} from "lucide-react";

export type SecaoNav = "operacao" | "gestao" | "admin";

export interface ItemNav {
  href: Route;
  label: string;
  icone: LucideIcon;
  perfis: Perfil[];
  secao: SecaoNav;
}

/** Menu do sistema (sidebar). Filtrado por perfil conforme PRD §4. */
export const NAV: ItemNav[] = [
  { href: "/painel", label: "Painel", icone: LayoutDashboard, perfis: ["dona", "gerente"], secao: "operacao" },
  { href: "/pdv", label: "PDV", icone: ShoppingCart, perfis: ["dona", "gerente", "atendente"], secao: "operacao" },
  { href: "/comandas", label: "Comandas", icone: ReceiptText, perfis: ["dona", "gerente", "atendente"], secao: "operacao" },
  { href: "/encomendas", label: "Encomendas", icone: CakeSlice, perfis: ["dona", "gerente", "atendente"], secao: "operacao" },
  { href: "/estoque", label: "Estoque", icone: Boxes, perfis: ["dona", "gerente"], secao: "gestao" },
  { href: "/fichas-tecnicas", label: "Fichas técnicas", icone: ClipboardList, perfis: ["dona", "gerente"], secao: "gestao" },
  { href: "/perdas", label: "Perdas", icone: Trash2, perfis: ["dona", "gerente"], secao: "gestao" },
  { href: "/financeiro", label: "Financeiro", icone: Wallet, perfis: ["dona", "gerente"], secao: "gestao" },
  { href: "/auditoria", label: "Auditoria", icone: Eye, perfis: ["dona", "gerente"], secao: "gestao" },
  { href: "/cardapio", label: "Cardápio", icone: UtensilsCrossed, perfis: ["dona", "gerente"], secao: "admin" },
  { href: "/equipe", label: "Equipe", icone: Users, perfis: ["dona"], secao: "admin" },
  { href: "/configuracoes", label: "Configurações", icone: Settings, perfis: ["dona", "gerente"], secao: "admin" },
];

export const TITULOS_SECAO: Record<SecaoNav, string> = {
  operacao: "Operação",
  gestao: "Gestão",
  admin: "Administração",
};

/** Itens visíveis para um perfil, na ordem do menu. */
export function itensDoPerfil(perfil: Perfil): ItemNav[] {
  return NAV.filter((i) => i.perfis.includes(perfil));
}

/** Rota inicial após login (PRD/plano): Dona→painel, Cozinha→cozinha, resto→pdv. */
export function rotaInicial(perfil: Perfil): Route {
  if (perfil === "dona") return "/painel";
  if (perfil === "cozinha") return "/cozinha";
  return "/pdv";
}

// ---- Bottom navigation (celular): itens principais curados por perfil ----
export interface ItemBottom {
  href: Route;
  label: string;
  icone: LucideIcon;
}

function bottom(href: Route, overrides?: Partial<ItemBottom>): ItemBottom {
  const n = NAV.find((i) => i.href === href)!;
  return {
    href,
    label: overrides?.label ?? n.label,
    icone: overrides?.icone ?? n.icone,
  };
}

/** Itens principais da bottom nav por perfil (o restante vai em "Mais"). */
export const BOTTOM_NAV: Record<Perfil, ItemBottom[]> = {
  dona: [
    bottom("/painel"),
    bottom("/auditoria", { label: "Alertas", icone: Bell }),
    bottom("/financeiro"),
    bottom("/perdas"),
  ],
  gerente: [
    bottom("/pdv"),
    bottom("/comandas"),
    bottom("/estoque"),
    bottom("/perdas"),
  ],
  atendente: [bottom("/pdv"), bottom("/comandas"), bottom("/encomendas")],
  cozinha: [],
};

/** O perfil pode acessar a rota (casa sub-rotas: /estoque/compras → /estoque). */
export function podeAcessarRota(perfil: Perfil, pathname: string): boolean {
  // A cozinha só usa a tela cheia /cozinha (fora do layout com sidebar).
  if (pathname === "/cozinha") return perfil === "cozinha";
  const item = NAV.find(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`),
  );
  return item ? item.perfis.includes(perfil) : false;
}
