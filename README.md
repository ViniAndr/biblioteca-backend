# 📚 Biblioteca API - Gerenciamento de Empréstimos e Catálogo de Livros  

Bem-vindo ao repositório da **Biblioteca API**, um projeto voluntário desenvolvido para otimizar a gestão de empréstimos e o catálogo de livros de uma biblioteca municipal. Este sistema backend, construído com **Node.js e JavaScript**, visa digitalizar processos que antes eram exclusivamente presenciais, proporcionando maior autonomia aos usuários e melhor controle administrativo.  

---

## 🚀 Sobre o Projeto  

O objetivo desta API é modernizar a gestão de uma biblioteca pública, permitindo que clientes realizem empréstimos de livros online, acompanhem seu histórico de empréstimos e acessem o catálogo da biblioteca de forma simples e prática. Além disso, a API fornece ferramentas para funcionários e administradores gerenciarem livros, clientes e processos internos da biblioteca.

Atualmente, este projeto está em fase de desenvolvimento e melhoria contínua, tornando-se cada vez mais genérico e modular, para que possa ser adaptado para diferentes cenários de bibliotecas.

---

## 🏛️ Principais Entidades  

### 👤 Cliente  
Os clientes podem se cadastrar de duas formas:  

- **Presencial**: Cadastro feito diretamente na biblioteca, onde o funcionário registra **nome, telefone e endereço**. A partir desse momento, o cliente pode pegar livros emprestados presencialmente.  
- **Online**: Cadastro realizado pelo site, solicitando os mesmos dados do cadastro presencial, acrescidos de **e-mail e senha**, permitindo acesso ao sistema online.  

🔄 **Migração de conta presencial para online**  
Caso um cliente com cadastro presencial deseje acessar a plataforma online, ele pode preencher um formulário para vincular um **e-mail e senha** ao seu cadastro existente.  

✅ **Funcionalidades do Cliente:**  
- Consultar o catálogo de livros (sem necessidade de login).  
- Solicitar empréstimos e acompanhar o solicitação.
- Cancelar solicitações antes da retirada.
- Ver seu histórico.
- Renovar o prazo de devolução.
- Atualizar dados pessoais.  

---

### 🏢 Funcionário  
O funcionário tem um papel administrativo dentro do sistema, podendo gerenciar tanto o catálogo quanto os clientes.  

✅ **Funcionalidades do Funcionário:**  
- Gerenciar livros, autores, categorias e editoras.  
- Cadastrar, atualizar e remover clientes.  
- Aprovar ou cancelar empréstimos.  
- Acompanhar o histórico de movimentações.  

🚫 **Restrições:**  
- Funcionários não podem modificar informações sensíveis de clientes, apenas **nome e endereço**.  

---

### 🔑 Administrador  
O administrador tem as mesmas permissões de um funcionário, mas com **acesso adicional** para **criar e remover funcionários**.  

---

## 🔄 Processos Automatizados  

O sistema conta com **tarefas automáticas (cron jobs)** para manter a organização dos empréstimos:  

- **Cancelamento automático de solicitações**: Se um cliente não buscar um livro dentro do prazo, a solicitação é cancelada.  
- **Verificação de empréstimos atrasados**: Alteração automática do status de empréstimos vencidos.  

---

## 🛡️ Segurança  

A API implementa diversas **camadas de segurança** para proteger os dados e garantir acessos adequados:  

- **Autenticação JWT** para sessões seguras.  
- **Controle de acesso por papéis** (cliente, funcionário e administrador).  
- **Validações rigorosas** para garantir integridade nos cadastros.  
- **Tratamento de uploads de imagens** com Multer e Sharp.  

---

## 🏗️ Tecnologias Utilizadas  

A API foi desenvolvida utilizando as seguintes tecnologias:  

- **Node.js** - Runtime JavaScript  
- **Express.js** - Framework para criação de APIs  
- **Prisma ORM** - Gerenciamento do banco de dados  
- **PostgreSQL** - Banco de dados relacional  
- **JWT (jsonwebtoken)** - Autenticação segura  
- **Bcrypt** - Criptografia de senhas  
- **Multer & Sharp** - Upload e otimização de imagens  
- **Node-Cron** - Automação de tarefas agendadas  
- **Dotenv** - Gerenciamento de variáveis de ambiente  
- **Cors** - Permissão de acessos externos  
- **Date-fns** - Manipulação de datas  

---

## ⚙️ Configuração do Projeto  

### 📂 Variáveis de Ambiente  

Para rodar o projeto localmente, crie um arquivo **`.env`** na raiz do projeto e adicione as seguintes configurações:  

```env
TOKEN_SECRET=uma_string_segura_aqui
TOKEN_EXPIRATION=8h
DATABASE_URL="postgresql://User:Password@localhost:5432/mydb?schema=public"
```

---

## ▶️ Como Executar  

1. **Clone o repositório**  
   ```bash
   git clone https://github.com/seu-usuario/biblioteca-api.git
   cd biblioteca-api
   ```
2. **Instale as dependências**  
   ```bash
   npm install
   ```
3. **Configure o arquivo `.env`** (conforme indicado acima).  
4. **Inicie a API em modo de desenvolvimento**  
   ```bash
   npm run dev
   ```

---

## 📌 Considerações Finais  

Este projeto ainda está em evolução e aberto para melhorias! Como se trata de uma **API genérica**, ela pode ser facilmente adaptada para outras bibliotecas ou até mesmo outros tipos de sistemas de gerenciamento.  

💡 **Contribuições são bem-vindas!** Caso tenha interesse em aprimorar o projeto ou sugerir melhorias, fique à vontade para abrir uma **issue** ou enviar um **pull request**.  

📧 **Contato**: Caso tenha dúvidas ou sugestões, você pode me encontrar no [LinkedIn](https://www.linkedin.com/in/vinicius-andr/).  
