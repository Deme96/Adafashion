import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, Settings, Search, User, LogOut } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { getLoggedCustomer, logoutCustomer } from '../../lib/customerAuth';
import { useLanguage } from '../../hooks/useLanguage';

const StoreNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currency, setCurrency] = useState(() => {
    const stored = localStorage.getItem('adafashion_currency');
    return stored && stored !== 'BRL' ? stored : 'XOF';
  });
  
  const { itemCount } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const customer = getLoggedCustomer();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { to: '/', label: t('home') },
    { to: '/produtos', label: t('products') },
    { to: '/novidades', label: t('newArrivals') },
    { to: '/zona-bideras', label: 'Zona di Bideras' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/produtos?busca=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    localStorage.setItem('adafashion_currency', newCurrency);
    window.location.reload();
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-pink-100'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex flex-col items-center leading-none flex-shrink-0">
              <span className={`font-fashion text-2xl lg:text-3xl tracking-tight whitespace-nowrap transition-colors ${
                isScrolled ? 'text-rose-500' : 'text-white'
              }`}>
                Ada Fashion
              </span>
              <span className={`text-[8px] lg:text-[9px] tracking-[0.25em] uppercase font-medium whitespace-nowrap mt-0.5 transition-colors ${
                isScrolled ? 'text-rose-400' : 'text-white/60'
              }`}>
                Casa de Bideras
              </span>
            </Link>

            {/* Desktop Nav Links & Search */}
            <div className="hidden md:flex items-center gap-3 lg:gap-6 flex-1 justify-center ml-4 lg:ml-8 px-2">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium tracking-wide transition-colors relative py-1 whitespace-nowrap ${
                    isScrolled
                      ? isActive(link.to) ? 'text-rose-500' : 'text-gray-500 hover:text-rose-500'
                      : isActive(link.to) ? 'text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {link.label}
                  {isActive(link.to) && (
                    <span className={`absolute -bottom-1 left-0 right-0 h-0.5 rounded-full ${
                      isScrolled ? 'bg-rose-500' : 'bg-white'
                    }`} />
                  )}
                </Link>
              ))}

              <form onSubmit={handleSearch} className="relative w-48 lg:w-64 ml-2 lg:ml-4">
                <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isScrolled ? 'text-gray-400' : 'text-white/60'}`} />
                <input
                  type="text"
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-1.5 text-sm rounded-full outline-none transition-all ${
                    isScrolled
                      ? 'bg-gray-100 text-gray-900 focus:bg-white focus:ring-2 focus:ring-rose-200'
                      : 'bg-white/10 text-white placeholder:text-white/60 focus:bg-white/20 focus:ring-2 focus:ring-white/30'
                  }`}
                />
              </form>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`text-xs font-semibold px-2 py-1.5 rounded-lg outline-none cursor-pointer transition-colors ${
                  isScrolled
                    ? 'bg-rose-50 text-rose-800 border-none'
                    : 'bg-white/10 text-white border-none'
                }`}
              >
                <option value="PT" className="text-gray-900">🇧🇷 PT</option>
                <option value="EN" className="text-gray-900">🇺🇸 EN</option>
                <option value="FR" className="text-gray-900">🇫🇷 FR</option>
              </select>

              <select
                value={currency}
                onChange={handleCurrencyChange}
                className={`text-xs font-semibold px-2 py-1.5 rounded-lg outline-none cursor-pointer transition-colors ${
                  isScrolled
                    ? 'bg-rose-50 text-rose-800 border-none'
                    : 'bg-white/10 text-white border-none'
                }`}
              >
                <option value="USD" className="text-gray-900">USD</option>
                <option value="EUR" className="text-gray-900">EUR</option>
                <option value="XOF" className="text-gray-900">XOF</option>
              </select>

              <Link
                to="/admin/login"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isScrolled
                    ? 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Settings size={14} />
                Admin
              </Link>

              {customer ? (
                <div className="hidden sm:flex items-center gap-2">
                  <span className={`text-xs font-medium ${
                    isScrolled ? 'text-rose-800' : 'text-white/80'
                  }`}>
                    <User size={14} className="inline mr-1" />
                    {customer.name.split(' ')[0]}
                  </span>
                  <button
                    onClick={() => { logoutCustomer(); window.location.reload(); }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isScrolled ? 'text-gray-400 hover:text-rose-500 hover:bg-rose-50' : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                    title={t('logout')}
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <Link
                  to="/cadastro"
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isScrolled
                      ? 'bg-rose-500 text-white hover:bg-rose-600'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  <User size={14} />
                  {t('register')}
                </Link>
              )}

              <Link
                to="/carrinho"
                className={`relative p-2.5 rounded-xl transition-all ${
                  isScrolled
                    ? 'text-rose-800 hover:bg-rose-50'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <ShoppingBag size={22} />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scaleIn">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`md:hidden p-2 rounded-xl transition-colors ${
                  isScrolled ? 'text-rose-800 hover:bg-rose-50' : 'text-white hover:bg-white/10'
                }`}
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-rose-100 shadow-xl animate-fadeIn">
            <div className="px-4 py-4 space-y-1">
              <form onSubmit={handleSearch} className="relative mb-4">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-gray-100 rounded-xl outline-none text-gray-900"
                />
              </form>
              
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-rose-500 text-white'
                      : 'text-gray-700 hover:bg-rose-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/admin/login"
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-rose-50 transition-colors"
              >
                <Settings size={16} />
                Painel Admin
              </Link>
              {customer ? (
                <button
                  onClick={() => { logoutCustomer(); window.location.reload(); }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-rose-50 transition-colors w-full text-left"
                >
                  <LogOut size={16} />
                  {t('logout')} ({customer.name.split(' ')[0]})
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-rose-50 transition-colors"
                  >
                    <User size={16} />
                    {t('login')}
                  </Link>
                  <Link
                    to="/cadastro"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors"
                  >
                    <User size={16} />
                    {t('register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StoreNavbar;
