// ========== MODARE Cart Hook ==========
import { useState, useEffect, useCallback } from 'react';

const CART_KEY = 'modare_cart';

const getCartFromStorage = () => {
  try {
    const data = localStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveCartToStorage = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  // Dispatch custom event for cross-component sync
  window.dispatchEvent(new CustomEvent('cart-update', { detail: cart }));
  // Also dispatch a refresh event so consumers can explicitly reload from storage
  try {
    window.dispatchEvent(new CustomEvent('cart-refresh'));
  } catch (e) {
    // ignore
  }
};

const generateItemKey = (productId, size, color) => {
  return `${productId}-${size || 'default'}-${color || 'default'}`;
};

export const useCart = () => {
  const [cart, setCart] = useState(getCartFromStorage);

  // Listen for storage events (cross-tab sync) and custom cart-update events
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === CART_KEY) {
        setCart(getCartFromStorage());
      }
    };

    const handleCartUpdate = (e) => {
      setCart(e.detail || []);
    };

    const handleCartRefresh = () => {
      setCart(getCartFromStorage());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cart-update', handleCartUpdate);
    window.addEventListener('cart-refresh', handleCartRefresh);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cart-update', handleCartUpdate);
      window.removeEventListener('cart-refresh', handleCartRefresh);
    };
  }, []);

  const addItem = useCallback((product, size, color, quantity = 1) => {
    setCart(prev => {
      const key = generateItemKey(product.id, size, color);
      const existing = prev.find(item => item.key === key);

      let newCart;
      if (existing) {
        newCart = prev.map(item =>
          item.key === key
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [...prev, {
          key,
          product_id: product.id,
          product_name: product.name,
          price: product.sale_price && product.sale_price < product.price
            ? product.sale_price
            : product.price,
          original_price: product.price,
          image: product.images?.[0] || '',
          size: size || '',
          color: color || '',
          quantity,
          is_wholesale: product.is_wholesale || false,
          wholesale_min_qty: product.wholesale_min_qty || 1,
        }];
      }

      saveCartToStorage(newCart);
      return newCart;
    });
  }, []);

  const removeItem = useCallback((key) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.key !== key);
      saveCartToStorage(newCart);
      return newCart;
    });
  }, []);

  const updateQuantity = useCallback((key, quantity) => {
    if (quantity <= 0) {
      return removeItem(key);
    }
    setCart(prev => {
      const newCart = prev.map(item =>
        item.key === key ? { ...item, quantity } : item
      );
      saveCartToStorage(newCart);
      return newCart;
    });
  }, [removeItem]);

  const refreshCart = useCallback(() => {
    setCart(getCartFromStorage());
  }, []);

  const clearCart = useCallback(() => {
    saveCartToStorage([]);
    setCart([]);
  }, []);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 299 ? 0 : 15.00;
  const total = subtotal + shipping;

  return {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    refreshCart,
    clearCart,
    itemCount,
    subtotal,
    shipping,
    total,
  };
};

export default useCart;
