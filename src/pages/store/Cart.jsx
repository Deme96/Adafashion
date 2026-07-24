// ========== MODARE Cart Page ==========
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShoppingBag, Trash2, Minus, Plus, ArrowLeft, Check,
  CreditCard, QrCode, FileText, Banknote, ChevronRight, Store, Landmark
} from 'lucide-react';
import api from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { useCart } from '../../hooks/useCart';
import { validateOrangeMoney, validateMobileMoney, validateVisa } from '../../lib/paymentApi';
import StoreNavbar from '../../components/store/StoreNavbar';
import Footer from '../../components/store/Footer';

const CHECKOUT_PAYMENT_METHODS = ['Dinheiro', 'Teletacu', 'Orange Money', 'Transferência bancária'];

const paymentIcons = {
  'Dinheiro': Banknote,
  'Teletacu': QrCode,
  'Orange Money': QrCode,
  'Transferência bancária': Landmark,
};

const Cart = () => {
  const { cart, removeItem, updateQuantity, refreshCart, clearCart, subtotal, shipping, total, itemCount } = useCart();
  const location = useLocation();
  const initialStep = location.state?.step === 'checkout' || new URLSearchParams(location.search).get('step') === 'checkout' ? 'checkout' : 'cart';
  const [step, setStep] = useState(initialStep); // cart | checkout | success
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    payment_method: 'Orange Money',
    notes: '',
    payment_phone: '',
    card_number: '',
    card_expiry: '',
    card_cvv: '',
  });
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPaymentMethod, setLastPaymentMethod] = useState('');

  useEffect(() => {
    refreshCart();

    const params = new URLSearchParams(location.search);
    const action = location.state?.action || params.get('action');

    if (action === 'reserve') {
      setForm(prev => ({ ...prev, payment_method: 'Dinheiro' }));
      setStep('checkout');
    } else if (action === 'buy') {
      setForm(prev => ({ ...prev, payment_method: 'Orange Money' }));
      setStep('checkout');
    }
  }, [location.key, location.search, location.state, refreshCart]);

  const validateForm = () => {
    const newErrors = {};
    if (!form.customer_name.trim()) newErrors.customer_name = 'Nome é obrigatório';
    if (!form.customer_email.trim()) newErrors.customer_email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(form.customer_email)) newErrors.customer_email = 'Email inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    let paymentResult = null;

    try {
      if (form.payment_method === 'Orange Money') {
        paymentResult = await validateOrangeMoney(form.payment_phone, total);
      } else if (form.payment_method === 'Teletacu') {
        paymentResult = await validateMobileMoney(form.payment_phone, total);
      }

      if (paymentResult && !paymentResult.success) {
        setErrors({ ...errors, payment: paymentResult.error });
        setIsProcessing(false);
        return;
      }
    } catch (error) {
      setErrors({ ...errors, payment: 'Erro ao processar pagamento. Tente novamente.' });
      setIsProcessing(false);
      return;
    }

    const order = await api.createOrder({
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      customer_address: form.customer_address,
      payment_method: form.payment_method,
      notes: form.notes,
      items: cart.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
        image: item.image || '',
      })),
      total,
      status: 'Pendente',
      transaction_id: paymentResult?.transactionId,
    });

    clearCart();
    setLastPaymentMethod(form.payment_method);
    setStep('success');
    setIsProcessing(false);
  };

  if (step === 'success') {
    const isReservation = lastPaymentMethod === 'Reserva na Loja';
    return (
      <div className="min-h-screen bg-white">
        <StoreNavbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center animate-scaleIn max-w-md px-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isReservation ? 'bg-rose-100' : 'bg-green-100'
            }`}>
              {isReservation
                ? <Store size={40} className="text-rose-600" />
                : <Check size={40} className="text-green-600" />}
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-3">
              {isReservation ? 'Reserva Confirmada!' : 'Pedido Confirmado!'}
            </h1>
            <p className="text-gray-500 mb-4">
              {isReservation
                ? 'Os seus produtos foram reservados com sucesso na nossa loja.'
                : 'Seu pedido foi recebido com sucesso.'}
            </p>
            {isReservation && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-sm text-rose-800 mb-6 text-left">
                <p className="font-bold mb-1">Como funciona:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Os produtos estão separados e guardados para si.</li>
                  <li>Dirija-se à nossa loja física para levantar a encomenda.</li>
                  <li>O pagamento é feito apenas no momento da retirada.</li>
                </ul>
              </div>
            )}
            <Link
              to="/produtos"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
            >
              Continuar Comprando
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <StoreNavbar />

      <div className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              to="/produtos"
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {step === 'checkout' ? 'Finalizar Pedido' : 'Carrinho'}
              </h1>
              <p className="text-sm text-gray-500">
                {step === 'checkout'
                  ? 'Preencha seus dados para finalizar'
                  : `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`
                }
              </p>
            </div>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              step === 'cart' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              <ShoppingBag size={14} />
              Carrinho
            </div>
            <ChevronRight size={14} className="text-gray-300" />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              step === 'checkout' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              <CreditCard size={14} />
              Pagamento
            </div>
          </div>

          {cart.length === 0 && step === 'cart' ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={28} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Carrinho vazio</h3>
              <p className="text-sm text-gray-500 mb-6">Adicione produtos para continuar</p>
              <Link
                to="/produtos"
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
              >
                Ver Produtos
              </Link>
            </div>
          ) : step === 'cart' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart.map(item => (
                  <div key={item.key} className="flex gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="w-20 h-24 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                      <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{item.product_name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.size && `Tam: ${item.size}`} {item.color && `• ${item.color}`}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="p-1.5 hover:bg-gray-50">
                            <Minus size={14} />
                          </button>
                          <span className="px-3 text-xs font-semibold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="p-1.5 hover:bg-gray-50">
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-bold text-sm text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.key)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors self-start"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-2xl p-6 sticky top-32">
                  <h3 className="font-bold text-gray-900 mb-4">Resumo</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Frete</span>
                      <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                        {shipping === 0 ? 'Grátis' : formatCurrency(shipping)}
                      </span>
                    </div>
                    {shipping > 0 && (
                      <p className="text-xs text-green-600">
                        Frete grátis acima de {formatCurrency(299)}
                      </p>
                    )}
                    <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900 text-base">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep('checkout')}
                    className="w-full mt-6 bg-gray-900 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors active:scale-[0.98]"
                  >
                    Finalizar Pedido
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">Nome completo *</label>
                  <input
                    type="text"
                    value={form.customer_name}
                    onChange={(e) => setForm(f => ({ ...f, customer_name: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all ${
                      errors.customer_name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="Seu nome completo"
                  />
                  {errors.customer_name && <p className="text-xs text-red-500 mt-1">{errors.customer_name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={form.customer_email}
                    onChange={(e) => setForm(f => ({ ...f, customer_email: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all ${
                      errors.customer_email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="seu@email.com"
                  />
                  {errors.customer_email && <p className="text-xs text-red-500 mt-1">{errors.customer_email}</p>}
                </div>

                {/* Phone + Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">Telefone</label>
                    <input
                      type="tel"
                      value={form.customer_phone}
                      onChange={(e) => setForm(f => ({ ...f, customer_phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">Endereço</label>
                    <input
                      type="text"
                      value={form.customer_address}
                      onChange={(e) => setForm(f => ({ ...f, customer_address: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Rua, número, bairro, cidade"
                    />
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Forma de Pagamento</label>
                  <div className="grid grid-cols-2 gap-3">
                    {CHECKOUT_PAYMENT_METHODS.map(method => {
                      const Icon = paymentIcons[method] || CreditCard;
                      return (
                        <button
                          key={method}
                          onClick={() => setForm(f => ({ ...f, payment_method: method }))}
                          className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                            form.payment_method === method
                              ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon size={20} className={form.payment_method === method ? 'text-gray-900' : 'text-gray-400'} />
                          <span className="text-sm font-medium">{method}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Formulário Dinâmico de Pagamento */}
                  <div className="mt-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                    {errors.payment && (
                      <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                        {errors.payment}
                      </div>
                    )}
                    
                    {(form.payment_method === 'Orange Money' || form.payment_method === 'Teletacu') && (
                      <div className="space-y-4 animate-fadeIn">
                        <label className="block text-sm font-semibold text-gray-700">
                          Número de Telefone associado ao {form.payment_method}
                        </label>
                        <input
                          type="tel"
                          value={form.payment_phone}
                          onChange={(e) => setForm(f => ({ ...f, payment_phone: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                          placeholder="Digite o número de telefone"
                        />
                      </div>
                    )}
                     {form.payment_method === 'Transferência bancária' && (
                      <div className="space-y-4 animate-fadeIn p-5 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 text-sm">
                        <div className="flex items-start gap-3">
                          <Landmark size={24} className="text-blue-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block mb-1 text-base">Pagamento via Transferência</strong>
                            <p className="mb-2">Ao confirmar o pedido, enviaremos os dados da nossa conta bancária para você realizar a transferência.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {form.payment_method === 'Dinheiro' && (
                      <div className="space-y-4 animate-fadeIn p-5 bg-rose-50 border border-rose-100 rounded-xl text-rose-900 text-sm">
                        <div className="flex items-start gap-3">
                          <Banknote size={24} className="text-rose-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block mb-1 text-base">Pagamento em Dinheiro</strong>
                            <p className="mb-2">O pagamento será realizado no momento da entrega do pedido ou retirada na loja.</p>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">Observações</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                    rows={3}
                    placeholder="Alguma observação sobre o pedido?"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-2xl p-6 sticky top-32">
                  <h3 className="font-bold text-gray-900 mb-4">Resumo do Pedido</h3>
                  <div className="space-y-3 mb-4">
                    {cart.map(item => {
                      const minQty = item.is_wholesale && item.wholesale_min_qty ? parseInt(item.wholesale_min_qty) : 1;
                      return (
                        <div key={item.key} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700 truncate max-w-[55%] font-medium">
                              {item.product_name}
                            </span>
                            <span className="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                          {/* Quantity controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => updateQuantity(item.key, Math.max(minQty, item.quantity - 1))}
                                className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors text-gray-600"
                                disabled={item.quantity <= minQty}
                              >
                                <Minus size={11} />
                              </button>
                              <input
                                type="number"
                                min={minQty}
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || minQty;
                                  updateQuantity(item.key, Math.max(minQty, val));
                                }}
                                className="w-10 h-6 text-center text-xs font-bold border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-rose-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <button
                                onClick={() => updateQuantity(item.key, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(item.key)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title="Remover"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          {/* Min qty warning for wholesale */}
                          {item.is_wholesale && minQty > 1 && (
                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5">
                              <Store size={10} className="text-amber-500 flex-shrink-0" />
                              <span className="text-[10px] text-amber-700 font-medium">
                                Mín: {minQty} unidades
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Frete</span>
                      <span>{shipping === 0 ? 'Grátis' : formatCurrency(shipping)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900 text-base">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setStep('cart')}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleCheckout}
                      disabled={isProcessing}
                      className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processando...
                        </>
                      ) : (
                        form.payment_method === 'Dinheiro' ? 'Confirmar Pedido' : 'Confirmar Pagamento'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cart;
