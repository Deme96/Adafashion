// ========== Ada Fashion Customer Auth ==========
// Handles customer registration and login via backend MySQL API

import { getApiBaseUrl } from './api.js';

const CUSTOMER_TOKEN_KEY = 'adafashion_customer_token';

const saveCustomerToken = (customer) => {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, JSON.stringify(customer));
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export const registerCustomer = async (name, email, phone, password, account_type = 'normal') => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/customers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: normalizeEmail(email), phone, password, account_type }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Falha ao registrar o cliente.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error registering customer', error);
    return { success: false, error: 'Falha ao conectar ao servidor.' };
  }
};

export const loginCustomer = async (email, password) => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/customers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizeEmail(email), password }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, error: data.message || 'E-mail ou senha incorretos.' };
    }

    saveCustomerToken({ id: data.customer.id, name: data.customer.name, email: data.customer.email, account_type: data.customer.account_type || 'normal' });
    return { success: true, customer: data.customer };
  } catch (error) {
    console.error('Error logging in customer', error);
    return { success: false, error: 'Falha ao conectar ao servidor.' };
  }
};

export const logoutCustomer = () => {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
};

export const getLoggedCustomer = () => {
  try {
    const data = localStorage.getItem(CUSTOMER_TOKEN_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const isCustomerLoggedIn = () => {
  return !!localStorage.getItem(CUSTOMER_TOKEN_KEY);
};
