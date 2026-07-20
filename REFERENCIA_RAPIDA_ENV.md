# 🎯 REFERÊNCIA RÁPIDA - Variáveis de Ambiente

## 📋 Copiar e Colar Pronto

### **Para .env.local (Desenvolvimento Local)**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=adafashion

ADMIN_EMAIL=admin@adafashion.com
ADMIN_PASSWORD=admin123
ADMIN_FULL_NAME=Administrador AdaFashion

NODE_ENV=development
PORT=3001
SERVER_URL=http://localhost:3001
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=AdaFashion

CORS_ORIGIN=*

SESSION_SECRET=seu_secret_aleatorio_aqui
```

---

### **Para Vercel Dashboard Environment Variables**
```
DB_HOST=sql200.infinityfree.com
DB_PORT=3306
DB_USER=if0_42433124
DB_PASSWORD=Nademe1001920
DB_NAME=if0_42433124_adafashion

ADMIN_EMAIL=admin@adafashion.com
ADMIN_PASSWORD=admin123
ADMIN_FULL_NAME=Administrador AdaFashion

NODE_ENV=production
PORT=3001
SERVER_URL=https://seu-projeto.vercel.app
VITE_API_URL=https://seu-projeto.vercel.app
VITE_APP_NAME=AdaFashion

CORS_ORIGIN=https://seu-projeto.vercel.app

SESSION_SECRET=gere-uma-chave-aleatoria-forte-aqui
```

---

## 🔑 Credenciais Padrão

| Campo | Valor |
|-------|-------|
| Email Admin | `admin@adafashion.com` |
| Senha Admin | `admin123` |
| Nome Completo | `Administrador AdaFashion` |
| Cargo | `Admin` |

---

## 🗄️ Banco de Dados

### Localhost
- **Host:** `localhost`
- **Port:** `3306`
- **User:** `root`
- **Password:** (deixar em branco ou sua senha local)
- **Database:** `adafashion`
- **PhpMyAdmin:** `http://localhost/phpmyadmin`

### Infinity Free (Produção)
- **Host:** `sql200.infinityfree.com`
- **Port:** `3306`
- **User:** `if0_42433124`
- **Password:** `Nademe1001920`
- **Database:** `if0_42433124_adafashion`

---

## 🌐 URLs

### Desenvolvimento
- **Local Desktop:** `http://localhost:3001`
- **Rede Local:** `http://192.168.1.100:3001` (substituir por seu IP)
- **API Local:** `http://localhost:3001/api`

### Produção
- **Vercel:** `https://seu-projeto.vercel.app`
- **API Vercel:** `https://seu-projeto.vercel.app/api`

---

## 📱 Acesso de Dispositivos Externos

### Step 1: Obter IP
```bash
ipconfig  # Windows
# Procure por IPv4 Address: 192.168.1.XXX
```

### Step 2: Configure CORS
```env
CORS_ORIGIN=*
```

### Step 3: Acesse do Smartphone
```
http://seu-ip-local:3001
```

---

## 🚀 Comandos Úteis

### Instalação
```bash
npm install                    # Raiz
cd server && npm install       # Server
```

### Desenvolvimento
```bash
npm run dev                    # Frontend + Backend
cd server && npm start         # Apenas Backend
npm run build                  # Build produção
```

### Database
```bash
cd server && npm run init-db   # Inicializar admin
```

---

## ⚠️ Checklist Segurança

- [ ] `.env.local` não commitado (ver .gitignore)
- [ ] Credenciais não no código
- [ ] SESSION_SECRET é string aleatória
- [ ] NODE_ENV=production em Vercel
- [ ] CORS_ORIGIN restritivo em produção
- [ ] Alterar credenciais admin antes do deploy

---

## 🐛 Testes Rápidos

```bash
# Testar servidor rodando
curl http://localhost:3001/api/users

# Testar de outro IP
curl http://192.168.1.100:3001/api/users

# Com headers
curl -H "Content-Type: application/json" http://localhost:3001/api/users
```

---

## 📁 Arquivos Importantes

| Arquivo | Propósito |
|---------|-----------|
| `.env.example` | Template de variáveis (versionado) |
| `.env.local` | Seu arquivo local (não versionado) |
| `server/db-infinity.js` | Configuração BD |
| `server/index.js` | Servidor Express |
| `CHECKLIST_CONFIGURACAO.md` | Este checklist |
| `GUIA_CONFIGURACAO_ENV.md` | Guia completo |

---

## 🎯 Início Rápido (3 passos)

```bash
# 1. Criar .env.local
cp .env.example .env.local
# Editar .env.local com suas credenciais

# 2. Instalar e iniciar
cd server && npm install && npm start

# 3. Acessar
# Browser: http://localhost:3001
# Login: admin@adafashion.com / admin123
```

---

**Status:** ✅ Configuração Completa!

Para mais informações, consulte os arquivos de documentação inclusos.
