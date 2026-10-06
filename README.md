# Acesso+ Hospital

Protótipo acadêmico de comunicação inclusiva para ambiente hospitalar, pensado para demonstração em sala e publicação via GitHub Pages.

## O que já funciona
- Interface mobile-first e responsiva
- Aumento/redução de fonte
- Alto contraste
- Leitura do conteúdo em voz alta pelo navegador
- Área demonstrativa de Libras
- Solicitação de apoio de comunicação
- Relato de barreiras de acessibilidade
- Geração de protocolo
- Consulta de protocolo no mesmo dispositivo
- Armazenamento local via `localStorage`
- Manifesto PWA e service worker

## Publicar no GitHub Pages
1. Crie um repositório novo no GitHub.
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. Vá em **Settings > Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/root`.
6. Salve. O GitHub informará a URL pública.

## Observação importante
Este é um protótipo acadêmico e não deve ser apresentado como sistema clínico real. Em uma implantação hospitalar verdadeira seriam necessários, entre outros pontos, segurança, autenticação, LGPD, integração com fluxos institucionais e profissionais habilitados para interpretação.


## Versão 2
Esta versão amplia o protótipo para contemplar usuários/acompanhantes e colaboradores, atendimento adaptado para necessidades sensoriais, modo simples, idiomas e roteamento demonstrativo de demandas para setores responsáveis.


## Versão

Versão atual: 2.1 — inclui identificação acadêmica no rodapé do aplicativo.


## Atualização de cache (2.2)
A versão 2.2 usa atualização imediata do service worker e estratégia network-first para impedir que versões antigas permaneçam presas no cache do navegador após uma nova publicação no GitHub Pages.


## Versão 2.3

Inclui compartilhamento nativo do link, apresentação de boas-vindas, canal colaborativo de sugestões, pedido prioritário demonstrativo de ajuda, localização de setor por parâmetro de QR Code e geolocalização opcional mediante autorização do usuário.

### QR Codes por setor

O mesmo aplicativo pode ser divulgado com URLs diferentes para identificar o setor de origem. Exemplos:

- `?local=recepcao`
- `?local=pronto-atendimento`
- `?local=ambulatorio`
- `?local=internacao`
- `?local=exames`

Exemplo completo: `https://marceloaugustoreporter.github.io/acesso-hospital/?local=recepcao`

O protótipo não envia chamados para equipes reais.


## Versão 2.4 — painel coletivo de demonstração

A versão 2.4 acrescenta pesquisa rápida de satisfação e um painel que pode consolidar, em tempo quase real, as interações feitas por diferentes celulares durante a apresentação. Para ativar o modo coletivo, siga `SUPABASE_SETUP.md` e preencha `config.js`. Sem Supabase, o aplicativo continua funcionando localmente e o painel oferece um conjunto de dados ilustrativos como contingência.

Por privacidade, o painel compartilhado recebe somente categorias de uso e avaliação. Textos livres, dados de saúde e coordenadas GPS permanecem fora do banco de demonstração.

Painel coletivo da versão 2.4 preparado para demonstração acadêmica com Supabase.


## Versão 2.5 — Apresentação Final

Inclui identificação acadêmica completa, professora e integrantes do grupo, cronograma resumido, área de privacidade/LGPD, registro de uso dos recursos de acessibilidade no painel coletivo e sessão oficial `PUCMG-06102026`.

Integrantes: Barbara Victoria Barbosa, Enzo Varini Tres, João Marcelo e Marcelo Augusto. Professora: Letícia Lins. Disciplina: Diversidade, Cidadania e Direitos — Pós-graduação em Comunicação Pública e Governamental, PUC Minas.
