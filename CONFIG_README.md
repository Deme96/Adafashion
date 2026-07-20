# 🎨 AdaFashion - Configuração de Ambiente

## ⚡ Início Rápido (3 Passos)

```bash
# 1. Criar arquivo de configuração local
cp .env.example .env.local

# 2. Editar .env.local com suas credenciais
# DB_HOST=localhost, DB_USER=root, etc.

# 3. Iniciar servidor
cd server && npm install && npm start
```

**Acesse:** `http://localhost:3001`  
**Login:** `admin@adafashion.com` / `admin123`

---

## 📚 Documentação Disponível

### 🎯 **Para Começar Agora**
- ⭐ [REFERENCIA_RAPIDA_ENV.md](REFERENCIA_RAPIDA_ENV.md) - **3 minutos** (copy-paste ready)
- ✅ [CHECKLIST_CONFIGURACAO.md](CHECKLIST_CONFIGURACAO.md) - **10 minutos** (visual checklist)

### 🌐 **Por Tipo de Uso**
- 📖 [GUIA_CONFIGURACAO_ENV.md](GUIA_CONFIGURACAO_ENV.md) - Guia completo
- 📱 [ACESSO_DISPOSITIVOS_EXTERNOS.md](ACESSO_DISPOSITIVOS_EXTERNOS.md) - Smartphone/Tablet
- 🚀 [ENV_VARIABLES_VERCEL.md](ENV_VARIABLES_VERCEL.md) - Deploy no Vercel

### 📊 **Referência**
- 🔄 [DIAGRAMA_FLUXO.md](DIAGRAMA_FLUXO.md) - Arquitetura visual
- 📋 [RESUMO_CONFIGURACAO.md](RESUMO_CONFIGURACAO.md) - Overview de tudo
- 🎯 [FINAL_STATUS.md](FINAL_STATUS.md) - Status final
- 📚 [INDEX_DOCUMENTACAO.md](INDEX_DOCUMENTACAO.md) - Índice completo

---

## 🔑 Credenciais Padrão

| Campo | Valor |
|-------|-------|
| **Email** | `admin@adafashion.com` |
| **Senha** | `admin123` |
| **Nome** | `Administrador AdaFashion` |

> ⚠️ **Altere em produção!**

---

## 🗄️ Bancos de Dados

### Desenvolvimento (Localhost)
```
Host:     localhost
Porta:    3306
Usuário:  root
Database: adafashion
```

### Produção (Infinity Free)
```
Host:     sql200.infinityfree.com
Porta:    3306
Usuário:  if0_42433124
Senha:    Nademe1001920
Database: if0_42433124_adafashion
```

---

## 🎯 Escolha Seu Caminho

### 🏠 **Desenvolvimento Local**
```
1. Copiar .env.example → .env.local
2. Configurar DB_HOST=localhost
3. npm start
4. Acessar http://localhost:3001
```
→ Siga: [REFERENCIA_RAPIDA_ENV.md](REFERENCIA_RAPIDA_ENV.md)

### 📱 **Acesso de Outros Dispositivos**
```
1. Obter IP local: ipconfig
2. Configurar CORS_ORIGIN=*
3. Acessar http://seu-ip:3001 no smartphone
```
→ Siga: [ACESSO_DISPOSITIVOS_EXTERNOS.md](ACESSO_DISPOSITIVOS_EXTERNOS.md)

### 🚀 **Deploy no Vercel**
```
1. Adicionar variáveis no Vercel Dashboard
2. Git push
3. Vercel faz deploy automático
```
→ Siga: [ENV_VARIABLES_VERCEL.md](ENV_VARIABLES_VERCEL.md)

---

## 📝 Variáveis de Ambiente

### Desenvolvimento (.env.local)
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=adafashion

# Admin
ADMIN_EMAIL=admin@adafashion.com
ADMIN_PASSWORD=admin123

# Servidor
NODE_ENV=development
CORS_ORIGIN=*
```

### Produção (Vercel Dashboard)
```env
# Database Infinity Free
DB_HOST=sql200.infinityfree.com
DB_USER=if0_42433124
DB_PASSWORD=Nademe1001920
DB_NAME=if0_42433124_adafashion

