// ========== Ada Fashion Hero Section ==========
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import LogoCarousel from './LogoCarousel';

const HeroSection = () => {
  const { t } = useLanguage();
  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-400 via-rose-500 to-pink-400" />
        {/* Carousel behind the title (50% opacity) - desktop only */}
        <div className="absolute inset-0 hidden lg:block">
          <LogoCarousel />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-pink-400/[0.06] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-rose-400/[0.08] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-pink-400/[0.04] to-transparent rounded-full" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-slideUp">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-white/[0.08] border border-white/[0.1] rounded-full px-4 py-2 mb-8">
            <Sparkles size={14} className="text-pink-300" />
            <span className="text-xs font-medium text-white/60 tracking-wider uppercase">
              Nova Coleção 2027
            </span>
          </div>

          {/* Title */}
          <h1 className="font-fashion text-6xl sm:text-8xl lg:text-9xl xl:text-[10rem] font-bold italic text-white tracking-tight leading-[0.85] mb-2">
            Ada Fashion
          </h1>

          {/* Subtitle — Casa de Bideras */}
          <p className="text-sm sm:text-base tracking-[0.3em] uppercase text-pink-300/70 font-medium mb-8">
            Casa de Bideras
          </p>

          {/* Description */}
          <p className="text-lg sm:text-xl text-white/40 max-w-lg mx-auto mb-20 font-light leading-relaxed">
            Moda contemporânea com qualidade premium.
            <br className="hidden sm:block" />
            Estilo que transforma.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/produtos"
              className="group inline-flex items-center gap-2 bg-white text-rose-500 px-8 py-4 rounded-full text-sm font-bold tracking-wide hover:bg-pink-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {t('discover')}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/novidades"
              className="inline-flex items-center gap-2 bg-white/[0.08] text-white/80 px-8 py-4 rounded-full text-sm font-medium tracking-wide border border-white/[0.1] hover:bg-white/[0.12] transition-all"
            >
              {t('newArrivals')}
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-md mx-auto animate-fadeIn" style={{ animationDelay: '0.6s' }}>
          {[
            { value: '500+', label: 'Produtos' },
            { value: '10k+', label: 'Clientes' },
            { value: '4.9', label: 'Avaliação' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stat.value}</div>
              <div className="text-xs text-pink-300/40 mt-1 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/40 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
