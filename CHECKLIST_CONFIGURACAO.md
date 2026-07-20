# ✨ CHECKLIST DE CONFIGURAÇÃO - AdaFashion

## 🚀 Início Rápido (5 minutos)

### **1️⃣ Setup Inicial**
- [ ] Clonar/atualizar repositório
- [ ] Instalar dependências: `npm install` (raiz e `server/`)
- [ ] Criar `.env.local` na raiz do projeto

### **2️⃣ Banco de Dados Local**
- [ ] PhpMyAdmin rodando em `localhost/phpmyadmin`
- [ ] Banco `adafashion` criado
- [ ] Tabelas criadas (usuarios, produtos, pedidos, etc)
- [ ] Atualizar `.env.local` com credenciais corretas

### **3️⃣ Variáveis de Ambiente**
```bash
# .env.local
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=adafashion

ADMIN_EMAIL=admin@adafashion.com
ADMIN_PASSWORD=admin123

CORS_ORIGIN=*
```

### **4️⃣ Iniciar Servidor**
```bash
cd server
npm start
```

### **5️⃣ Testar**
- [ ] Abrir `http://localhost:3001`
- [ ] Login com admin@adafashion.com / admin123
- [ ] Verificar dashboard

---

## 🌐 Acesso de Dispositivos Externos (10 minutos)

### **1️⃣ Obter IP Local**
```bash
# Windows PowerShell
ipconfig

# Procurar por "IPv4 Address" como 192.168.1.100
```

### **2️⃣ Configurar CORS**
**Arquivo:** `server/.env.local`
```env
CORS_ORIGIN=*
```

### **3️⃣ Reiniciar Servidor**
```bash
npm start
```

### **4️⃣ Acessar do Smartphone**
```
http://192.168.1.100:3001
```

### **5️⃣ Validar**
- [ ] Página carrega corretamente
- [ ] Login funciona
- [ ] Dados carregam

---

## 🌍 Deploy no Vercel (15 minutos)

### **1️⃣ Preparar Projeto**
- [ ] Commit todas as alterações
- [ ] Push para GitHub main branch
- [ ] Não incluir `.env.local` (verificar .gitignore)

### **2️⃣ Criar Projeto no Vercel**
- [ ] Ir para vercel.com
- [ ] Conectar repositório GitHub
- [ ] Criar novo projeto AdaFashion

### **3️⃣ Configurar Variáveis de Ambiente**
**No Vercel Dashboard > Settings > Environment Variables:**

```
DB_HOST = sql200.infinityfree.com
DB_USER = if0_42433124
DB_PASSWORD = Nademe1001920
DB_NAME = if0_42433124_adafashion

ADMIN_EMAIL = admin@adafashion.com
ADMIN_PASSWORD = admin123
ADMIN_FULL_NAME = Administrador AdaFashion

NODE_ENV = production
SERVER_URL = https://seu-projeto.vercel.app
VITE_API_URL = https://seu-projeto.vercel.app

CORS_ORIGIN = https://seu-projeto.vercel.app
```

### **4️⃣ Deploy**
- [ ] Push para main
- [ ] Vercel faz deploy automático
- [ ] Aguardar conclusão (~3 minutos)

### **5️⃣ Validar Produção**
- [ ] Acessar `https://seu-projeto.vercel.app`
- [ ] Login com credenciais admin
- [ ] Verificar conexão com banco Infinity Free

---

## 🔐 Segurança - Checklist Final

### **Desenvolvimento Local**
- [ ] `.env.local` criado e não commitado
- [ ] CORS_ORIGIN=* (apenas local)
- [ ] Credenciais padrão (aceito para dev)
- [ ] Database em localhost

### **Produção (Vercel)**
- [ ] Variáveis em Vercel Dashboard (não no código)
- [ ] CORS_ORIGIN restrito ao domínio
- [ ] NODE_ENV=production
- [ ] SESSION_SECRET alterado (se usar)
- [ ] Infinty Free credentials corretas
- [ ] Domínio configurado

### **Git & Repositório**
- [ ] `.env.local` no .gitignore
- [ ] `.env.example` versionado (sem senhas)
- [ ] Nenhuma credencial no código
- [ ] Commits sem dados sensíveis

