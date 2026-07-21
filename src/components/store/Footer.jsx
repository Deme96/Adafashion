// ========== Ada Fashion Footer ==========
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-rose-400 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h2 className="font-fashion text-3xl font-bold italic text-white tracking-tight mb-1">Ada Fashion</h2>
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/60 font-medium mb-4">Casa de Bideras</p>
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              Moda contemporânea com qualidade premium. Estilo que transforma, peças que inspiram.
            </p>
            <div className="flex gap-3">
              {[
                { name: 'Instagram', url: 'https://instagram.com' },
                { name: 'Facebook', url: 'https://www.facebook.com/gb.fashion.ada/about' },
                { name: 'TikTok', url: 'https://tiktok.com' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors text-xs text-white/80 font-medium"
                >
                  {social.name}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-white">
              Navegação
            </h3>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Início' },
                { to: '/produtos', label: 'Produtos' },
                { to: '/novidades', label: 'Novidades' },
                { to: '/carrinho', label: 'Carrinho' },
                { to: '/zona-bideras', label: 'Zona di Bideras' },
              ].map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-white">
              Categorias
            </h3>
            <ul className="space-y-3">
              {['Camisetas', 'Calças', 'Vestidos', 'Jaquetas', 'Acessórios'].map(cat => (
                <li key={cat}>
                  <Link
                    to={`/produtos?categoria=${cat}`}
                    className="text-sm text-rose-300/60 hover:text-white transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-white">
              Contato
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-white/70">
                <Mail size={16} className="text-white/50 shrink-0" />
                contato@adafashion.com.br
              </li>
              <li className="flex items-center gap-3 text-sm text-rose-300/60">
                <Phone size={16} className="text-white/50 shrink-0" />
                (+245) 955 38 29 03
              </li>
              <li className="flex items-start gap-3 text-sm text-rose-300/60">
                <MapPin size={16} className="text-white/50 shrink-0 mt-0.5" />
                Pilum - Entrada de ADPP, Bissau, GB
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Ada Fashion — Casa de Bideras. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-rose-400/40 hover:text-rose-200 transition-colors">
              Política de Privacidade
            </a>
            <a href="#" className="text-xs text-rose-400/40 hover:text-rose-200 transition-colors">
              Termos de Uso
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
