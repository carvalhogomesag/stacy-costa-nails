// src/constants.tsx

// 1. Identificador Único (Multi-tenant)
export const CLIENT_ID = 'stacy-costa-nails';

// 2. Informações de Exibição
export const BUSINESS_INFO = {
  name: "Stacy Costa",
  subName: "Nails & Beauty",
  owner: "Stacy Costa",
  phone: '927 271 352', 
  address: 'R. Margarida Palla 9c',
  city: '1495-142 Algés, Portugal',
  openingHours: 'Segunda a Sábado: 09:00 - 19:00',
  bookingUrl: 'https://wa.me/351927271352', 
  googleMapsUrl: 'https://maps.app.goo.gl/PQ4F+8R', 
  instagramUrl: 'https://instagram.com/stacycostanails' 
};

// 3. Serviços Iniciais (Fallback)
export const SERVICES = [
  { 
    id: '1', 
    name: 'Manicure Gel', 
    description: 'Aplicação de gel com acabamento impecável e alta durabilidade.', 
    price: 'A consultar',
    duration: 60
  },
  { 
    id: '2', 
    name: 'Alongamento', 
    description: 'Técnicas avançadas para unhas perfeitas e naturais.', 
    price: 'A consultar',
    duration: 90
  },
  { 
    id: '3', 
    name: 'Pedicure', 
    description: 'Cuidado completo para os pés com hidratação e brio.', 
    price: 'A consultar',
    duration: 45
  }
];

// 4. Reviews reais de Algés
export const REVIEWS = [
  {
    id: 1,
    author: 'Manuela Miranda',
    date: 'há 7 meses',
    text: 'A Stacy é maravilhosa! Faço unhas em gel com ela e o resultado é impecável — acabamento perfeito e durabilidade incrível.',
    avatar: 'https://ui-avatars.com/api/?name=Manuela+Miranda&background=f43f5e&color=fff'
  },
  {
    id: 2,
    author: 'Elaine Bueno',
    date: 'há 5 meses',
    text: 'Uma profissional extremamente cuidadosa em todos os aspetos, torna a experiência muito agradável e completa.',
    avatar: 'https://ui-avatars.com/api/?name=Elaine+Bueno&background=f43f5e&color=fff'
  },
  {
    id: 3,
    author: 'Taís Lira',
    date: 'há 4 meses',
    text: 'Atendimento ótimo e as unhas ficam surreais de lindas. Perfeito!',
    avatar: 'https://ui-avatars.com/api/?name=Tais+Lira&background=f43f5e&color=fff'
  }
];

// 5. Galeria (Fotos padrão na pasta public/images/)
export const GALLERY_IMAGES = [
  { id: 1, url: '/images/foto01.webp', alt: 'Stacy Costa Nails - Trabalho 01' },
  { id: 2, url: '/images/foto02.webp', alt: 'Stacy Costa Nails - Trabalho 02' },
  { id: 3, url: '/images/foto03.webp', alt: 'Stacy Costa Nails - Trabalho 03' },
  { id: 4, url: '/images/foto04.webp', alt: 'Stacy Costa Nails - Trabalho 04' },
  { id: 5, url: '/images/foto05.webp', alt: 'Espaço Stacy Costa 01' },
  { id: 6, url: '/images/foto06.webp', alt: 'Espaço Stacy Costa 02' },
  { id: 7, url: '/images/foto07.webp', alt: 'Espaço Stacy Costa 03' },
  { id: 8, url: '/images/foto08.webp', alt: 'Espaço Stacy Costa 04' },
];