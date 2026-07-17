// ========== ADA FASHION PAYMENT API MOCKS ==========
// Estas funções simulam a conexão com as APIs de Telecom (Orange, Teletacu) e Bancos Comerciais na Guiné-Bissau.
// Em produção, você substituirá o conteúdo destas funções pelas chamadas reais usando fetch() ou axios para os endpoints oficiais.

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const validateOrangeMoney = async (phone, amount) => {
  // Simula latência de rede da API Orange Bissau
  await delay(2000);
  
  if (!phone || phone.length < 9) {
    return { success: false, error: 'Número de telefone Orange inválido.' };
  }
  
  // Em produção, aqui iria um fetch para a API da Orange.
  return {
    success: true,
    transactionId: `OM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    message: `Pagamento de ${amount} aprovado via Orange Money.`
  };
};

export const validateMobileMoney = async (phone, amount) => {
  // Simula latência de rede da API Teletacu
  await delay(2000);
  
  if (!phone || phone.length < 9) {
    return { success: false, error: 'Número de telefone Teletacu inválido.' };
  }
  
  // Em produção, fetch() para a API Teletacu.
  return {
    success: true,
    transactionId: `TC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    message: `Pagamento de ${amount} aprovado via Teletacu.`
  };
};

export const validateVisa = async (cardData, amount) => {
  // Simula latência de rede de Gateway Bancário (ex: BAO, BDU, Ecobank)
  await delay(2500);
  
  const { number, expiry, cvv } = cardData;
  
  if (!number || number.replace(/\D/g, '').length < 15) {
    return { success: false, error: 'Número de cartão Visa inválido.' };
  }
  
  if (!expiry || !cvv) {
    return { success: false, error: 'Dados do cartão incompletos.' };
  }

  // Em produção, o token de pagamento seria enviado ao Gateway do banco.
  return {
    success: true,
    transactionId: `VISA-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    message: `Pagamento de ${amount} aprovado via Visa.`
  };
};
