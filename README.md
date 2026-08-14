# Papa Charlie 197 — API

Backend do Papa Charlie 197, sistema gamificado de preparação para o concurso da Polícia Civil do Rio Grande do Norte (PCRN).

Node.js + Express + Sequelize + PostgreSQL. Consumido pelo frontend em [`papacharlie197-web`](https://github.com/T-TheV/papacharlie197-web).

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencher com credenciais reais
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev
```
