import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Azulejo } from "@/components/brand/Azulejo";
import { Button } from "@/components/ui/button";
import { BLUR_ESCURO } from "@/lib/brand/blur";

/**
 * Landing "/" — feita para a Sarah (café & confeitaria, 2 lojas em São Luís).
 * Foto-herói real, a frase-promessa e três blocos dor → solução, cada um com um
 * recorte real de tela do sistema. Sem jargão de marketing: fala a dor do dia a
 * dia e mostra onde ela some. Estática (server component) e responsiva 390/1440.
 */

interface Bloco {
  dor: string;
  solucao: string;
  imagem: string;
  alt: string;
  w: number;
  h: number;
}

const BLOCOS: Bloco[] = [
  {
    dor: "Venda que não vira registro.",
    solucao:
      "No caixa, todo pedido vira comanda antes de ir para a cozinha. Nada sai sem passar pelo sistema — e cada desconto, cortesia ou cancelamento fica guardado na auditoria.",
    imagem: "/images/landing/pdv-caixa.png",
    alt: "Tela do caixa com a comanda de uma mesa sendo montada",
    w: 1440,
    h: 900,
  },
  {
    dor: "Pedido no grito, papel na parede.",
    solucao:
      "A comanda cai na tela da cozinha no mesmo instante em que o caixa envia. Acabou a fila de papelzinho e o pedido que se perde no movimento.",
    imagem: "/images/landing/cozinha.png",
    alt: "Painel da cozinha com os pedidos em preparo",
    w: 1440,
    h: 900,
  },
  {
    dor: "A carne que some no fim do mês.",
    solucao:
      "O estoque desconta sozinho pelo que foi vendido, pela ficha de cada prato. Quando falta, a tela diz exatamente quanto sumiu sem explicação — e quanto custou.",
    imagem: "/images/landing/perdas.png",
    alt: "Tela de perdas mostrando para onde foi a carne",
    w: 1121,
    h: 291,
  },
];

export default function Home() {
  return (
    <main className="flex min-h-full flex-1 flex-col bg-background">
      {/* ---------- Herói ---------- */}
      <section className="relative overflow-hidden">
        <Azulejo
          tom="azulejo"
          opacity={0.07}
          tile={104}
          fade="bottom"
          className="absolute inset-x-0 top-0 h-80"
        />
        <div className="relative mx-auto w-full max-w-6xl px-5 pb-6 pt-8 sm:px-8 sm:pt-12">
          <Logo variante="completa" />

          <div className="mt-10 grid items-end gap-8 lg:mt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
            <div className="max-w-xl">
              <p className="font-medium text-azulejo">
                Gestão para café &amp; confeitaria · São Luís
              </p>
              <h1 className="mt-4 font-display text-[2.6rem] leading-[1.03] text-foreground sm:text-6xl">
                Cada pedido registrado, cada grama de carne contada.
              </h1>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
                O sistema que fecha as três portas por onde o dinheiro escapa de
                um café com duas lojas: a venda sem comanda, o pedido no grito e
                o estoque que ninguém confere.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  size="lg"
                  className="h-12 px-7 text-base"
                  nativeButton={false}
                  render={<Link href="/login" />}
                >
                  Entrar na demonstração
                  <ArrowRight className="size-5" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Dados de exemplo · nada é cobrado
                </span>
              </div>
            </div>

            {/* Foto-herói emoldurada em azulejo (como no login) */}
            <div className="relative">
              <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[22px] shadow-raised lg:aspect-[4/5]">
                <Image
                  src="/images/hero.jpg"
                  alt="Doces e salgados da Sarah Rangel"
                  fill
                  priority
                  placeholder="blur"
                  blurDataURL={BLUR_ESCURO}
                  sizes="(max-width: 1024px) 100vw, 44vw"
                  className="object-cover object-center [filter:saturate(1.05)_contrast(1.03)]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b100e]/70 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Dor → solução ---------- */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl text-foreground sm:text-4xl">
            Onde o dinheiro costuma vazar
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Três problemas que todo café conhece — e como ficam na tela.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-16 sm:gap-24">
          {BLOCOS.map((b, i) => (
            <article
              key={b.dor}
              className="grid items-center gap-7 lg:grid-cols-2 lg:gap-14"
            >
              {/* Texto */}
              <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                <h3 className="font-display text-2xl leading-tight text-foreground sm:text-[1.9rem]">
                  {b.dor}
                </h3>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-foreground/85">
                  {b.solucao}
                </p>
              </div>

              {/* Recorte real da tela */}
              <figure className={i % 2 === 1 ? "lg:order-1" : undefined}>
                <div className="overflow-hidden rounded-[18px] border border-border bg-card shadow-soft">
                  <Image
                    src={b.imagem}
                    alt={b.alt}
                    width={b.w}
                    height={b.h}
                    placeholder="blur"
                    blurDataURL={BLUR_ESCURO}
                    sizes="(max-width: 1024px) 100vw, 46vw"
                    className="h-auto w-full"
                  />
                </div>
                <figcaption className="mt-2.5 pl-1 text-xs text-muted-foreground">
                  {b.alt}
                </figcaption>
              </figure>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Fechamento ---------- */}
      <section className="relative overflow-hidden border-t border-border">
        <Azulejo
          tom="cereja"
          opacity={0.06}
          tile={104}
          fade="top"
          className="absolute inset-x-0 bottom-0 h-64"
        />
        <div className="relative mx-auto w-full max-w-6xl px-5 py-16 text-center sm:px-8 sm:py-20">
          <h2 className="mx-auto max-w-lg font-display text-3xl leading-tight text-foreground sm:text-4xl">
            Veja funcionando com os números de um dia cheio.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
            Entre como a Sarah e abra a demonstração guiada: um tour de dois
            minutos pelos quatro pontos que mais pesam no caixa.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="h-12 px-7 text-base"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Entrar na demonstração
              <ArrowRight className="size-5" />
            </Button>
          </div>
          <div className="mt-14 flex items-center justify-center">
            <Logo variante="compacta" />
          </div>
        </div>
      </section>
    </main>
  );
}
