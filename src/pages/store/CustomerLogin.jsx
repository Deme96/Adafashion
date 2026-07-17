// ========== Ada Fashion Customer Login Page ==========
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { loginCustomer } from '../../lib/customerAuth';
import StoreNavbar from '../../components/store/StoreNavbar';
import Footer from '../../components/store/Footer';

const CustomerLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim()) return setError('Informe seu e-mail.');
    if (!form.password.trim()) return setError('Informe sua senha.');

    const result = await loginCustomer(form.email, form.password);

    if (result.success) {
      const redirectTo = window.location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    } else {
      setError(result.error);
    }
  };

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
            <h2 className="text-xl font-bold text-gray-900">Entrar na Sua Conta</h2>
            <p className="text-sm text-gray-500 mt-1">Acesse sua conta para continuar comprando</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-rose-200/30 border border-rose-100/60 p-8">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm font-medium px-4 py-3 rounded-xl mb-6 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mail</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all"
                  />
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
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Sua senha"
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

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-rose-400 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-rose-500 transition-all active:scale-[0.98] shadow-lg shadow-rose-400/20"
              >
                Entrar
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Não tem uma conta?{' '}
                <Link to="/cadastro" className="text-rose-700 font-semibold hover:text-rose-500 transition-colors">
                  Criar Conta
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

export default CustomerLogin;
