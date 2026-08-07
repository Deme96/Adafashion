// ========== Ada Fashion Home Page ==========
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Newspaper, Tag, Percent } from 'lucide-react';
import api from '../../lib/api';
import { formatCurrency, calcDiscount, truncateText, formatDate } from '../../lib/utils';
import StoreNavbar from '../../components/store/StoreNavbar';
import HeroSection from '../../components/store/HeroSection';
import ProductCard from '../../components/store/ProductCard';
import Footer from '../../components/store/Footer';
import Modal from '../../components/ui/Modal';
import { useLanguage } from '../../hooks/useLanguage';

const Home = () => {
  const { t } = useLanguage();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [news, setNews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [promoProducts, setPromoProducts] = useState([]);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const products = await api.getAllProducts();
      const allProducts = products || [];
      setAllProducts(allProducts);
      setFeaturedProducts(allProducts.filter(p => p.is_active));
      
      const promos = await api.getAllPromotions();
      setPromotions((promos || []).filter(p => p.is_active));
      
      const newsData = await api.getAllNews();
      setNews((newsData || []).filter(n => n.is_published));
      
      const videosData = await api.getAllVideos();
      setVideos((videosData || []).filter(v => v.is_published));
    } catch (error) {
      console.error('Error loading home data:', error);
    }
  };

  const openPromoModal = (promo) => {
    const filtered = (allProducts || []).filter(p => (promo.selected_products || []).includes(p.id));
    setPromoProducts(filtered);
    setSelectedPromo(promo);
  };

  return (
    <div className="min-h-screen bg-white">
      <StoreNavbar />

      {/* Hero */}
      <HeroSection />

      {/* Promotions Banner */}
      {promotions.length > 0 && (
        <section className="bg-pink-50/50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Percent size={20} className="text-rose-600" />
              </div>
              <div>
                <h2 className="font-fashion text-2xl font-bold tracking-tight text-rose-500">{t('sale')}</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {promotions.map(promo => (
                <div
                  key={promo.id}
                  onClick={() => openPromoModal(promo)}
                  className="cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-900 to-pink-950 h-56 group shadow-sm hover:shadow-xl transition-shadow"
                >
                  {promo.banner_image && (
                    <img
                      src={promo.banner_image}
                      alt={promo.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-950/80 to-transparent" />
                  <div className="relative h-full flex flex-col justify-center p-8">
                    <div className="inline-flex items-center gap-1 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-3">
                      <Tag size={12} />
                      -{promo.discount_percent}% OFF
                    </div>
                    <h3 className="font-fashion text-2xl font-bold text-white tracking-tight mb-2">{promo.name}</h3>
                    <p className="text-sm text-white/60 max-w-sm">{promo.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-fashion text-3xl font-bold tracking-tight text-rose-500">{t('featured')}</h2>
              </div>
              <Link
                to="/produtos"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors"
              >
                {t('viewAll')}
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 stagger-children">
              {featuredProducts.slice(0, 8).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link
                to="/produtos"
                className="inline-flex items-center gap-2 text-sm font-medium text-rose-500"
              >
                {t('viewAll')}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <section className="bg-pink-50/50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-rose-400 flex items-center justify-center">
                <Play size={20} className="text-white ml-0.5" />
              </div>
              <div>
                <h2 className="font-fashion text-3xl font-bold tracking-tight text-rose-500">{t('videos')}</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map(video => (
                <div key={video.id} className="rounded-2xl overflow-hidden bg-white shadow-sm border border-pink-100">
                  <div className="aspect-video">
                    <iframe
                      src={video.url}
                      title={video.title}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm">{video.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* News */}
      {news.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Newspaper size={20} className="text-rose-600" />
                </div>
                <div>
                  <h2 className="font-fashion text-3xl font-bold tracking-tight text-rose-500">{t('news')}</h2>
                </div>
              </div>
              <Link
                to="/novidades"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors"
              >
                {t('viewAll')}
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.slice(0, 3).map(item => (
                <article key={item.id} className="group rounded-2xl overflow-hidden bg-white border border-pink-100 hover:shadow-lg transition-shadow">
                  {item.image && (
                    <div className="aspect-[21/9] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-xs text-gray-400 mb-2">{formatDate(item.created_at)}</p>
                    <h3 className="font-bold text-gray-900 tracking-tight mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{truncateText(item.content, 120)}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />

      {/* Promotion Modal */}
      <Modal 
        isOpen={!!selectedPromo} 
        onClose={() => setSelectedPromo(null)} 
        title={selectedPromo?.name}
        size="lg"
      >
        {selectedPromo && (
          <div className="space-y-6">
            <div className="bg-rose-50/50 p-4 rounded-xl text-center">
              <p className="text-sm text-rose-500 mb-2">{selectedPromo.description}</p>
              <div className="flex items-center justify-center gap-6 text-sm">
                <span className="font-bold text-rose-600 bg-white px-3 py-1 rounded-full shadow-sm">
                  -{selectedPromo.discount_percent}% OFF
                </span>
                <span className="text-gray-500">
                  {selectedPromo.start_date ? formatDate(selectedPromo.start_date) : 'Agora'} até {selectedPromo.end_date ? formatDate(selectedPromo.end_date) : 'Duração Indeterminada'}
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4 text-center">Produtos na Promoção</h3>
              {promoProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {promoProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8 bg-gray-50 rounded-xl">
                  Nenhum produto em estoque associado a esta promoção no momento.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Home;
