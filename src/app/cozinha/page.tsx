import { Placeholder } from "@/components/shared/Placeholder";

export const metadata = { title: "Cozinha" };

export default function Page() {
  return (
    <main className="min-h-dvh bg-cacau p-6 text-[#f2eae8]">
      <Placeholder
        titulo="Cozinha (KDS)"
        descricao="O quadro de pedidos em tela cheia: Novos, Preparando e Prontos, com quantidades gigantes e cronômetro."
        fase="Fase 4"
      />
    </main>
  );
}
