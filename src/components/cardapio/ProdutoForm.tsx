"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Adicional, BancoMock, Produto } from "@/types";

export function ProdutoForm({
  aberto,
  onOpenChange,
  banco,
  produto,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  banco: BancoMock;
  produto: Produto | null;
}) {
  const salvarProduto = useDadosStore((s) => s.salvarProduto);

  const [nome, setNome] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [preco, setPreco] = useState("");
  const [custo, setCusto] = useState("");
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [prefKey, setPrefKey] = useState("");

  const chave = aberto ? (produto?.id ?? "novo") : "fechado";
  if (aberto && prefKey !== chave) {
    setPrefKey(chave);
    setNome(produto?.nome ?? "");
    setCategoriaId(produto?.categoriaId ?? banco.categorias[0]?.id ?? "");
    setPreco(produto ? String(produto.preco) : "");
    setCusto(produto ? String(produto.custo) : "");
    setAdicionais(produto?.adicionais ?? []);
  }

  function salvar() {
    if (!nome.trim()) return toast.error("Informe o nome do produto.");
    if (!categoriaId) return toast.error("Escolha a categoria.");
    if (!produto && Number(preco) <= 0) return toast.error("Informe o preço.");
    const novo: Produto = {
      id: produto?.id ?? novoId("prod"),
      nome: nome.trim(),
      categoriaId,
      // Preço de existentes muda só pelo fluxo "Alterar preço" (sensível).
      preco: produto ? produto.preco : Number(preco),
      custo: produto ? produto.custo : Number(custo) || 0,
      ativo: produto?.ativo ?? true,
      foto: produto?.foto ?? null,
      fichaTecnicaId: produto?.fichaTecnicaId,
      adicionais,
    };
    salvarProduto(novo);
    onOpenChange(false);
    toast.success(produto ? "Produto atualizado" : "Produto criado");
  }

  return (
    <Sheet open={aberto} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-display text-xl">
            {produto ? "Editar produto" : "Novo produto"}
          </SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="prod-nome">Nome</Label>
            <Input id="prod-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Cuscuz completo" />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoriaId} onValueChange={(v) => setCategoriaId(v ?? "")} items={Object.fromEntries(banco.categorias.map((c) => [c.id, c.nome]))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                {banco.categorias.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {produto ? (
            <div className="flex items-center justify-between rounded-[14px] border border-border bg-secondary/40 px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">Preço atual</span>
              <span className="tnum font-medium">{formatBRL(produto.preco)}</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prod-preco">Preço</Label>
                <Input id="prod-preco" type="number" min={0} step="any" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0,00" className="tnum" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod-custo">Custo (CMV)</Label>
                <Input id="prod-custo" type="number" min={0} step="any" value={custo} onChange={(e) => setCusto(e.target.value)} placeholder="0,00" className="tnum" />
              </div>
            </div>
          )}
          {produto && (
            <p className="text-xs text-muted-foreground">
              O preço muda pelo botão “Alterar preço” (ação registrada na auditoria).
            </p>
          )}

          {/* Adicionais */}
          <div className="space-y-2">
            <Label>Adicionais</Label>
            {adicionais.map((a, i) => (
              <div key={a.id} className="flex items-center gap-2">
                <Input
                  value={a.nome}
                  onChange={(e) =>
                    setAdicionais((arr) => arr.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)))
                  }
                  placeholder="Nome"
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={a.preco}
                  onChange={(e) =>
                    setAdicionais((arr) => arr.map((x, j) => (j === i ? { ...x, preco: Number(e.target.value) || 0 } : x)))
                  }
                  placeholder="R$"
                  className="w-20 tnum"
                  aria-label="Preço do adicional"
                />
                <Button variant="ghost" size="icon-sm" aria-label="Remover adicional" onClick={() => setAdicionais((arr) => arr.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={() => setAdicionais((arr) => [...arr, { id: novoId("ad"), nome: "", preco: 0 }])}>
              <Plus className="size-4" />
              Adicionar
            </Button>
          </div>
        </div>

        <div className="border-t border-border px-5 py-4">
          <Button onClick={salvar} className="h-12 w-full bg-cereja text-white hover:bg-cereja-calda">
            {produto ? "Salvar alterações" : "Criar produto"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
