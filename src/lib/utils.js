// ========== MODARE Utilities ==========

/**
 * Format a number as a site currency value
 */
export const formatCurrency = (value) => {
  const storedCurrency = localStorage.getItem('adafashion_currency');
  const currency = storedCurrency && storedCurrency !== 'BRL' ? storedCurrency : 'XOF';
  const EXCHANGE_RATES = { USD: 0.20, EUR: 0.18, XOF: 1 };
  
  const currencyCode = ['USD', 'EUR', 'XOF'].includes(currency) ? currency : 'XOF';
  const rate = EXCHANGE_RATES[currencyCode] || 1;
  
  let numValue = Number(value);
  if (isNaN(numValue)) numValue = 0;
  
  const converted = numValue * rate;
  
  if (currencyCode === 'XOF') {
    return Math.round(converted).toLocaleString('pt-BR') + ' F CFA';
  }
  
  const CURRENCY_LOCALES = { USD: 'en-US', EUR: 'de-DE' };
  return new Intl.NumberFormat(CURRENCY_LOCALES[currencyCode] || 'en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(converted);
};

/**
 * Calculate discount percentage
 */
export const calcDiscount = (price, salePrice) => {
  if (!salePrice || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
};

/**
 * Format date to pt-BR locale
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format date with time
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Truncate text to a max length
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Product categories
 */
export const CATEGORIES = [
  'Camisetas',
  'Calças',
  'Vestidos',
  'Jaquetas',
  'Acessórios',
  'Sapatos',
  'Shorts',
  'Saias',
  'Blusas',
  'Outros',
];

/**
 * Order status options with colors
 */
export const ORDER_STATUS = {
  'Pendente': { color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  'Confirmado': { color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  'Em Preparo': { color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  'Enviado': { color: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
  'Entregue': { color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  'Cancelado': { color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
};

/**
 * Purchase status options with colors
 */
export const PURCHASE_STATUS = {
  'Pendente': { color: 'bg-yellow-100 text-yellow-800' },
  'Recebido': { color: 'bg-green-100 text-green-800' },
  'Cancelado': { color: 'bg-red-100 text-red-800' },
};

/**
 * Payment methods
 */
export const PAYMENT_METHODS = ['Orange Money', 'Teletacu', 'Visa'];

/**
 * Get initials from a name
 */
export const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

/**
 * Generate a simple SKU
 */
export const generateSKU = (category, index) => {
  const prefix = (category || 'OTH').substring(0, 3).toUpperCase();
  return `${prefix}-${String(index).padStart(4, '0')}`;
};

/**
 * Convert file to base64
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file.type.match(/image.*/)) {
      reject(new Error("File is not an image"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = image.width;
        let height = image.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);

        // Compress to JPEG with 0.8 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      image.onerror = (error) => reject(error);
      image.src = readerEvent.target.result;
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Get months for charts (last N months)
 */
export const getLastMonths = (n = 6) => {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    });
  }
  return months;
};
