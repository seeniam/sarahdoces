import { Plus, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Azulejo } from "@/components/brand/Azulejo";
import { FotoProduto } from "@/components/shared/FotoProduto";
import { NumeroHeroi } from "@/components/shared/NumeroHeroi";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ICONES_CATEGORIA } from "@/components/brand/icons";
import { Button } from "@/components/ui/button";
import { ToastDemo } from "@/components/design-system/ToastDemo";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatBRL } from "@/lib/format";

export const metadata = { title: "Sistema de design" };

const PALETA = [
  { nome: "porcelana", hex: "#F5F6F8", papel: "Fundo", escuro: true },
  { nome: "superficie", hex: "#FFFFFF", papel: "Painéis", escuro: true },
  { nome: "cereja", hex: "#9E1B32", papel: "Primária · Loja 1" },
  { nome: "cereja-calda", hex: "#6F0F22", papel: "Hover · títulos" },
  { nome: "azulejo", hex: "#1E4F91", papel: "Secundária · Loja 2" },
  { nome: "acucar", hex: "#F6DDDF", papel: "Realce · seleção", escuro: true },
  { nome: "cacau", hex: "#2B1B18", papel: "Texto · sidebar" },
  { nome: "pistache", hex: "#5E7F36", papel: "Positivo · pronto" },
  { nome: "doce-de-leite", hex: "#C98A2E", papel: "Atenção" },
  { nome: "alerta", hex: "#C8372D", papel: "Crítico" },
];

const ESCALA = [
  { px: 61, rotulo: "Número-herói", display: true },
  { px: 39, rotulo: "Título de página", display: true },
  { px: 25, rotulo: "Seção", display: true },
  { px: 20, rotulo: "Subtítulo" },
  { px: 16, rotulo: "Corpo" },
  { px: 14, rotulo: "Apoio" },
  { px: 12, rotulo: "Legenda" },
];

