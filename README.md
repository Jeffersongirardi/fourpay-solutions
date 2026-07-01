# FOURPAY SOLUTIONS

Site institucional da FOURPAY SOLUTIONS — Master Franqueado Fiserv no Paraná e Rio Grande do Sul.

## Sobre

Site estático e responsivo com informações sobre a FOURPAY SOLUTIONS, seus serviços (Clover, TEF, Máquina BIN, BIN Tap, Link de Pagamento), programa de franqueados BIN da Fiserv, blog com conteúdo do mercado de pagamentos e formulários de contato.

## Páginas

| Página | Descrição |
|---|---|
| `index.html` | Home com hero, serviços, depoimentos, blog preview, newsletter |
| `sobre.html` | História, missão, visão e valores |
| `servicos.html` | Detalhamento dos 5 serviços |
| `maquina-bin.html` | Página dedicada à Máquina BIN |
| `franqueado.html` | Programa de franqueados + formulário de interesse |
| `blog.html` | Grid com todos os artigos |
| `contato.html` | Formulário de contato e informações |
| `posts/` | 3 artigos completos (antecipação, chargeback, mercado) |

## Tecnologias

- HTML5 semântico
- CSS3 (variáveis, grid, flexbox, animações, responsivo)
- JavaScript puro (navbar, scroll, formulários, animações)
- Font Awesome 6
- Google Fonts (Inter)
- Netlify Forms (formulários)

## Estrutura

```
├── index.html
├── sobre.html
├── servicos.html
├── maquina-bin.html
├── franqueado.html
├── blog.html
├── contato.html
├── css/
│   └── style.css
├── js/
│   └── main.js
├── imagens/
├── posts/
├── favicon.png
├── netlify.toml
└── README.md
```

## Deploy

O deploy é feito automaticamente via **Netlify** conectado ao repositório GitHub. A cada push na branch `main`, o site é publicado.

```bash
netlify deploy --prod --dir=.
```

### Domínio

`www.fourpay.com.br` com redirecionamento automático do domínio raiz.

### Formulários

Os formulários (Newsletter, Contato, Franqueado) usam **Netlify Forms** com proteção anti-spam via honeypot. Submissões são gerenciadas no dashboard do Netlify.

---

Desenvolvido por [Jefferson Girardi](https://github.com/Jeffersongirardi).
