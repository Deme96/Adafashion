import { useEffect, useState, useRef } from 'react';
import api from '../../lib/api';

const DEFAULT_IMAGES = [
  'https://images.pexels.com/photos/3945683/pexels-photo-3945683.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Vestido elegante
  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Camisola branca
  'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Bolsa de couro
  'https://images.pexels.com/photos/3622617/pexels-photo-3622617.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Cosméticos e maquiagem
  'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Vestido colorido
  'https://images.pexels.com/photos/2220294/pexels-photo-2220294.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1'  // Camisola de moda
];

const LogoCarousel = ({ images = null, interval = 5000 }) => {
  const [carouselImages, setCarouselImages] = useState([]);
  const [loadedImages, setLoadedImages] = useState({});
  const [index, setIndex] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    // Se não há imagens passadas, carregar do banco de dados
    if (!images) {
      const loadPhotos = async () => {
        try {
          const dbPhotos = await api.getAllCarouselPhotos();
          if (dbPhotos && dbPhotos.length > 0) {
            setCarouselImages(dbPhotos.map(p => p.image_url));
          } else {
            setCarouselImages(DEFAULT_IMAGES);
          }
        } catch (error) {
          console.error('Error loading carousel photos:', error);
          setCarouselImages(DEFAULT_IMAGES);
        }
      };
      loadPhotos();
    } else {
      setCarouselImages(images);
    }
  }, [images]);

  useEffect(() => {
    mounted.current = true;
    const id = setInterval(() => {
      if (mounted.current) {
        setIndex(i => (i + 1) % carouselImages.length);
      }
    }, interval);
    return () => { 
      mounted.current = false; 
      clearInterval(id); 
    };
  }, [carouselImages.length, interval]);

  const handleImageLoad = (i) => {
    setLoadedImages(prev => ({ ...prev, [i]: true }));
  };

  return (
    <div className="absolute inset-x-0 top-1/3 rounded-none overflow-hidden pointer-events-none" style={{ opacity: 1, zIndex: 0, height: '500px', backgroundColor: '#f3e8e8' }}>
      {/* Container com transição horizontal */}
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        transform: `translateX(-${index * 100}%)`,
        transition: 'transform 0.8s ease-in-out'
      }}>
        {carouselImages.map((src, i) => (
          <div key={i} className="w-full h-full flex-shrink-0 bg-gray-300" style={{ position: 'relative' }}>
            <img
              src={src}
              alt={`slide-${i}`}
              onLoad={() => handleImageLoad(i)}
              onError={() => handleImageLoad(i)}
              className="w-full h-full object-cover transition-opacity duration-500"
              style={{ opacity: loadedImages[i] ? 1 : 0, transform: 'translateZ(0)', willChange: 'transform' }}
            />
          </div>
        ))}
      </div>
      {/* Fade overlay nas extremidades - removido rosa, apenas transparência suave */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 100%)',
        pointerEvents: 'none'
      }} />
    </div>
  );
};

export default LogoCarousel;
