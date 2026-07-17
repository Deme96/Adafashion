// ========== Ada Fashion Customer Registration Page ==========
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import { registerCustomer } from '../../lib/customerAuth';
import StoreNavbar from '../../components/store/StoreNavbar';
import Footer from '../../components/store/Footer';

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    account_type: 'normal',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!form.name.trim()) return setError('O nome é obrigatório.');
    if (!form.email.trim()) return setError('O e-mail é obrigatório.');
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError('Formato de e-mail inválido.');
    if (form.password.length < 6) return setError('A senha deve ter no mínimo 6 caracteres.');
    if (form.password !== form.confirmPassword) return setError('As senhas não coincidem.');

    const result = await registerCustomer(form.name, form.email, form.phone, form.password, form.account_type);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } else {
      setError(result.error);
    }
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  if (success) {
    return (
      <div className="min-h-screen bg-white">
        <StoreNavbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center animate-scaleIn max-w-md px-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-3">Conta Criada!</h1>
            <p className="text-gray-500 mb-4">
              Bem-vindo(a) à Ada Fashion, <strong>{form.name}</strong>!<br />
              Sua conta foi criada com sucesso.
            </p>
            <p className="text-sm text-gray-400">Redirecionando para a loja...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      <StoreNavbar />

      <div className="pt-24 pb-20 px-4">
        <div className="max-w-md mx-auto">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-rose-500 transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Voltar à Loja
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-fashion text-4xl font-bold italic text-rose-500 tracking-tight mb-2">Ada Fashion</h1>
            <p className="text-[10px] tracking-[0.25em] uppercase text-rose-400 font-medium mb-4">Casa de Bideras</p>
            <h2 className="text-xl font-bold text-gray-900">Criar Conta</h2>
            <p className="text-sm text-gray-500 mt-1">Cadastre-se para uma experiência completa de compras</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-rose-200/30 border border-rose-100/60 p-8">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl mb-6 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome Completo</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mail</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telefone (Opcional)</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="(+245) 955 000 000"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                  />
                </div>
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo de Conta</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateField('account_type', 'normal')}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      form.account_type === 'normal'
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-gray-200 text-gray-500 hover:border-rose-200'
                    }`}
                  >
                    Cliente Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('account_type', 'grossista')}
                    className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      form.account_type === 'grossista'
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-gray-200 text-gray-500 hover:border-rose-200'
                    }`}
                  >
                    Grossista
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Senha</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmar Senha</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-rose-400 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-rose-500 transition-all active:scale-[0.98] shadow-lg shadow-rose-400/20"
              >
                Criar Minha Conta
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-rose-700 font-semibold hover:text-rose-500 transition-colors">
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Register;
