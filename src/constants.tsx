// src/constants.tsx

// 1. Identificador Único (Multi-tenant)
// Este ID isola completamente os dados e fotos deste cliente no Firebase
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
  googleMapsUrl: 'https://maps.app.goo.gl/Mes2wiu4m1G6Mweu7', 
  instagramUrl: 'https://instagram.com/stacycostanails' 
};

// 3. URL de Placeholder Elegante
// Esta imagem aparecerá nos 8 slots caso o cliente ainda não tenha feito upload de fotos reais.
export const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1610992015732-2449b0c26670?q=80&w=1200&auto=format&fit=crop";

// 4. Serviços Iniciais (Fallback)
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

// 5. Reviews reais de Algés
export const REVIEWS = [
  {
    id: 1,
    author: 'Manuela Miranda',
    date: 'há 7 meses',
    text: 'A Stacy é maravilhosa! Faço unhas em gel com ela e o resultado é impecável — acabamento perfeito e durabilidade incrível.',
    avatar: 'https://ui-avatars.com/api/?name=Manuela+Miranda&background=b5967a&color=fff'
  },
  {
    id: 2,
    author: 'Elaine Bueno',
    date: 'há 5 meses',
    text: 'Uma profissional extremamente cuidadosa em todos os aspetos, torna a experiência muito agradável e completa.',
    avatar: 'https://ui-avatars.com/api/?name=Elaine+Bueno&background=b5967a&color=fff'
  },
  {
    id: 3,
    author: 'Taís Lira',
    date: 'há 4 meses',
    text: 'Atendimento ótimo e as unhas ficam surreais de lindas. Perfeito!',
    avatar: 'https://ui-avatars.com/api/?name=Tais+Lira&background=b5967a&color=fff'
  }
];