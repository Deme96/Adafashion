const http = require('http');

const email = ` teste_${Date.now()}@Example.com `;
const registerPayload = JSON.stringify({
  name: 'Teste Usuario',
  email,
  password: '123456',
  account_type: 'grossista',
});

const requestJson = (path, payload) => new Promise((resolve, reject) => {
  const req = http.request({
    hostname: 'localhost',
    port: 4000,
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  }, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      try {
        resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
      } catch {
        resolve({ statusCode: res.statusCode, body });
      }
    });
  });

  req.on('error', reject);
  req.write(payload);
  req.end();
});

(async () => {
  try {
    const registerRes = await requestJson('/api/customers/register', registerPayload);
    console.log('REGISTER_STATUS', registerRes.statusCode);
    console.log('REGISTER_BODY', JSON.stringify(registerRes.body));

    const loginRes = await requestJson('/api/customers/login', JSON.stringify({ email: email.trim().toLowerCase(), password: '123456' }));
    console.log('LOGIN_STATUS', loginRes.statusCode);
    console.log('LOGIN_BODY', JSON.stringify(loginRes.body));

    if (registerRes.statusCode !== 201 || loginRes.statusCode !== 200) {
      throw new Error('O fluxo de registo/login falhou.');
    }

    if (loginRes.body?.customer?.account_type !== 'grossista') {
      throw new Error('O tipo de conta não foi preservado no login.');
    }

    console.log('TEST_OK');
  } catch (error) {
    console.error('TEST_FAIL', error.message);
    process.exit(1);
  }
})();
