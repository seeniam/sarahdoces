"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "cn";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDadosStore } from "@/lib/store";
import { novoId } from "@/lib/id";
import { formatBRL } from "@/lib/format";
import type { BancoMock, Encomenda, ItemEncomenda, LojaId } from "@/types";

interface LinhaItem {
  key: string;
  modo: "cardapio" | "livre";
  produtoId: string;
  nomeLivre: string;
  valorUnit: string;
  qtd: string;
}

function linhaDeItem(it: ItemEncomenda): LinhaItem {
  return {
    key: Math.random().toString(36).slice(2),
    modo: it.nomeLivre ? "livre" : "cardapio",
    produtoId: it.produtoId ?? "",
    nomeLivre: it.nomeLivre ?? "",
    valorUnit: it.valorUnit != null ? String(it.valorUnit) : "",
    qtd: String(it.qtd),
  };
}
const linhaVazia = (): LinhaItem => ({
  key: Math.random().toString(36).slice(2),
  modo: "cardapio",
  produtoId: "",
  nomeLivre: "",
  valorUnit: "",
  qtd: "1",
});

export function EncomendaForm({
  aberto,
  onOpenChange,
  banco,
  encomenda,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  banco: BancoMock;
  /** null = nova encomenda. */
  encomenda: Encomenda | null;
}) {
  const salvarEncomenda = useDadosStore((s) => s.salvarEncomenda);
  const produtosAtivos = useMemo(
    () => banco.produtos.filter((p) => p.ativo),
    [banco.produtos],
  );
  const precoProduto = (id: string) => banco.produtos.find((p) => p.id === id)?.preco ?? 0;

  const [cliente, setCliente] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loja, setLoja] = useState<LojaId>("loja-1");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("15:00");
  const [sinal, setSinal] = useState("");
  const [obs, setObs] = useState("");
  const [itens, setItens] = useState<LinhaItem[]>([linhaVazia()]);
  const [prefKey, setPrefKey] = useState("");

  // Pré-preenche quando abre (nova ou edição).
  const chave = aberto ? (encomenda?.id ?? "nova") : "fechada";
  if (aberto && prefKey !== chave) {
    setPrefKey(chave);
    if (encomenda) {
      setCliente(encomenda.cliente);
      setWhatsapp(encomenda.whatsapp);
      setLoja(encomenda.lojaId);
      const d = new Date(encomenda.dataEntrega);
      setData(
        new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(d),
      );
      setHora(
        new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Fortaleza", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d),
      );
      setSinal(String(encomenda.sinal));
      setObs(encomenda.obs ?? "");
      setItens(encomenda.itens.length ? encomenda.itens.map(linhaDeItem) : [linhaVazia()]);
    } else {
      setCliente("");
      setWhatsapp("");
      setLoja("loja-1");
      setData("");
      setHora("15:00");
      setSinal("");
      setObs("");
      setItens([linhaVazia()]);
    }
  }

  const total = itens.reduce((s, it) => {
    const q = Number(it.qtd) || 0;
    const v = it.modo === "livre" ? Number(it.valorUnit) || 0 : precoProduto(it.produtoId);
    return s + q * v;
  }, 0);

  function alterar(key: string, campo: keyof LinhaItem, v: string) {
    setItens((a) => a.map((x) => (x.key === key ? { ...x, [campo]: v } : x)));
  }

  function salvar() {
    if (!cliente.trim()) return toast.error("Informe o cliente.");
    if (!data) return toast.error("Informe a data de retirada.");
    const itensValidos: ItemEncomenda[] = itens
      .filter((it) =>
        it.modo === "cardapio" ? it.produtoId && Number(it.qtd) > 0 : it.nomeLivre.trim() && Number(it.qtd) > 0,
      )
      .map((it) =>
        it.modo === "cardapio"
          ? { produtoId: it.produtoId, qtd: Number(it.qtd) }
          : { nomeLivre: it.nomeLivre.trim(), valorUnit: Number(it.valorUnit) || 0, qtd: Number(it.qtd) },
      );
    if (itensValidos.length === 0) return toast.error("Adicione ao menos um item.");

    const dataEntrega = new Date(`${data}T${hora || "15:00"}:00-03:00`).toISOString();
    const nova: Encomenda = {
      id: encomenda?.id ?? novoId("enc"),
      cliente: cliente.trim(),
      whatsapp: whatsapp.trim(),
      itens: itensValidos,
      dataEntrega,
      sinal: Number(sinal) || 0,
      total: Number(total.toFixed(2)),
      status: encomenda?.status ?? "orcamento",
      lojaId: loja,
      obs: obs.trim() || undefined,
      ...(encomenda?.entregueEm ? { entregueEm: encomenda.entregueEm } : {}),
      ...(encomenda?.formaPagamentoSaldo ? { formaPagamentoSaldo: encomenda.formaPagamentoSaldo } : {}),
    };
    salvarEncomenda(nova);
    onOpenChange(false);
    toast.success(encomenda ? "Encomenda atualizada" : "Encomenda criada");
  }

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-display text-xl">
            {encomenda ? "Editar encomenda" : "Nova encomenda"}
          </SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="enc-cliente">Cliente</Label>
              <Input id="enc-cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nome" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="enc-wpp">WhatsApp</Label>
              <Input id="enc-wpp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(98) 9…" inputMode="tel" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="enc-data">Retirada</Label>
              <Input id="enc-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="enc-hora">Hora</Label>
              <Input id="enc-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Loja</Label>
            <Select value={loja} onValueChange={(v) => setLoja((v as LojaId) ?? "loja-1")} items={Object.fromEntries(banco.lojas.map((l) => [l.id, l.nome]))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {banco.lojas.map((l) => (<SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {/* Itens */}
          <div className="space-y-2">
            <Label>Itens</Label>
            {itens.map((it) => (
              <div key={it.key} className="space-y-2 rounded-[14px] border border-border p-3">
                <div className="flex gap-1 rounded-full border border-border p-0.5 text-xs">
                  {(["cardapio", "livre"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => alterar(it.key, "modo", m)}
                      className={cn(
                        "flex-1 rounded-full px-2 py-1 font-medium transition-colors",
                        it.modo === m ? "bg-cereja text-white" : "text-muted-foreground",
                      )}
                    >
                      {m === "cardapio" ? "Do cardápio" : "Bolo livre"}
                    </button>
                  ))}
                </div>
                {it.modo === "cardapio" ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={it.produtoId}
                      onValueChange={(v) => alterar(it.key, "produtoId", v ?? "")}
                      items={Object.fromEntries(produtosAtivos.map((p) => [p.id, p.nome]))}
                    >
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Produto" /></SelectTrigger>
                      <SelectContent>
                        {produtosAtivos.map((p) => (<SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <Input type="number" min={1} value={it.qtd} onChange={(e) => alterar(it.key, "qtd", e.target.value)} className="w-20 tnum" aria-label="Quantidade" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input value={it.nomeLivre} onChange={(e) => alterar(it.key, "nomeLivre", e.target.value)} placeholder="Ex.: Bolo 2 andares chocolate" />
                    <div className="flex items-center gap-2">
                      <Input type="number" min={0} step="any" value={it.valorUnit} onChange={(e) => alterar(it.key, "valorUnit", e.target.value)} placeholder="Valor R$" className="flex-1 tnum" aria-label="Valor unitário" />
                      <Input type="number" min={1} value={it.qtd} onChange={(e) => alterar(it.key, "qtd", e.target.value)} className="w-20 tnum" aria-label="Quantidade" />
                    </div>
                  </div>
                )}
                {itens.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItens((a) => a.filter((x) => x.key !== it.key))}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-alerta"
                  >
                    <Trash2 className="size-3.5" />
                    Remover item
                  </button>
                )}
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => setItens((a) => [...a, linhaVazia()])}>
              <Plus className="size-4" />
              Adicionar item
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="enc-sinal">Sinal pago</Label>
              <Input id="enc-sinal" type="number" min={0} step="any" value={sinal} onChange={(e) => setSinal(e.target.value)} placeholder="0,00" className="tnum" />
            </div>
            <div className="space-y-1.5">
              <Label>Total</Label>
              <div className="flex h-9 items-center rounded-lg border border-border bg-secondary/40 px-3 tnum text-sm font-medium">
                {formatBRL(total)}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="enc-obs">Observações</Label>
            <Textarea id="enc-obs" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Sabor, recheio, topo, restrições…" rows={2} />
          </div>
        </div>

        <div className="border-t border-border px-5 py-4">
          <Button onClick={salvar} className="h-12 w-full bg-cereja text-white hover:bg-cereja-calda">
            {encomenda ? "Salvar alterações" : "Criar encomenda"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
