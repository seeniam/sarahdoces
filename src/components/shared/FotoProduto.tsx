import Image from "next/image";
import { cn } from "cn";
import { BLUR_ACUCAR } from "@/lib/brand/blur";
import { azulejoBackground } from "@/lib/brand/azulejo";
import { ICONES_CATEGORIA, type CategoriaIcone } from "@/components/brand/icons";

type Aspecto = "4:3" | "1:1" | "4:5";

const ASPECTO: Record<Aspecto, string> = {
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
};

export interface FotoProdutoProps {
  /** Caminho em /public (ex.: /images/produtos/cuscuz-completo.jpg). */
  src?: string | null;
  alt: string;
  aspecto?: Aspecto;
  /** Ícone de linha para o fallback elegante. */
  categoria?: CategoriaIcone;
  sizes?: string;
  /** LCP acima da dobra (substitui o antigo `priority`). */
  preload?: boolean;
  className?: string;
  imgClassName?: string;
}

/**
 * Foto de produto com next/image (blur + correção leve) e fallback elegante
 * (fundo açúcar + ícone de linha da categoria). Nunca usa emoji.
 */
export function FotoProduto({
  src,
  alt,
  aspecto = "4:3",
  categoria = "prato",
  sizes = "(max-width: 768px) 50vw, 240px",
  preload,
  className,
  imgClassName,
}: FotoProdutoProps) {
  const Icone = ICONES_CATEGORIA[categoria];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[14px] bg-[#F1EEEC] dark:bg-popover",
        ASPECTO[aspecto],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          placeholder="blur"
          blurDataURL={BLUR_ACUCAR}
          preload={preload}
          className={cn(
            "object-cover [filter:saturate(1.05)_contrast(1.03)]",
            imgClassName,
          )}
        />
      ) : (
        <>
          <div className="absolute inset-0 grid place-items-center">
            <Icone className="size-1/3 text-foreground/35" strokeWidth={1.1} />
          </div>
          <div
            aria-hidden
            className="absolute -bottom-1 -right-1 size-9 opacity-45"
            style={{
              ...azulejoBackground({ color: "#1E4F91", strokeWidth: 1, size: 36 }),
              backgroundRepeat: "no-repeat",
            }}
          />
        </>
      )}
    </div>
  );
}
