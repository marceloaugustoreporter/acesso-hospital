# Acesso+ Hospital — Versão 2.6

## Link para os colegas no chat do Meet
https://marceloaugustoreporter.github.io/acesso-hospital/?sessao=PUCMG-06102026

Neste endereço o botão do painel não aparece.

## Link exclusivo para os apresentadores
https://marceloaugustoreporter.github.io/acesso-hospital/?sessao=PUCMG-06102026&painel=1

Neste endereço aparece o botão `📊 Painel`, lendo os mesmos dados da sessão oficial.

## Dinâmica sugerida
1. Abra antes da apresentação o link exclusivo dos apresentadores.
2. Envie apenas o link dos participantes no chat do Meet.
3. Peça 1 ou 2 interações por pessoa.
4. Oriente a não informar nome, diagnóstico, telefone ou dados pessoais/de saúde.
5. Sugira testar contraste, fonte, modo simples, leitura em voz alta ou Libras.
6. Depois abra `📊 Painel` no computador compartilhado.
7. O painel atualiza automaticamente a cada 5 segundos.
8. Se houver falha de internet, use `Exibir exemplo`.

## Limpar a sessão de testes
No SQL Editor do Supabase:

```sql
delete from public.acesso_events
where session_code = 'TESTE';
```

Esse comando não apaga a sessão oficial `PUCMG-06102026`.
