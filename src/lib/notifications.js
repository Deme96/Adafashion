const TOAST_EVENT = 'adafashion:toast';

export const notify = (message, type = 'info', duration = 4000) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
    detail: { message, type, duration },
  }));
};

export const subscribeToNotifications = (handler) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(TOAST_EVENT, handler);
  return () => window.removeEventListener(TOAST_EVENT, handler);
};
