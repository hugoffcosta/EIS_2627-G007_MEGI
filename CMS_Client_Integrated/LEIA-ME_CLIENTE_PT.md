# CMS — Páginas do Cliente, integradas com Courier

## O que está incluído

Este conjunto utiliza a MESMA base visual que os ficheiros Courier fornecidos: `Registration Courier_CSS.css` e `Menu_courierCSS.css` (verde-petróleo `#083e43`, verde `#13866d`, verde menta `#b9e6d2`, fundo `#e5efe8`, tipografia `Segoe UI`). Não é uma identidade visual separada.

Páginas novas:

- `Registration Client_HTML.html`: registo de cliente em quatro etapas, com validação.
- `Login Client_HTML.html`: login de demonstração e ligação à área pessoal.
- `Menu_clientHTML.html`: dashboard com Home, New Order, My Orders, History e My Profile.

Ficheiros novos de estilos e comportamento:

- `Registration Client_CSS.css`, `Registration Client_JS.js`
- `Login Client_CSS.css`, `Login Client_JS.js`
- `Menu_clientCSS.css`, `Menu_clientJS.js`

Ficheiros existentes integrados:

- `menu registration.html`: o botão **Register as Client** abre a nova página de registo.
- `menu login.html`: o botão **Log in as Client** abre o novo login.
- `Menu_courierJS.js`: inclui uma pequena ponte para disponibilizar os pedidos de cliente e atualizar o estado quando o courier aceita/processa uma entrega.

Os restantes ficheiros do Courier foram preservados da pasta original fornecida.

## Como instalar no teu VS Code (Windows)

1. Faz uma cópia da tua pasta atual do projeto (segurança).
2. Extrai **CMS_Client_Integrated.zip** com o 7-Zip.
3. Abre o VS Code, seleciona `File > Open Folder` e escolhe a pasta `CMS_Client_Integrated`.
4. Verifica que, do lado esquerdo, estão os ficheiros `Menu_clientHTML.html`, `Registration Client_HTML.html` e `Registration Courier_CSS.css` ao mesmo nível.
5. Clica com o botão direito em `menu registration.html` e escolhe `Open with Live Server`.
6. Escolhe **Client** para experimentar o registo, ou abre `menu login.html` para experimentar o login.
7. Se estiveres a integrar no repositório já existente, copia estes ficheiros **para a pasta onde estão os ficheiros Courier**, mantendo os nomes. Faz primeiro um commit/cópia de segurança e resolve eventuais alterações que colegas tenham feito entretanto (sobretudo `Menu_courierJS.js`).
8. Se o site continuar a mostrar a versão antiga, confirma qual é a pasta que está aberta no VS Code e pressiona `Ctrl + F5` no Chrome.

**Importante:** executa com o Live Server, usando o mesmo endereço e porta em todas as páginas. Assim, o `localStorage` é partilhado entre Cliente e Courier. `file://`, portas diferentes e navegadores diferentes podem dar origens distintas e impedir a ligação.

## Fluxo de demonstração completo

1. Abre `menu registration.html` → **Register as Client**.
2. Introduz dados **fictícios**, preenche as quatro etapas e confirma o registo.
3. Clica em `Open Client Dashboard`.
4. Vai a `New Order`. O mapa interativo OpenStreetMap abre centrado na FEUP com um marcador de demonstração. Clica no mapa para definir a origem ou o destino selecionado; ou clica em **Use FEUP example** para preencher ambos os pontos e apresentar dois marcadores ligados por uma linha reta.
5. Introduz um produto (descrição, categoria, quantidade, peso/unidade e volume/unidade). Podes usar **Add another product**.
6. Confirma o preço estimado, calculado com as tarifas de demonstração e a distância GPS em linha reta, e seleciona **MB WAY** ou **Card**. Preenche os campos de demonstração que aparecem para a opção escolhida; estes dados não são enviados nem guardados. Usa apenas valores fictícios.
7. Seleciona a data e clica em **Submit Order**.
8. Abre `Menu_courierHTML.html` pelo Live Server, no mesmo navegador. O novo pedido deve aparecer em **Available Orders** (além dos pedidos de teste existentes).
9. O Courier seleciona um veículo aprovado com capacidade suficiente e aceita o pedido. Em `Client > My Orders`, o estado passa a **Accepted** quando a página é atualizada/reativada.
10. Quando o Courier altera o estado (Picked up / In transit / Out for delivery), o Cliente acompanha a saída da origem e o progresso em **My Orders > View details > Order Timeline**. Depois de marcar **Out for delivery**, o Courier pode registar uma tentativa sem sucesso; a timeline indica o pickup point de demonstração associado à cidade/código postal do perfil.
   `My Orders` inclui também o exemplo `DEMO-ATTEMPT-001`: ninguém estava em casa e a encomenda ficou no pickup point de demonstração mais próximo.
