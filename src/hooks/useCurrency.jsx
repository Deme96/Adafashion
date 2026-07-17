import { useState, createContext, useContext } from 'react';

const CurrencyContext = createContext();

const EXCHANGE_RATES = {
  USD: 0.20,
  EUR: 0.18,
  XOF: 118,
};

const CURRENCY_LOCALES = {
  USD: 'en-US',
  EUR: 'de-DE',
  XOF: 'fr-FR',
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(() => {
    const stored = localStorage.getItem('adafashion_currency');
    return stored && stored !== 'BRL' ? stored : 'XOF';
  });

  const setCurrency = (newCurrency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('adafashion_currency', newCurrency);
  };

  const formatPrice = (valueInBRL) => {
    const currencyCode = ['USD', 'EUR', 'XOF'].includes(currency) ? currency : 'XOF';
    const rate = EXCHANGE_RATES[currencyCode] || 1;
    const converted = (valueInBRL || 0) * rate;

    return new Intl.NumberFormat(CURRENCY_LOCALES[currencyCode] || 'fr-FR', {
      style: 'currency',
      currency: currencyCode,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