# Admin
ADMIN_EMAIL=admin@adafashion.com
ADMIN_PASSWORD=admin123

# Servidor
NODE_ENV=production
CORS_ORIGIN=seu-dominio.vercel.app
```

---

## 📁 Arquivos Principais

### Modificados
- ✅ `server/db-infinity.js` - Configuração BD dinâmica
- ✅ `server/index.js` - CORS e Auth dinâmicos
- ✅ `.gitignore` - Proteção de credenciais

### Criados
- ✅ `.env.example` - Template de variáveis
- ✅ Documentação completa (10 arquivos)

---

## 🆘 Troubleshooting Rápido

| Erro | Solução |
|------|---------|
| `Connection refused` | Servidor não rodando. Execute `npm start` |
| `CORS error` | Verifique `CORS_ORIGIN` em `.env.local` |
| `Database not found` | Crie banco em PhpMyAdmin ou Infinity Free |
| `Port already in use` | Mude `PORT` em `.env.local` |
| `Invalid credentials` | Verifique `ADMIN_EMAIL` e `ADMIN_PASSWORD` |

---

## 🔐 Segurança

- ✅ `.env.local` está em `.gitignore` (não será commitado)
- ✅ `.env.example` é versionado (sem credenciais reais)
- ✅ Credenciais podem ser alteradas sem editar código
- ✅ CORS configurável por ambiente
- ✅ NODE_ENV diferencia desenvolvimento de produção

---

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
npm run dev                    # Frontend + Backend
cd server && npm start         # Backend apenas
npm run build                  # Build produção

# Database
cd server && npm run init-db   # Seed admin user

# Testes
npm run test
```

---

## 📊 Arquitetura

```
AdaFashion/
├── .env.local (seu arquivo, não committado)
├── .env.example (template, versionado)
│
├── Frontend (Vite + React)
│   └── Usa VITE_API_URL do .env.local
│
└── Backend (Express)
    ├── server/db-infinity.js (BD configurável)
    ├── server/index.js (API + Auth + CORS)
    └── Lê variáveis de .env.local
```

---

## 📱 URLs por Ambiente

| Ambiente | URL |
|----------|-----|
| Local (Desktop) | `http://localhost:3001` |
| Local (Rede) | `http://192.168.1.100:3001` |
| Produção (Vercel) | `https://seu-projeto.vercel.app` |

---

## 📞 Suporte

Para dúvidas sobre:

- **Variáveis de ambiente** → [REFERENCIA_RAPIDA_ENV.md](REFERENCIA_RAPIDA_ENV.md)
- **Guia completo** → [GUIA_CONFIGURACAO_ENV.md](GUIA_CONFIGURACAO_ENV.md)
- **Acesso móvel** → [ACESSO_DISPOSITIVOS_EXTERNOS.md](ACESSO_DISPOSITIVOS_EXTERNOS.md)
- **Vercel** → [ENV_VARIABLES_VERCEL.md](ENV_VARIABLES_VERCEL.md)
- **Troubleshooting** → [GUIA_CONFIGURACAO_ENV.md](GUIA_CONFIGURACAO_ENV.md#troubleshooting)

---

## ✨ Status

**CONFIGURAÇÃO COMPLETA E PRONTA PARA USAR!**

✅ Banco de dados configurável  
✅ Credenciais dinâmicas  
✅ CORS para acesso externo  
✅ Documentação completa  
✅ Segurança implementada  

---

## 🎯 Próximo Passo

👉 **Leia agora:** [REFERENCIA_RAPIDA_ENV.md](REFERENCIA_RAPIDA_ENV.md) (3 minutos)

ou

👉 **Siga o checklist:** [CHECKLIST_CONFIGURACAO.md](CHECKLIST_CONFIGURACAO.md) (10 minutos)

---

**Versão:** 1.0  
**Data:** 20 de julho de 2026  
**Status:** ✅ Pronto para uso

