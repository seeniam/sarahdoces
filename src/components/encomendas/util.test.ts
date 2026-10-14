// @vitest-environment node
import { describe, expect, it } from "vitest";
import { linkWhatsApp, saldoEncomenda } from "./util";
import type { Encomenda } from "@/types";

function enc(whatsapp: string, over: Partial<Encomenda> = {}): Encomenda {
  return {
    id: "e", cliente: "Vânia Costa", whatsapp,
    itens: [{ nomeLivre: "Bolo", valorUnit: 200, qtd: 1 }],
    dataEntrega: "2026-10-14T15:00:00.000Z", sinal: 100, total: 200,
    status: "pronta", lojaId: "loja-1", ...over,
  };
}

describe("linkWhatsApp", () => {
  it("monta wa.me com 13 dígitos (55 + DDD + celular de 9)", () => {
    const url = linkWhatsApp(enc("(98) 98991-1234"));
    const num = url.match(/wa\.me\/(\d+)/)![1];
    expect(num).toBe("5598989911234"); // 55 + DDD 98 + 98991-1234
    expect(num).toHaveLength(13);
  });

  it("não duplica o código do país quando já vem com 55", () => {
    const url = linkWhatsApp(enc("+55 (98) 98991-1234"));
    expect(url.match(/wa\.me\/(\d+)/)![1]).toHaveLength(13);
  });

  it("inclui a mensagem pronta", () => {
    expect(linkWhatsApp(enc("(98) 98991-1234"))).toContain("text=");
  });
});

describe("saldoEncomenda", () => {
  it("total − sinal", () => {
    expect(saldoEncomenda(enc("x", { total: 200, sinal: 50 }))).toBe(150);
  });
});
