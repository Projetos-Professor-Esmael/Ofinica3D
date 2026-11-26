# Tutorial: publicar a Oficina 3D no GitHub Pages

## 1. Enviar os arquivos
1. Crie um repositório público no GitHub (ex.: `oficina3d`).
2. Envie **todo o conteúdo** da pasta, incluindo `vendor/` e o arquivo `.nojekyll`.
3. A pasta `.github` costuma ser ignorada no envio pelo navegador. Crie os dois arquivos pelo site: Add file > Create new file, digite `.github/workflows/deploy.yml` no nome, cole o conteúdo e confirme. Repita com `test-models.yml`. Com Git no computador (`git add -A`) isso não é necessário.
4. O arquivo `vendor/openscad.js` tem 14 MB, abaixo do limite de 100 MB por arquivo do GitHub. Se o envio pelo navegador falhar, use Git.

## 2. Ativar o Pages
Settings > Pages > Build and deployment > Source: **GitHub Actions**. O workflow "Publicar no GitHub Pages" roda a cada commit na branch `main`; acompanhe na aba Actions. O endereço será `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

## 3. Conferir
Abra o endereço. O canto superior deve mostrar "Pronto" e um objeto amarelo aparecer. Se ficar em "Carregando motor…" por muito tempo, veja a seção de problemas.

## 4. Como usar
- **Assistente:** escreva o que quer ("caixa com 80 de largura", 'chaveiro "ANA"'). Ele monta o modelo e aplica as medidas.
- **Modelos:** escolha um modelo e ajuste os controles; a peça atualiza sozinha.
- **Código:** edite o OpenSCAD. Formas básicas: `cube`, `cylinder`, `sphere`. `difference(){A;B;}` subtrai B de A; `union(){}` soma. Medidas em milímetros.
- **Baixar:** escolha o formato (STL é o mais compatível; 3MF guarda unidades) e clique em Baixar. Abra no fatiador (Cura, PrusaSlicer, Bambu Studio etc.).
- Antes de imprimir, leia os avisos de "Revisão" no chat.

## 5. Adicionar um modelo novo
Edite `models.json` e acrescente um item com `id`, `nome`, `palavras` (termos que o assistente reconhece), `dica`, `params` e `scad`. Cada parâmetro é `[nome, valor padrão, rótulo, mínimo, máximo]`; valor em texto vira campo de texto. O código usa as variáveis dos parâmetros. Ao dar commit, o teste diário confirma que o modelo renderiza (veja Actions > "Testar modelos 3D"). Para testar no computador: `node scripts/test_models.mjs` (Node 18 ou superior).

## 6. Rodar no computador
Abra um terminal na pasta e execute `python3 -m http.server 8000`, depois acesse `http://localhost:8000`. Abrir o `index.html` direto do disco não funciona, porque navegadores bloqueiam módulos em `file://`.

## 7. Problemas comuns
| Sintoma | Causa provável | Solução |
|---|---|---|
| Fica em "Carregando motor…" | Pasta `vendor` não enviada ou conexão lenta | Confirme `vendor/openscad.js` no repositório; aguarde o primeiro download de 14 MB |
| Página 404 | Pages ainda não publicou | Veja Actions e aguarde 1 a 2 minutos |
| Workflow não aparece | Pasta `.github` não enviada | Passo 1.3 |
| "Erro no código" | Sintaxe do OpenSCAD | Leia a mensagem em Código e a explicação do assistente |
| Peça vazia | Subtração maior que a peça ou objeto fora de `union` | Reduza o objeto subtraído |
| Celular lento | Peça com muitos triângulos | Diminua `$fn` (resolução de curvas) no código |
| 3MF não abre | Fatiador antigo | Exporte em STL |

## 8. Próximas etapas (não incluídas)
IA local no navegador (WebLLM, exige WebGPU e baixa centenas de MB), chave de API opcional do usuário para conversa livre, conversor de imagem para relevo, instalação como PWA com uso offline.
