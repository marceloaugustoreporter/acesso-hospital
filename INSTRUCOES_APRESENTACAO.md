# Acesso+ Hospital — Apresentação Final

Versão: 2.5
Sessão oficial: PUCMG-06102026
Link oficial da demonstração:
https://marceloaugustoreporter.github.io/acesso-hospital/?sessao=PUCMG-06102026

## Dinâmica sugerida em sala
1. Exiba o QR Code `qr-acesso-hospital-apresentacao.png`.
2. Peça aos colegas para fazerem 1 ou 2 interações curtas.
3. Oriente a não informar nome, diagnóstico, telefone ou dado pessoal/saúde.
4. Peça que testem também recursos de acessibilidade: aumento/redução de fonte, contraste, modo simples, leitura em voz alta ou Libras.
5. Abra o botão `📊 Painel` no computador projetado.
6. Mostre os indicadores ao vivo e diferencie resultados da demonstração das metas futuras do projeto.
7. Se houver falha de internet, use `Exibir exemplo`.

## Limpar ensaios
No SQL Editor do Supabase:

```sql
delete from public.acesso_events
where session_code = 'TESTE';
```

Esse comando não apaga a sessão oficial `PUCMG-06102026`.
