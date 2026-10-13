import type { Usuario } from "@/types";

/**
 * Usuários — TODOS fictícios (nenhum nome de funcionário real).
 * PINs da demo: Dona 1234, Gerente 2222, Atendentes 3333+, Cozinha 4444+.
 */
export const USUARIOS: Usuario[] = [
  { id: "u-sarah", nome: "Sarah", perfil: "dona", pin: "1234", lojaId: null, ativo: true, avatar: "SA" },
  { id: "u-marta", nome: "Marta", perfil: "gerente", pin: "2222", lojaId: "loja-1", ativo: true, avatar: "MA" },

  { id: "u-larissa", nome: "Larissa", perfil: "atendente", pin: "3333", lojaId: "loja-1", ativo: true, avatar: "LA" },
  { id: "u-thiago", nome: "Thiago", perfil: "atendente", pin: "3334", lojaId: "loja-1", ativo: true, avatar: "TH" },
  { id: "u-camila", nome: "Camila", perfil: "atendente", pin: "3335", lojaId: "loja-2", ativo: true, avatar: "CA" },
  { id: "u-rafael", nome: "Rafael", perfil: "atendente", pin: "3336", lojaId: "loja-2", ativo: true, avatar: "RA" },

  { id: "u-antonio", nome: "Seu Antônio", perfil: "cozinha", pin: "4444", lojaId: "loja-1", ativo: true, avatar: "AN" },
  { id: "u-lucia", nome: "Dona Lúcia", perfil: "cozinha", pin: "4445", lojaId: "loja-2", ativo: true, avatar: "LU" },
];

/** Atendente com anomalia de cancelamentos (3× a média). */
export const ATENDENTE_ANOMALIA = "u-thiago";