const PRODUTOS = [
  { nome: "Cuscuz completo", preco: 14, foto: "/images/produtos/cuscuz-completo.jpg", cat: "cuscuzeira" as const },
  { nome: "PF de carne", preco: 20, foto: "/images/produtos/pf-carne.jpg", cat: "prato" as const },
  { nome: "Suco natural", preco: 6, foto: "/images/produtos/suco-natural.jpg", cat: "suco" as const },
  { nome: "Torta de limão", preco: 10, foto: null, cat: "bolo" as const },
];

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-2xl text-foreground">{titulo}</h2>
        {descricao && (
          <p className="max-w-[60ch] text-sm text-muted-foreground">{descricao}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-16 px-5 py-10 sm:px-8">
      {/* Cabeçalho */}
      <header className="flex items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Sistema de design
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Paleta */}
      <Secao
        titulo="Paleta"
        descricao="Cereja do logo, azulejo ludovicense e o branco de louça. Loja 1 é cereja, Loja 2 é azulejo em todo o sistema."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PALETA.map((c) => (
            <div
              key={c.nome}
              className="overflow-hidden rounded-[14px] border border-border bg-card shadow-soft"
            >
              <div
                className="h-20 w-full"
                style={{
                  backgroundColor: c.hex,
                  boxShadow: c.escuro ? "inset 0 0 0 1px rgb(43 27 24 / 0.08)" : undefined,
                }}
              />
              <div className="space-y-0.5 p-3">
                <p className="text-sm font-semibold text-foreground">{c.nome}</p>
                <p className="text-xs text-muted-foreground tnum">{c.hex}</p>
                <p className="text-xs text-muted-foreground">{c.papel}</p>
              </div>
            </div>
          ))}
        </div>
      </Secao>

      {/* Tipografia */}
      <Secao
        titulo="Tipografia"
        descricao="Gloock nos títulos e números-herói; Hanken Grotesk em todo o resto, com tabular-nums nos valores."
      >
        <Card className="divide-y divide-border p-0">
          {ESCALA.map((t) => (
            <div
              key={t.px}
              className="flex items-baseline justify-between gap-6 px-5 py-4"
            >
              <span
                className={t.display ? "font-display" : "font-sans"}
                style={{ fontSize: `${Math.min(t.px, 44)}px`, lineHeight: 1.1 }}
              >
                Sarah Rangel
              </span>
              <span className="shrink-0 text-xs text-muted-foreground tnum">
                {t.px}px · {t.rotulo}
              </span>
            </div>
          ))}
        </Card>
      </Secao>

      {/* Número-herói */}
      <Secao
        titulo="Número-herói"
        descricao="O R$ é menor (60%) e alinhado ao topo. Usado no faturamento do dia e no número da comanda."
      >
        <Card className="p-7">
          <NumeroHeroi valor={4812.5} />
          <p className="mt-2 text-sm text-muted-foreground">
            faturado hoje ·{" "}
            <span className="font-medium text-pistache">+12% vs terça passada</span>
          </p>
        </Card>
      </Secao>

      {/* Botões */}
      <Secao
        titulo="Botões"
        descricao="Copy direta e operacional. No PDV e na cozinha os alvos de toque passam de 56px."
      >
        <Card className="space-y-6 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg">Enviar para cozinha</Button>
            <Button size="lg" variant="secondary">
              Adicionar item
            </Button>
            <Button size="lg" variant="outline">
              Fechar caixa
            </Button>
            <Button size="lg" variant="ghost">
              Cancelar
            </Button>
            <Button size="lg" variant="destructive">
              Registrar perda
            </Button>
            <Button size="lg" variant="link">
              Ver auditoria
            </Button>
            <Button size="lg" disabled>
              Indisponível
            </Button>
          </div>
          <Separator />
          <div className="flex flex-wrap items-center gap-3">
            <Button className="h-14 px-7 text-base">
              <ShoppingBag className="size-5" />
              Alvo de toque (PDV)
            </Button>
            <Button size="icon" variant="outline" aria-label="Adicionar">
              <Plus />
            </Button>
          </div>
        </Card>
      </Secao>

      {/* Toasts */}
      <Secao
        titulo="Avisos (toasts)"
        descricao="Cada variante tem seu par de cores (título + descrição na mesma família), com contraste AA sobre o fundo. Toque para disparar."
      >
        <Card className="p-6">
          <ToastDemo />
        </Card>
      </Secao>

      {/* Badges + chips de loja */}
      <Secao
        titulo="Status e lojas"
        descricao="Status com ponto colorido + texto, nunca só cor. O chip de loja carrega a cor da loja."
      >
        <Card className="flex flex-wrap items-center gap-3 p-6">
          <StatusBadge variante="ok">Pronto</StatusBadge>
          <StatusBadge variante="atencao">Preparando</StatusBadge>
          <StatusBadge variante="critico">Caixa com diferença</StatusBadge>
          <StatusBadge variante="info">Transferência</StatusBadge>
          <StatusBadge variante="neutro">Rascunho</StatusBadge>
          <Separator orientation="vertical" className="h-6" />
          <span className="inline-flex items-center gap-2 rounded-full bg-loja-1/12 px-3 py-1 text-sm font-medium text-loja-1">
            <span className="size-2 rounded-full bg-loja-1" />
            Loja 1 — Centro
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-loja-2/12 px-3 py-1 text-sm font-medium text-loja-2">
            <span className="size-2 rounded-full bg-loja-2" />
            Loja 2 — Cohama
          </span>
        </Card>
      </Secao>

      {/* Ícones */}
      <Secao
        titulo="Ícones de categoria"
        descricao="Desenhados por nós, mesma linguagem do lucide (traço 1.5)."
      >
        <Card className="grid grid-cols-3 gap-4 p-6 sm:grid-cols-6">
          {Object.entries(ICONES_CATEGORIA).map(([nome, Icone]) => (
            <div key={nome} className="flex flex-col items-center gap-2">
              <div className="grid size-14 place-items-center rounded-[14px] bg-acucar text-cereja">
                <Icone className="size-7" />
              </div>
              <span className="text-xs text-muted-foreground">{nome}</span>
            </div>
          ))}
        </Card>
      </Secao>

      {/* Azulejo */}
      <Secao
        titulo="O azulejo"
        descricao="Assinatura visual. Tempero, não papel de parede: inteiro no login, discreto no rodapé da sidebar, grande nos estados vazios."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative h-44 overflow-hidden rounded-[14px] border border-border bg-porcelana">
            <Azulejo tom="azulejo" tile={76} className="absolute inset-0" />
            <span className="absolute bottom-3 left-3 rounded-full bg-card/85 px-2.5 py-1 text-xs font-medium backdrop-blur">
              azulejo · nítido
            </span>
          </div>
          <div className="relative h-44 overflow-hidden rounded-[14px] bg-cacau">
            <Azulejo tom="branco" opacity={0.08} tile={76} fade="top" className="absolute inset-0" />
            <span className="absolute bottom-3 left-3 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
              sidebar · 8%
            </span>
          </div>
          <div className="relative grid h-44 place-items-center overflow-hidden rounded-[14px] border border-border bg-card">
            <Azulejo tom="cereja" opacity={0.1} tile={120} className="absolute inset-0" />
            <p className="relative px-6 text-center text-sm text-muted-foreground">
              Nenhuma perda registrada hoje.
            </p>
          </div>
        </div>
      </Secao>

      {/* Card de produto + comanda */}
      <Secao
        titulo="Produto e comanda"
        descricao="Foto real 4:3 com fallback elegante (fundo açúcar + ícone). A comanda térmica imita 80mm com borda serrilhada."
      >
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_300px]">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PRODUTOS.map((p) => (
              <Card key={p.nome} className="gap-0 overflow-hidden p-0 shadow-soft">
                <FotoProduto
                  src={p.foto}
                  alt={p.nome}
                  categoria={p.cat}
                  className="rounded-none"
                />
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {p.nome}
                    </p>
                    <p className="text-sm text-muted-foreground tnum">
                      {formatBRL(p.preco)}
                    </p>
                  </div>
                  <Button size="icon" aria-label={`Adicionar ${p.nome}`}>
                    <Plus />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Comanda térmica — sempre "papel" (independe do tema) */}
          <div className="serrilha-baixo mx-auto w-[280px] bg-white pb-5 text-[#2B1B18] shadow-comanda">
            <Azulejo tom="cacau" tile={40} className="h-6 w-full" />
            <div className="space-y-3 px-5 pt-4 text-center">
              <Logo variante="compacta" tagline={false} className="justify-center" />
              <div>
                <p className="text-xs text-[#2B1B18]/60">Comanda</p>
                <p className="font-display text-4xl leading-none">#0187</p>
              </div>
              <div className="flex justify-between text-xs text-[#2B1B18]/70">
                <span>Mesa 4</span>
                <span className="tnum">07:42</span>
              </div>
              <div className="border-y border-dashed border-[#2B1B18]/25 py-3 text-left text-sm">
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <span className="font-display text-base tnum">1×</span>
                    <span>PF de carne</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-display text-base tnum">1×</span>
                    <div>
                      <p>Cuscuz completo</p>
                      <p className="font-bold">obs: ovo mole</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-display text-base tnum">2×</span>
                    <span>Suco de acerola</span>
                  </li>
                </ul>
              </div>
              <p className="text-xs text-[#2B1B18]/70">Atendente: Ana</p>
            </div>
          </div>
        </div>
      </Secao>
    </div>
  );
}
