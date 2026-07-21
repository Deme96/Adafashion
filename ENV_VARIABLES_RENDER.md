# ====================================
# VARIÁVEIS DE AMBIENTE PARA RENDER
# ====================================
# Copie e cole essas variáveis no Dashboard do Render
# Selecione o seu Web Service > Environment > Environment Variables

# ====================================
# DATABASE - Render PostgreSQL
# ====================================
# Use a Internal Database URL caso o banco de dados e a API estejam no mesmo projeto no Render, ou a External Database URL caso não estejam.
DATABASE_URL=postgresql://[USUARIO]:[SENHA]@dpg-d9fjlvjtqb8s73d897e0-a/adafashion

# ====================================
# ADMIN CREDENTIALS
# ====================================
ADMIN_EMAIL=admin@adafashion.com
ADMIN_PASSWORD=admin123
ADMIN_FULL_NAME=Administrador AdaFashion

# ====================================
# SERVER CONFIGURATION
# ====================================
NODE_ENV=production
# O Render injeta a variável PORT automaticamente, mas você pode declará-la se preferir:
PORT=10000
# Substitua pela URL gerada para o seu backend no Render:
SERVER_URL=https://adafashion-api.onrender.com

# ====================================
# CLIENT CONFIGURATION
# ====================================
# Substitua pela URL do seu backend no Render
VITE_API_URL=https://adafashion-api.onrender.com
VITE_APP_NAME=AdaFashion

# ====================================
# SESSION & SECURITY
# ====================================
SESSION_SECRET=gere-uma-chave-segura-aleatoria-aqui-use-openssl-rand-hex

# ====================================
# CORS - Permite acesso externo seguro
# ====================================
# Substitua pela URL do seu frontend no Render
CORS_ORIGIN=https://adafashion.onrender.com
# Se quiser liberar para qualquer origem durante os testes iniciais, use:
# CORS_ORIGIN=*

# ====================================
# INSTRUÇÕES ADICIONAIS PARA RENDER
# ====================================
# 1. Build Command: 
#    Se for apenas backend: npm install
#    Se for fullstack: npm install && npm run build
# 2. Start Command: 
#    Se for apenas backend: node server/index.js
#    Se for fullstack: npm start
