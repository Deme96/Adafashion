// ========== MODARE News Page ==========
import { useState, useEffect } from 'react';
import { Newspaper } from 'lucide-react';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';
import StoreNavbar from '../../components/store/StoreNavbar';
import Footer from '../../components/store/Footer';

const NewsPage = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const newsData = await api.getAllNews();
        const published = (newsData || []).filter(n => n.is_published);
        setNews(published.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } catch (error) {
        console.error('Error loading news:', error);
      }
    };
    loadNews();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <StoreNavbar />

      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">Novidades</h1>
          <p className="text-gray-400 mt-2">Fique por dentro das últimas notícias</p>
        </div>
      </div>

      {/* News List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {news.length > 0 ? (
          <div className="space-y-12">
            {news.map((item, index) => (
              <article
                key={item.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {item.image && (
                  <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-6">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">{formatDate(item.created_at)}</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{item.title}</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                </div>
                {index < news.length - 1 && (
                  <div className="border-b border-gray-100 mt-12" />
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Newspaper size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhuma novidade ainda</h3>
            <p className="text-sm text-gray-500">Em breve teremos novidades para compartilhar</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default NewsPage;
