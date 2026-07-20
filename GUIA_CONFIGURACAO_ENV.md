# 📋 Guia de Configuração - Variáveis de Ambiente

## 🚀 Para Desenvolvimento Local

### 1. Criar arquivo `.env.local` na raiz do projeto
```bash
# Copie o conteúdo de .env.example para .env.local
cp .env.example .env.local
```

### 2. Configurar para localhost + PhpMyAdmin
```env
# Database (Local)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_local
DB_NAME=adafashion

# Admin
ADMIN_EMAIL=admin@adafashion.com
ADMIN_PASSWORD=admin123
ADMIN_FULL_NAME=Administrador AdaFashion

# Server
NODE_ENV=development
PORT=3001
SERVER_URL=http://localhost:3001

# Client
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=AdaFashion

# CORS - Permite dispositivos na rede local
CORS_ORIGIN=*
```

### 3. Executar servidor local
```bash
cd server
npm install
npm start
```

---

## 🌐 Para Produção no Vercel

### 1. Acesse o Vercel Dashboard
- Vá para Settings > Environment Variables do seu projeto

### 2. Adicione as variáveis de produção
```env
# Infinity Free Database
DB_HOST=sql200.infinityfree.com
DB_PORT=3306
DB_USER=if0_42433124
DB_PASSWORD=Nademe1001920
DB_NAME=if0_42433124_adafashion

# Admin
ADMIN_EMAIL=admin@adafashion.com
ADMIN_PASSWORD=admin123
ADMIN_FULL_NAME=Administrador AdaFashion

# Server
NODE_ENV=production
PORT=3001
SERVER_URL=https://seu-dominio.vercel.app

# Client
VITE_API_URL=https://seu-dominio.vercel.app
VITE_APP_NAME=AdaFashion

# Security
SESSION_SECRET=use_openssl_rand_hex_32
CORS_ORIGIN=https://seu-dominio.vercel.app
```

### 3. Gerar SESSION_SECRET seguro
```bash
# No terminal (Linux/Mac)
openssl rand -hex 32

# Ou use online: https://uuidonline.com/ ou gere uma string aleatória forte
```

### 4. Deploy
```bash
git push origin main  # Vercel redeploya automaticamente
```

---

## 🔐 Acesso Externo (Dispositivos na rede)

Para permitir que dispositivos externos/móveis acessem o servidor:

### Local Development
```env
# Use o IP local do computador
SERVER_URL=http://seu-ip-local:3001  # Ex: http://192.168.1.100:3001
VITE_API_URL=http://seu-ip-local:3001

# CORS permissivo (apenas desenvolvimento)
CORS_ORIGIN=*
```

### Production (Vercel)
```env
# Vercel fornece HTTPS automático
SERVER_URL=https://seu-dominio.vercel.app
VITE_API_URL=https://seu-dominio.vercel.app

# CORS restritivo
CORS_ORIGIN=https://seu-dominio.vercel.app
```

---

## 📱 Testar de Dispositivos Externos

### 1. Obter IP local do servidor
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```

### 2. No dispositivo externo, use
```
http://seu-ip-local:3001
```

### 3. Login com credenciais do admin
- Email: `admin@adafashion.com`
- Password: `admin123`

---

## 🔄 Alternativas de Banco de Dados

### Opção 1: Localhost (Desenvolvimento)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=adafashion
```

### Opção 2: Infinity Free (Produção - Recomendado)
```env
DB_HOST=sql200.infinityfree.com
DB_USER=if0_42433124
DB_PASSWORD=Nademe1001920
DB_NAME=if0_42433124_adafashion
```

### Opção 3: Outras Opções (MySQL Cloud, etc)
```env
DB_HOST=seu-host-externo.com
DB_USER=seu-usuario
DB_PASSWORD=sua-senha
DB_NAME=seu-banco
```

---

## ✅ Checklist de Segurança

- [ ] SESSION_SECRET é uma string aleatória forte (mínimo 32 caracteres)
- [ ] ADMIN_PASSWORD não é a senha padrão em produção
- [ ] DB_PASSWORD não está no repositório (use `.env.local` e `.gitignore`)
- [ ] CORS_ORIGIN está restrito a domínios confiáveis em produção
- [ ] NODE_ENV=production em Vercel
- [ ] Credenciais de Infinity Free são válidas

---

## 🐛 Troubleshooting

### Erro: "Connection refused"
- Verificar se o banco de dados está rodando
- Verificar credenciais de conexão
- Verificar se DB_HOST está correto

### Erro: "Unknown database"
- Criar banco de dados no PhpMyAdmin
- Executar script de migração se necessário

### Erro: "Access denied for admin"
- Verificar ADMIN_EMAIL e ADMIN_PASSWORD
- Verificar se usuário admin existe no banco
- Executar `init-db.js` para seed

### CORS errors
- Verificar CORS_ORIGIN no server
- Adicionar sua origem à lista branca