---

## 📊 Verificação de Conectividade

### **Local (Desktop)**
```bash
# Testar servidor
curl http://localhost:3001/api/users

# Status esperado: Retorna dados (ou 401 se sem auth)
```

### **Rede (Smartphone na rede local)**
```bash
# Usar curl ou Postman
GET http://192.168.1.100:3001/api/users

# Status esperado: Dados em JSON
```

### **Produção (Internet)**
```bash
# Testar domínio Vercel
curl https://seu-projeto.vercel.app/api/users

# Status esperado: Dados em JSON
```

---

## 🧪 Testes Funcionais

### **Login Admin**
- [ ] Email: `admin@adafashion.com`
- [ ] Password: `admin123`
- [ ] Dashboard carrega
- [ ] Dados são exibidos

### **CRUD Produtos**
- [ ] Ver lista de produtos
- [ ] Criar novo produto
- [ ] Editar produto
- [ ] Deletar produto

### **Responsividade**
- [ ] Desktop (1920x1080) OK
- [ ] Tablet (768x1024) OK
- [ ] Mobile (375x667) OK

### **Performance**
- [ ] Página carrega em < 3s
- [ ] Imagens respondem rápido
- [ ] Sem erros de console

---

## 📱 Teste de Acesso Externo (Passo a Passo)

```
┌─────────────────────────────────────────────────────────┐
│ 1. OBTER IP LOCAL                                       │
│    $ ipconfig                                           │
│    IPv4 Address: 192.168.1.100                         │
└─────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CONFIGURAR .env.local                                │
│    CORS_ORIGIN=*                                        │
└─────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. INICIAR SERVIDOR                                     │
│    $ cd server && npm start                            │
│    ✅ Server running on port 3001                      │
└─────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. ACESSAR DO SMARTPHONE                                │
│    Browser: http://192.168.1.100:3001                  │
│    ✅ Página carrega                                    │
└─────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. LOGIN                                                │
│    Email: admin@adafashion.com                         │
│    Password: admin123                                   │
│    ✅ Dashboard aparece                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🆘 SOS - Resolução Rápida

| Problema | Solução | Comando |
|----------|---------|---------|
| Servidor não sobe | Verifique porta 3001 | `npm start` |
| CORS error | Configure CORS_ORIGIN | Ver .env.local |
| DB connection failed | Verifique credenciais | Ver .env.local |
| Login não funciona | Seed do admin | `npm run init-db` |
| Porta já em uso | Mude porta | `PORT=3002 npm start` |
| Módulos não instalados | Instale dependências | `npm install` |

---

## 📚 Documentação Completa

- 📖 [RESUMO_CONFIGURACAO.md](RESUMO_CONFIGURACAO.md) - Overview
- 🌐 [GUIA_CONFIGURACAO_ENV.md](GUIA_CONFIGURACAO_ENV.md) - Detalhes
- 📱 [ACESSO_DISPOSITIVOS_EXTERNOS.md](ACESSO_DISPOSITIVOS_EXTERNOS.md) - Rede
- 🚀 [ENV_VARIABLES_VERCEL.md](ENV_VARIABLES_VERCEL.md) - Vercel
- 📋 [.env.example](.env.example) - Template env

---

## ✅ Status de Conclusão

**Arquivos Modificados:**
- ✅ `server/db-infinity.js` - Atualizado
- ✅ `server/index.js` - Atualizado
- ✅ `.gitignore` - Atualizado

**Arquivos Criados:**
- ✅ `.env.example` - Template completo
- ✅ `server/.env.local.example` - Template server
- ✅ `RESUMO_CONFIGURACAO.md` - Overview
- ✅ `GUIA_CONFIGURACAO_ENV.md` - Guia completo
- ✅ `ACESSO_DISPOSITIVOS_EXTERNOS.md` - Acesso externo
- ✅ `ENV_VARIABLES_VERCEL.md` - Vercel
- ✅ `CHECKLIST_CONFIGURACAO.md` - Este arquivo

**Status:** ✨ PRONTO PARA USO ✨

---

**Próximo passo:** Comece pelo item **"🚀 Início Rápido"** acima!

