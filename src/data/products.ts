export type ProductCategory =
  | 'Accessories'
  | 'Apparel'
  | 'Tech'
  | 'Home'
  | 'Outdoor'
  | 'Wellness'
  | 'Travel';

export type Product = {
  id: number;
  name: string;
  price: number;
  category: ProductCategory;
  image: string;
  description: string;
  rating?: number;
  discount?: number;
};

const rawProducts: Product[] = [
  {
    id: 2,
    name: 'Lumos Smart Lamp',
    price: 89.5,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1545243424-0ce743321e11?auto=format&fit=crop&w=1000&q=80',
    description:
      'A minimalist smart lamp with ambient light sensors, adaptive brightness, and wireless charging built into the base.',
    rating: 4.5,
    discount: 10,
  },
  {
    id: 3,
    name: 'AeroFit Running Sneakers',
    price: 119,
    category: 'Apparel',
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1000&q=80',
    description:
      'Lightweight running shoes engineered with responsive foam cushioning and breathable knit uppers for daily training.',
    rating: 4.7,
    discount: 12,
  },
  {
    id: 5,
    name: 'Orbit Bluetooth Speaker',
    price: 74.99,
    category: 'Tech',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
    description:
      'Compact speaker featuring 360-degree sound, waterproof housing, and PartyLink for pairing up to 10 devices.',
    rating: 4.6,
    discount: 18,
  },
  {
    id: 6,
    name: 'Luxe Leather Backpack',
    price: 189.49,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80',
    description:
      'Handcrafted Italian leather backpack with padded laptop sleeve and modular interior compartments.',
    rating: 4.7,
    discount: 20,
  },
  {
    id: 8,
    name: 'ZenBrew Pour Over Set',
    price: 58,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=1000&q=80',
    description:
      'Precision brewing kit with a double-walled glass carafe, reusable stainless filter, and bamboo accents.',
    rating: 4.4,
  },
  {
    id: 9,
    name: 'Summit Trail Jacket',
    price: 214,
    category: 'Outdoor',
    image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1000&q=80',
    description:
      'Weatherproof shell with seam-sealed construction, adjustable hood, and ventilated panels for alpine adventures.',
    rating: 4.6,
    discount: 15,
  },
  {
    id: 10,
    name: 'Pulse Fitness Tracker',
    price: 134.95,
    category: 'Tech',
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1000&q=80',
    description:
      'Multi-sport fitness tracker with ECG monitoring, GPS tracking, and guided breathing exercises.',
    rating: 4.5,
    discount: 10,
  },
  {
    id: 11,
    name: 'Skyline Polarized Sunglasses',
    price: 68.5,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=80',
    description:
      'Premium acetate frames with scratch-resistant polarized lenses for everyday clarity and UV protection.',
    rating: 4.1,
  },
  {
    id: 12,
    name: 'TerraFlow Yoga Mat',
    price: 52,
    category: 'Wellness',
    image: 'https://images.unsplash.com/photo-1549068106-b024baf5062d?auto=format&fit=crop&w=1000&q=80',
    description:
      'Eco-friendly mat with dual-texture grip, cushion support, and antimicrobial finish for restorative sessions.',
    rating: 4.6,
    discount: 8,
  },
  {
    id: 13,
    name: 'JetSet Carry-On',
    price: 229,
    category: 'Travel',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
    description:
      'Lightweight polycarbonate carry-on with 360-degree spinner wheels, TSA locks, and USB charging port.',
    rating: 4.5,
    discount: 12,
  },
  {
    id: 14,
    name: 'Solstice Linen Bedding Set',
    price: 179,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1000&q=80',
    description:
      'Luxurious stonewashed linen bedding that becomes softer with every wash and regulates sleep temperature.',
    rating: 4.3,
    discount: 10,
  },
  {
    id: 16,
    name: 'Timberline Trekking Poles',
    price: 129,
    category: 'Outdoor',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80',
    description:
      'Telescoping carbon trekking poles with cork grips and quick-lock adjusters for all-season hikes.',
    rating: 4.4,
  },
  {
    id: 17,
    name: 'Halo Minimalist Watch',
    price: 198,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
    description:
      'Ultra-thin titanium watch with sapphire crystal, luminous markers, and 5ATM water resistance.',
    rating: 4.6,
    discount: 15,
  },
  {
    id: 18,
    name: 'CloudNine Travel Pillow',
    price: 48,
    category: 'Travel',
    image: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1000&q=80',
    description:
      'Ergonomic memory foam travel pillow with magnetic clasp and washable cover for long-haul comfort.',
    rating: 4.2,
  },
  {
    id: 19,
    name: 'Verve Cold Brew Maker',
    price: 72,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1000&q=80',
    description:
      'Stainless cold brew system with reusable mesh filter and 1.5L carafe for cafe-quality concentrate at home.',
    rating: 4.3,
  },
  {
    id: 20,
    name: 'Horizon Portable Charger',
    price: 64,
    category: 'Tech',
    image: 'https://images.unsplash.com/photo-1527430253228-e93688616381?auto=format&fit=crop&w=1000&q=80',
    description:
      'Slim 10,000mAh power bank with passthrough charging and magnetic alignment for MagSafe devices.',
    rating: 4.4,
    discount: 12,
  },
  {
    id: 21,
    name: 'Echo Studio Desk Speakers',
    price: 158,
    category: 'Tech',
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=1000&q=80',
    description:
      'Desktop speakers with dual silk-dome tweeters, compact subwoofer, and Bluetooth 5.2 connectivity.',
    rating: 4.5,
    discount: 10,
  },
  {
    id: 22,
    name: 'Grove Stoneware Dinner Set',
    price: 146,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80',
    description:
      'Twelve-piece stoneware dinner set with matte glaze and stackable profiles for modern tables.',
    rating: 4.2,
  },
  {
    id: 23,
    name: 'Momentum Cycling Jersey',
    price: 98,
    category: 'Apparel',
    image: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=1000&q=80',
    description:
      'Moisture-wicking cycling jersey with laser-cut sleeves, rear cargo pockets, and reflective taping.',
    rating: 4.5,
  },
  {
    id: 24,
    name: 'Haven Weighted Blanket',
    price: 165,
    category: 'Wellness',
    image: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1000&q=80',
    description:
      'Weighted blanket filled with glass microbeads and breathable lyocell cover to calm restless nights.',
    rating: 4.4,
    discount: 15,
  },
  {
    id: 25,
    name: 'Pulse Bluetooth Earband',
    price: 74,
    category: 'Wellness',
    image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1000&q=80',
    description:
      'Soft-knit Bluetooth headband that plays soothing audio while tracking sleep and meditation sessions.',
    rating: 4.3,
  },
 
  
  {
    id: 29,
    name: 'Glide Travel Sneakers',
    price: 128,
    category: 'Apparel',
    image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1000&q=80',
    description:
      'Versatile knit sneakers with fold-down heel, responsive cushioning, and antimicrobial lining.',
    rating: 4.4,
    discount: 10,
  },
  {
    id: 30,
    name: 'Atlas Adventure Pack',
    price: 182,
    category: 'Outdoor',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1000&q=80',
    description:
      '65-liter adventure pack with hydration sleeve, ventilated back panel, and modular gear loops.',
    rating: 4.6,
    discount: 18,
  },
  
  {
    id: 32,
    name: 'Flux Wireless Charger',
    price: 58,
    category: 'Tech',
    image: 'https://images.unsplash.com/photo-1527430253228-e93688616381?auto=format&fit=crop&w=1000&q=80',
    description:
      'Slim wireless charger supporting MagSafe devices with fast charging and soft-touch finish.',
    rating: 4.5,
    discount: 12,
  },
];

const hasProductImage = (product: Product) =>
  typeof product.image === 'string' && product.image.trim().length > 0;

export const products: Product[] = rawProducts.filter(hasProductImage);

export const categories = [
  'All',
  'Accessories',
  'Apparel',
  'Tech',
  'Home',
  'Outdoor',
  'Wellness',
  'Travel',
] as const;