11. A finalização requer a prova de entrega no Courier. Após a conclusão, o pedido aparece em `Client > History` e a timeline apresenta **Delivered**.
12. Para cancelar, cria outro pedido e utiliza **Cancel Order** enquanto estiver **Initiated**. Os pedidos cancelados aparecem no histórico e deixam de estar disponíveis para aceitação pelo Courier ao atualizar a sua área.
13. Abre `My Profile` para alterar contactos e morada de demonstração.

## Requisitos do enunciado abrangidos

- Cliente: registo, consulta de estado e histórico de encomendas.
- Pedido: local de origem, destino, coordenadas GPS válidas e vários produtos associados.
- Produto: descrição, categoria, quantidade, peso e volume.
- Mapa Leaflet/OpenStreetMap interativo: marcadores e linha entre origem e destino. A linha é reta e **não** uma rota calculada sobre estradas.
- Envio e validação: os campos obrigatórios impedem submissão inválida; coordenadas e números são validados em JavaScript.
- Courier: seleção de veículo, capacidade, etapas de estado e prova de entrega mantidas na página fornecida.
- Responsividade: disposição em grelhas flexíveis e adaptação para telemóvel.

## Limites do protótipo — importante na apresentação

É um **frontend de demonstração do Sprint 1**, sem base de dados, servidor, autenticação real, recuperação de password ou armazenamento seguro de documentos. O login aceita qualquer email válido e qualquer password não vazia apenas para navegar na demo. Nunca introduzas senhas ou dados pessoais reais. A password do registo não é guardada; apenas dados de contacto fictícios podem ser guardados no `localStorage` deste browser para demonstração. A seleção de uma data/serviço não corresponde a uma entrega efetivamente agendada. Os pedidos criados pelo Cliente são partilhados com o Courier apenas no **mesmo browser/origem** e as sessões internas do Courier continuam a funcionar como simulação local. A prova de entrega é preenchida na página do Courier; as imagens/assinaturas não são copiadas para o histórico do Cliente.

O mapa e a pesquisa de moradas necessitam de ligação à Internet. As pesquisas de endereço são enviadas ao serviço público Photon (OpenStreetMap/Komoot) para obter coordenadas. O preço é apenas uma estimativa com tarifas do simulador e distância em linha reta (não uma rota rodoviária). Os pickup points são nomes de demonstração selecionados pela cidade/código postal; não existe um catálogo real nem geolocalização precisa de pontos de recolha. O formulário de pagamento é uma demonstração: não processa pagamentos nem guarda ou envia os campos de MB WAY/cartão. Nunca introduzas dados reais de pagamento.

## Antes de entregar

- Preenche o `Team`/relatório/modelo ER do vosso grupo e verifica as restantes páginas exigidas no enunciado.
- Revê a integração de mudanças feitas em paralelo por outros elementos. Não substituas sem rever alterações recentes ao Courier.
- Testa com Live Server e navegador real os passos anteriores, e verifica no telemóvel.
- O código foi sujeito a verificações estáticas; neste ambiente não foi possível executar uma navegação automática no Chromium, devido a bloqueio administrativo de páginas locais. Os testes manuais de ponta a ponta são, por isso, necessários.
