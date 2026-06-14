## Guia de uso do projeto

### para executar o projeto:

- Necessário ter Nodejs20 instalado na máquina
- Serverless framework instalado
- Ter uma conta na AWS e Google Clound Platform e fazer a configuração para se conectar
- Ter uma conta no Supabase e executar o script presente em backend/task.sql para criar tabela necessária para crud
- Definir nos .env do frontend e backend para correta implantação

### executar o comando para cada funcionalidade

- node cli deploy (para deploy de solução)
- node cli remove (para remover os recursos do projeto)
- node cli cls (para limpar os artefatos do projeto)

### Alterados na base:

- cli.js
- package.json

### Alterados no backend:

- backend/index.js
- backend/package.json
- backend/serverless.yml

### Alterados no frontend:

- frontend/package.json
  
### Inalterados no backend:

- backend/src
- backend/task.sql
- backend/router.js
- backend/validateToken.js

### Inalterados no frontend:

- frontend/src/pages/
- frontend/src/index.js
- frontend/src/components/
- frontend/src/SupabaseAuth.js
- frontend/src/ProtectedRoute.js
- frontend/src/App.js

