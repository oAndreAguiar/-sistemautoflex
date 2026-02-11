# Sistema de controle de produção e estoque (Teste Prático)

Aplicação web para controle de produtos, matérias-primas (estoque) e a associação (BOM) de quais matérias-primas e quantidades são necessárias para produzir cada produto.  
A aplicação também disponibiliza consultas para verificar quais produtos podem ser produzidos com base no estoque atual de matérias-primas.

---
### Tecnologias

### Back-end (API)
- Java 17
- Quarkus
- Hibernate ORM / Panache
- MySQL 8

### Front-end
- React (Vite)
- Redux Toolkit Query (consumo da API)
- CSS responsivo

### Testes
- Cypress (E2E)

---
### Arquitetura

O projeto segue o conceito de API separada do Front-end:

- `code-with-quarkus/`: API REST (Quarkus)
- `frontend/`: Interface Web (React)

Portas padrão:
- API: `http://localhost:8080`
- Front-end: `http://localhost:5173`

> Observação: `http://localhost:8080/` pode retornar HTTP 405, pois este projeto é uma API e não possui rota `GET /`.  
> Para validar a API, use os endpoints.

---
### Funcionalidades

### API (Back-end)
- CRUD de Produtos
- CRUD de Matérias-primas
- CRUD de Associação produto x matéria-prima (BOM) com quantidade necessária por unidade
- Consulta de produção:
  - Production Check: quantidade máxima que pode ser produzida por produto com o estoque atual
  - Production Priority: lista de produtos produzíveis ordenados por maior valor unitário

### Interface (Front-end)
- Telas CRUD de Produtos
- Telas CRUD de Matérias-primas
- Associação de matérias-primas dentro do cadastro/detalhe do produto
- Tela de consulta de produção (produção possível e ordenação por valor)

---
### Pré-requisitos

- Node.js 18+
- Java 17+
- MySQL 8 em execução (local)
- Maven (ou usar `./mvnw`)

---
### Banco de dados (MySQL local)

Crie o banco `inventory` (via MySQL Workbench ou terminal):
´´´´sql
CREATE DATABASE inventory;
´´´´

Configuração padrão (definida no application.properties):
host: localhost
porta: 3306
database: inventory
usuário: root
senha: a1b2c3d4

---
### Como executar

Executar o Back-end (Quarkus API)
cd code-with-quarkus
./mvnw quarkus:dev


API disponível em:
http://localhost:8080
Health check:
http://localhost:8080/q/health
Swagger UI:
http://localhost:8080/q/swagger-ui


---
### Executar o front-end (React)
´´´´
cd frontend
npm install
npm run dev
´´´´

Interface disponível em:

http://localhost:5173

---
### Principais Endpoints
Produtos
GET /products
POST /products
PUT /products/{id}
DELETE /products/{id}

Matérias-primas
GET /raw-materials
POST /raw-materials
PUT /raw-materials/{id}
DELETE /raw-materials/{id}

Associação (BOM / Material Usage)
GET /material-usage
POST /material-usage
PUT /material-usage/{id}
DELETE /material-usage/{id}

Produção
GET /production-check
GET /production-priority

---
### Testes
Cypress (E2E)

É necessário que API e Front-end estejam rodando para executar os testes.
´´´´
cd frontend
npx cypress open
´´´´
e pela interface do Cypress selecionar o "full_app.cy.js"

---
### Observações / Melhorias futuras:

Implementar uma sugestão de produção com alocação de estoque compartilhado (priorizando maior valor)
Adicionar testes unitários e de integração no Back-end
