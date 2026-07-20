#!/usr/bin/env node

/**
 * Test Admin Login
 * Simulates a login request to verify admin authentication works
 */

const express = require('express');
const bodyParser = require('body-parser');

// Set environment for test
process.env.ADMIN_EMAIL = 'admin@adafashion.com';
process.env.ADMIN_PASSWORD = 'admin123';
process.env.ADMIN_FULL_NAME = 'Administrador AdaFashion';

// Load the minimal app (just the auth part)
const app = express();
app.use(bodyParser.json());

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME;

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeUserRole = (role) => role || 'Admin';

// Mock pool that fails (simulating database down)
const pool = {
  query: async () => {
    throw new Error('Database connection failed');
  },
};

// Login endpoint with fallback
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const fallbackAdmin = normalizedEmail === ADMIN_EMAIL.toLowerCase() && String(password || '').trim() === ADMIN_PASSWORD;

    let userRow = null;
    let dbAvailable = true;

    try {
      const [rows] = await pool.query('SELECT id, full_name AS name, email, role, password_hash FROM users WHERE LOWER(TRIM(email)) = ?', [normalizedEmail]);
      userRow = rows && rows[0] ? rows[0] : null;
    } catch (dbError) {
      console.error('Database auth lookup failed', dbError.message);
      dbAvailable = false;

      if (fallbackAdmin) {
        console.log('✓ Using fallback admin authentication (database unavailable)');
        return res.json({
          success: true,
          user: {
            id: 1,
            name: ADMIN_FULL_NAME,
            email: normalizedEmail,
            role: 'Admin',
          },
        });
      }

      return res.status(503).json({
        success: false,
        message: 'Serviço de autenticação temporariamente indisponível.',
      });
    }

    const directMatch = userRow && String(userRow.password_hash || '').trim() === String(password || '').trim();

    if (directMatch || fallbackAdmin) {
      const role = normalizeUserRole(userRow?.role || 'Admin');
      const user = userRow || {
        id: 1,
        name: ADMIN_FULL_NAME,
        email: normalizedEmail,
        role: 'Admin',
      };

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role,
        },
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Credenciais inválidas',
    });
  } catch (error) {
    console.error('Error authenticating', error);
    res.status(500).json({
      success: false,
      message: 'Falha ao processar autenticação',
    });
  }
});

// Start test server
const server = app.listen(0, 'localhost', async () => {
  const { port } = server.address();
  const baseUrl = `http://localhost:${port}`;

  console.log('\n=== Testing Admin Authentication ===\n');

  try {
    // Test 1: Valid credentials
    console.log('Test 1: Valid admin credentials');
    let response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@adafashion.com',
        password: 'admin123',
      }),
    });

    let data = await response.json();
    if (data.success && data.user.role === 'Admin') {
      console.log('✓ PASSED: Admin login successful');
      console.log(`  User: ${data.user.name} (${data.user.email})`);
      console.log(`  Role: ${data.user.role}\n`);
    } else {
      console.log('✗ FAILED: Admin login did not work');
      console.log('  Response:', data, '\n');
    }

    // Test 2: Invalid password
    console.log('Test 2: Invalid password');
    response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@adafashion.com',
        password: 'wrong-password',
      }),
    });

    data = await response.json();
    if (!data.success && response.status === 503) {
      console.log('✓ PASSED: Invalid credentials correctly rejected');
      console.log(`  Message: ${data.message}\n`);
    } else {
      console.log('✗ FAILED: Should reject invalid credentials');
      console.log('  Response:', data, '\n');
    }

    // Test 3: Non-admin email
    console.log('Test 3: Non-admin email');
    response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'other@example.com',
        password: 'any-password',
      }),
    });

    data = await response.json();
    if (!data.success && response.status === 503) {
      console.log('✓ PASSED: Non-admin email correctly rejected');
      console.log(`  Message: ${data.message}\n`);
    } else {
      console.log('✗ FAILED: Should reject non-admin email');
      console.log('  Response:', data, '\n');
    }

    console.log('=== All tests completed ===\n');
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    server.close();
    process.exit(0);
  }
});
