/** Id curto único para entidades criadas em runtime (ações do usuário). */
export function novoId(prefixo: string): string {
  const r =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefixo}-${r}`;
}

/** Instante atual em ISO (usado em ações de runtime). */
export function agoraISO(): string {
  return new Date().toISOString();
}
