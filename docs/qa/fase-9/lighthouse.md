# Lighthouse — Fase 9 (preset desktop)

Rodado contra o build de produção (`next start -p 4319`) com Chrome headless.

## Landing `/`
| Categoria | Nota |
|---|---|
| Performance | **99** |
| Acessibilidade | **100** |
| Boas práticas | **100** |
| SEO | 66 |

LCP 1,0 s · TBT 30 ms. O SEO 66 é **só** o `noindex` exigido pela demo privada
(`is-crawlable`); todos os outros itens de SEO passam.

## Painel `/painel` (sessão autenticada semeada)
| Categoria | Nota |
|---|---|
| Performance | ~45–63 (ruidoso em máquina local carregada) |
| Acessibilidade | **100** |
| Boas práticas | **100** |
| SEO | 63 (mesmo `noindex`) |

O custo de performance é inerente ao protótipo **frontend-only**: geração/parse
do seed de 30 dias no cliente + hidratação do Recharts. Mitigação aplicada:
os gráficos Recharts do painel carregam sob demanda (`next/dynamic`, sem
bloquear a hidratação inicial). Ver `docs/DECISOES.md` §D9.5.

Correções de acessibilidade desta fase (painel 92 → 100): rótulo do `select` de
loja, contraste dos rótulos de seção da sidebar e token `pistache-forte` para
texto pequeno positivo sobre fundo claro.
