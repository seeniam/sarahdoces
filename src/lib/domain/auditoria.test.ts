// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { EventoAuditoria, Usuario } from "@/types";
import {
  acaoExigeAutorizacao,
  podeAutorizar,
  registrarEvento,
  scoreDeRisco,
} from "./auditoria";

describe("registrarEvento", () => {
  it("usa a severidade padrão do tipo quando não informada", () => {
    const ev = registrarEvento(
      { tipo: "cancelamento", lojaId: "loja-1", usuarioId: "u-thiago", descricao: "x" },
      "ev-1",
      "2026-10-13T10:00:00.000Z",
    );
    expect(ev.severidade).toBe("atencao");
    expect(ev.id).toBe("ev-1");
  });
});

describe("autorização (caso negativo: desconto sem PIN)", () => {
  it("desconto exige autorização e atendente não pode autorizar", () => {
    expect(acaoExigeAutorizacao("desconto")).toBe(true);
    expect(podeAutorizar("atendente")).toBe(false);
    expect(podeAutorizar("gerente")).toBe(true);
    expect(podeAutorizar("dona")).toBe(true);
  });

  it("perda não exige autorização", () => {
    expect(acaoExigeAutorizacao("perda")).toBe(false);
  });
});

describe("scoreDeRisco", () => {
  const usuarios: Usuario[] = [
    { id: "u-a", nome: "Ana", perfil: "atendente", pin: "1", lojaId: "loja-1", ativo: true, avatar: "A" },
    { id: "u-b", nome: "Bia", perfil: "atendente", pin: "2", lojaId: "loja-1", ativo: true, avatar: "B" },
  ];
  const ev = (usuarioId: string, i: number): EventoAuditoria => ({
    id: `e${usuarioId}${i}`, tipo: "cancelamento", lojaId: "loja-1", usuarioId,
    descricao: "cancel", data: "2026-10-01T10:00:00.000Z", severidade: "atencao",
  });

  it("ranqueia quem cancela acima da média e explica em linguagem simples", () => {
    const eventos = [
      ...Array.from({ length: 6 }, (_, i) => ev("u-a", i)),
      ...Array.from({ length: 2 }, (_, i) => ev("u-b", i)),
    ];
    const risco = scoreDeRisco(eventos, usuarios);
    expect(risco[0].usuarioId).toBe("u-a");
    expect(risco[0].score).toBe(100);
    expect(risco[0].explicacao).toMatch(/mais que a média/);
    expect(risco[0].explicacao).toContain("3×");
  });
});
