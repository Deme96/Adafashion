# 📱 Guia: Acesso de Dispositivos Externos

## 🎯 Objetivo
Permitir que smartphones, tablets e outros dispositivos na mesma rede (ou internet) acessem a aplicação AdaFashion.

---

## 🏠 Desenvolvimento Local (Rede Doméstica)

### Passo 1: Obter IP Local do Servidor

**Windows (PowerShell):**
```powershell
ipconfig
```
Procure por "IPv4 Address" - geralmente algo como `192.168.1.100`

**Linux/Mac:**
```bash
ifconfig
```

### Passo 2: Configurar CORS no .env.local

**Arquivo:** `server/.env.local`

```env
# Opção 1: Permitir TODOS os acessos (Desenvolvimento apenas)
CORS_ORIGIN=*

# Opção 2: Permitir apenas da sua rede local
CORS_ORIGIN=http://192.168.1.100:3001,http://localhost:3001

# Opção 3: Permitir múltiplos IPs
CORS_ORIGIN=http://192.168.1.100:3001,http://192.168.1.101:3000,http://localhost:3001
```

### Passo 3: Iniciar Servidor

```bash
cd server
npm start
```

Você verá algo como:
```
✅ Database connected successfully
📊 Host: localhost
🔐 Database: adafashion
Server running on port 3001
```

### Passo 4: Acessar de Outro Dispositivo

Na rede local, abra o navegador e acesse:

```
http://seu-ip-local:3001
```

**Exemplos:**
- Desktop local: `http://localhost:3001`
- Smartphone na rede: `http://192.168.1.100:3001`
- Tablet na rede: `http://192.168.1.100:3001`

### Passo 5: Login

Use as credenciais do admin:
- **Email:** `admin@adafashion.com`
- **Password:** `admin123`

---

## 🌐 Produção (Vercel)

### Passo 1: Variáveis de Ambiente no Vercel

Adicione no painel do Vercel:

```env
DB_HOST=sql200.infinityfree.com
DB_USER=if0_42433124
DB_PASSWORD=Nademe1001920
DB_NAME=if0_42433124_adafashion

ADMIN_EMAIL=admin@adafashion.com
ADMIN_PASSWORD=admin123
ADMIN_FULL_NAME=Administrador AdaFashion

NODE_ENV=production
SERVER_URL=https://seu-projeto.vercel.app
VITE_API_URL=https://seu-projeto.vercel.app

CORS_ORIGIN=https://seu-projeto.vercel.app
```

### Passo 2: Deploy

```bash
git push origin main
```

Vercel fará deploy automaticamente.

### Passo 3: Acessar de Qualquer Lugar

Qualquer pessoa pode acessar:
```
https://seu-projeto.vercel.app
```

---

## 🔐 Segurança - Checklist

### Desenvolvimento Local (Rede Segura)
- ✅ CORS_ORIGIN=* (apenas no desenvolvimento)
- ✅ Conectar apenas à rede confiável
- ✅ Firewall do Windows/Linux deve permitir porta 3001

### Produção (Vercel)
- ✅ CORS_ORIGIN restrito ao seu domínio
- ✅ HTTPS automático
- ✅ Credenciais fortes
- ✅ NODE_ENV=production
- ✅ SESSION_SECRET alterado

---

## 🚨 Problemas Comuns

### ❌ "Connection refused" (Recusado)
**Causa:** Servidor não está rodando ou porta bloqueada
**Solução:**
```bash
cd server
npm start
# Verificar se servidor está de pé
```

### ❌ "CORS error" (Erro CORS)
**Causa:** CORS_ORIGIN não inclui seu domínio
**Solução:**
1. Verifique seu IP/domínio
2. Atualize CORS_ORIGIN
3. Reinicie servidor

### ❌ "Cannot GET /" 
**Causa:** Arquivo não encontrado
**Solução:** Frontend pode estar em pasta diferente

### ❌ "Credenciais inválidas"
**Causa:** ADMIN_PASSWORD incorreta ou banco não inicializado
**Solução:**
```bash
cd server
npm run init-db  # Se existir esse script
```

---

## 📊 Teste de Conectividade

### Do servidor para verificar se está escutando:
```bash
# Windows
netstat -an | findstr :3001

# Linux/Mac
lsof -i :3001
```

### Do cliente (smartphone) - teste de ping:
```bash
# Verificar se consegue alcançar servidor
ping 192.168.1.100
```

---

## 🔗 URLs de Referência

| Ambiente | URL | Acesso |
|----------|-----|--------|
| Local (Desktop) | `http://localhost:3001` | Apenas seu PC |
| Local (Rede) | `http://192.168.1.100:3001` | Rede doméstica |
| Produção | `https://projeto.vercel.app` | Internet pública |

---

## 📝 Notas Importantes

1. **Porta 3001** deve estar aberta no firewall
2. **Rede local** geralmente é segura para CORS_ORIGIN=*
3. **Produção** sempre use CORS_ORIGIN restritivo
4. **Credenciais** não devem estar no .gitignore ignoradas
5. **HTTPS** é obrigatório em produção

