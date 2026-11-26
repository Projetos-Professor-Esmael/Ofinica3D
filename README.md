# Oficina 3D

Editor 3D online no estilo OpenSCAD, com assistente em português, que roda **inteiro no navegador** e é publicado no GitHub Pages. Nada é enviado a servidores.

Descreva o objeto ("vaso com 120 de altura e 25 de raio"), escolha um modelo paramétrico, ajuste as medidas com os controles ou edite o código OpenSCAD. Veja a peça em 3D, receba avisos de impressão e baixe em **STL, 3MF, OBJ, AMF ou OFF**.

## O que tem
- Motor OpenSCAD em WebAssembly (pacote `openscad-wasm` 0.0.4, GPL-2.0) com o backend Manifold.
- 6 modelos paramétricos: caixa, chaveiro com texto, vaso, suporte de celular, engrenagem, porta-lápis.
- Assistente: entende o pedido, escolhe o modelo, aplica as medidas citadas (mm ou cm) e responde dúvidas comuns. Funciona sem internet e sem chave de API.
- Revisão automática: explica erros do compilador em português e avisa sobre peças grandes demais, pequenas demais ou com paredes finas.
- Exportação 3MF gerada no próprio site (o pacote do motor não exporta 3MF).
- Layout responsivo (celular, tablet, computador), com áreas seguras do iPhone.
- Automação no GitHub: publicação a cada commit e teste diário que renderiza todos os modelos.

## Arquivos
| Arquivo | Função |
|---|---|
| `index.html`, `style.css`, `app.js` | O site |
| `models.json` | Biblioteca de modelos (código OpenSCAD + parâmetros) |
| `vendor/` | OpenSCAD WASM (14 MB), Three.js r147 e OrbitControls |
| `scripts/test_models.mjs` | Teste que renderiza todos os modelos |
| `.github/workflows/` | `deploy.yml` (Pages) e `test-models.yml` (teste diário) |

## Limites honestos
- O primeiro carregamento baixa cerca de 14 MB (depois o navegador guarda em cache).
- O assistente é baseado em regras e na biblioteca de modelos, não em IA generativa. Ele não inventa objetos novos; para isso use a aba Código.
- As automações do GitHub Actions rodam por eventos do repositório (commit, agenda, manual), não quando alguém abre o site.
- Texto do chaveiro: apenas A-Z, 0-9 e espaço (fonte de pixels própria, pois o pacote não traz fontes).
- Não testado em iPhone ou Android reais, apenas em navegador de teste em tela de celular e de computador.
- Material informativo: confira medidas e resistência antes de usar a peça.

## Licenças
Projeto distribuído sob GPL-2.0, compatível com o OpenSCAD. Three.js: MIT.
