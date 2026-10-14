"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Info, Moon, Printer, RotateCcw, Store, Sun, Volume2, Wallet } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDadosStore, usePreferenciasStore, useHidratado } from "@/lib/store";
import type { DadosState } from "@/lib/store";
import type { Loja } from "@/types";

const FORMAS: { id: "pix" | "dinheiro" | "debito" | "credito"; label: string }[] = [
  { id: "pix", label: "Pix" },
  { id: "dinheiro", label: "Dinheiro" },
  { id: "debito", label: "Cartão de débito" },
  { id: "credito", label: "Cartão de crédito" },
];

export function ConfiguracoesClient() {
  const hidratado = useHidratado();
  const banco = useDadosStore() as DadosState;
  const resetarDemo = useDadosStore((s) => s.resetarDemo);

  const som = usePreferenciasStore((s) => s.somImpressao);
  const alternarSom = usePreferenciasStore((s) => s.alternarSomImpressao);
  const viaCozinha = usePreferenciasStore((s) => s.viaCozinha);
  const alternarViaCozinha = usePreferenciasStore((s) => s.alternarViaCozinha);
  const formasAceitas = usePreferenciasStore((s) => s.formasAceitas);
  const alternarForma = usePreferenciasStore((s) => s.alternarForma);

  const { resolvedTheme, setTheme } = useTheme();
  const escuro = resolvedTheme === "dark";

  const [resetAberto, setResetAberto] = useState(false);

  if (!hidratado) return <div className="h-64 animate-pulse rounded-[20px] bg-muted" />;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="font-display text-3xl leading-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Lojas, impressora, pagamentos e a demonstração.</p>
      </header>

      {/* Lojas */}
      <Secao icone={Store} titulo="Lojas">
        <div className="space-y-3">
          {banco.lojas.map((l) => (
            <LojaEditor key={l.id} loja={l} />
          ))}
        </div>
      </Secao>

      {/* Impressora */}
      <Secao icone={Printer} titulo="Impressora">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium text-foreground">Largura do papel</p>
            <p className="text-xs text-muted-foreground">Bobina térmica padrão</p>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-sm font-medium">80 mm</span>
        </div>
        <Linha
          titulo="Imprimir via da cozinha"
          descricao="Ao enviar a comanda, sai a via para a produção"
          checked={viaCozinha}
          onChange={alternarViaCozinha}
        />
      </Secao>

      {/* Formas de pagamento */}
      <Secao icone={Wallet} titulo="Formas de pagamento aceitas">
        <div className="space-y-1">
          {FORMAS.map((f) => (
            <Linha
              key={f.id}
              titulo={f.label}
              checked={formasAceitas[f.id]}
              onChange={() => alternarForma(f.id)}
            />
          ))}
        </div>
      </Secao>

      {/* Aparência */}
      <Secao icone={escuro ? Moon : Sun} titulo="Aparência & som">
        <Linha
          titulo="Tema escuro (cacau)"
          descricao="Bom para o balcão à noite"
          checked={escuro}
          onChange={() => setTheme(escuro ? "light" : "dark")}
        />
        <Linha
          titulo="Som ao imprimir"
          descricao="Toca um som quando a comanda sai"
          icone={Volume2}
          checked={som}
          onChange={alternarSom}
        />
      </Secao>

      {/* Demonstração */}
      <Secao icone={RotateCcw} titulo="Demonstração">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Volta todos os dados ao estado inicial (seed de hoje).
          </p>
          <Button variant="outline" onClick={() => setResetAberto(true)} className="shrink-0">
            <RotateCcw className="size-4" />
            Resetar demonstração
          </Button>
        </div>
      </Secao>

      {/* Sobre */}
      <section className="rounded-[18px] border border-azulejo/25 bg-azulejo/[0.05] p-5">
        <h2 className="mb-1.5 flex items-center gap-2 font-display text-lg">
          <Info className="size-4 text-azulejo" />
          Sobre esta demonstração
        </h2>
        <p className="text-sm text-muted-foreground">
          Esta é uma demonstração navegável. Os dados (vendas, estoque, caixa, encomendas) são
          fictícios e vivem só neste navegador. Na versão contratada, tudo isso vira real:
          contas por loja, banco de dados na nuvem, impressão de verdade, WhatsApp integrado e
          relatórios ao vivo.
        </p>
      </section>

      <Dialog open={resetAberto} onOpenChange={setResetAberto}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Resetar demonstração?</DialogTitle>
            <DialogDescription>
              Tudo volta ao estado inicial de hoje. Útil para recomeçar a apresentação.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetAberto(false)}>Cancelar</Button>
            <Button
              className="bg-cereja text-white hover:bg-cereja-calda"
              onClick={() => {
                resetarDemo();
                setResetAberto(false);
                toast.success("Demonstração reiniciada");
              }}
            >
              Resetar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Secao({
  icone: Icone,
  titulo,
  children,
}: {
  icone: typeof Store;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-border bg-card p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icone className="size-4 text-muted-foreground" />
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Linha({
  titulo,
  descricao,
  icone: Icone,
  checked,
  onChange,
}: {
  titulo: string;
  descricao?: string;
  icone?: typeof Volume2;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2">
        {Icone && <Icone className="size-4 text-muted-foreground" />}
        <div>
          <p className="text-sm font-medium text-foreground">{titulo}</p>
          {descricao && <p className="text-xs text-muted-foreground">{descricao}</p>}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={titulo} />
    </div>
  );
}

function LojaEditor({ loja }: { loja: Loja }) {
  const editarLoja = useDadosStore((s) => s.editarLoja);
  const [nome, setNome] = useState(loja.nome);
  const [endereco, setEndereco] = useState(loja.endereco);
  // Re-sincroniza quando o banco muda por fora (ex.: Resetar demonstração).
  const [refKey, setRefKey] = useState(`${loja.nome}|${loja.endereco}`);
  const atual = `${loja.nome}|${loja.endereco}`;
  if (refKey !== atual) {
    setRefKey(atual);
    setNome(loja.nome);
    setEndereco(loja.endereco);
  }
  const mudou = nome !== loja.nome || endereco !== loja.endereco;

  return (
    <div className="rounded-[14px] border border-border p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className={cn("size-2.5 rounded-full", loja.cor === "loja-1" ? "bg-cereja" : "bg-azulejo")} />
        <span className="text-xs text-muted-foreground">
          {loja.cor === "loja-1" ? "Loja 1" : "Loja 2"}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`nome-${loja.id}`} className="text-xs">Nome</Label>
          <Input id={`nome-${loja.id}`} value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`end-${loja.id}`} className="text-xs">Endereço</Label>
          <Input id={`end-${loja.id}`} value={endereco} onChange={(e) => setEndereco(e.target.value)} />
        </div>
      </div>
      {mudou && (
        <Button
          size="sm"
          className="mt-2 bg-cereja text-white hover:bg-cereja-calda"
          onClick={() => {
            editarLoja({ lojaId: loja.id, nome: nome.trim() || loja.nome, endereco: endereco.trim() });
            toast.success("Loja atualizada");
          }}
        >
          Salvar
        </Button>
      )}
    </div>
  );
}
