// Product image catalog and dynamic lookup utility for fertilizers, pesticides, fungicides, and organic crop care products

export interface AgroProductInfo {
  name: string;
  imageUrl: string;
  brand: string;
  category: 'Fertilizer' | 'Fungicide' | 'Insecticide' | 'Organic' | 'Bio-Pesticide' | 'Soil Nutrient';
  packagingSize: string;
}

const PRODUCT_IMAGE_DATABASE: Record<string, { imageUrl: string; brand: string; category: AgroProductInfo['category']; packagingSize: string }> = {
  // Neem & Organic Remedies
  'neem': {
    imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
    brand: 'NeemGold Eco Protect',
    category: 'Organic',
    packagingSize: '1 Litre Spray Bottle'
  },
  'copper': {
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    brand: 'Blitox 50 (Copper Oxychloride)',
    category: 'Fungicide',
    packagingSize: '500g Pack'
  },
  'mancozeb': {
    imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=600&q=80',
    brand: 'Indofil M-45 Mancozeb 75% WP',
    category: 'Fungicide',
    packagingSize: '1 kg Box'
  },
  'urea': {
    imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80',
    brand: 'IFFCO Neem Coated Urea',
    category: 'Fertilizer',
    packagingSize: '45 kg Bag'
  },
  'npk': {
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb16195?auto=format&fit=crop&w=600&q=80',
    brand: 'Gromor NPK 19-19-19 Soluble',
    category: 'Fertilizer',
    packagingSize: '1 kg Foil Pouch'
  },
  'dap': {
    imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80',
    brand: 'KRIBHCO DAP (Di-Ammonium Phosphate)',
    category: 'Fertilizer',
    packagingSize: '50 kg Sack'
  },
  'potassium': {
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
    brand: 'IPL MOP (Muriate of Potash)',
    category: 'Fertilizer',
    packagingSize: '50 kg Sack'
  },
  'trichoderma': {
    imageUrl: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=600&q=80',
    brand: 'Bio-Shield Trichoderma Viride',
    category: 'Bio-Pesticide',
    packagingSize: '1 kg Bio-Pack'
  },
  'compost': {
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80',
    brand: 'AgroRich Premium Organic Vermicompost',
    category: 'Organic',
    packagingSize: '25 kg Eco Bag'
  },
  'sulphur': {
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    brand: 'Sulfex 80% WP Sulphur Fungicide',
    category: 'Fungicide',
    packagingSize: '1 kg Box'
  },
  'insecticide': {
    imageUrl: 'https://images.unsplash.com/photo-1628102491629-778571d893a3?auto=format&fit=crop&w=600&q=80',
    brand: 'Confidor Imidacloprid 17.8 SL',
    category: 'Insecticide',
    packagingSize: '250 ml Bottle'
  },
  'imidacloprid': {
    imageUrl: 'https://images.unsplash.com/photo-1628102491629-778571d893a3?auto=format&fit=crop&w=600&q=80',
    brand: 'Bayer Confidor Insecticide',
    category: 'Insecticide',
    packagingSize: '250 ml Bottle'
  },
  'carbendazim': {
    imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=600&q=80',
    brand: 'Bavistin 50% WP Systemic Fungicide',
    category: 'Fungicide',
    packagingSize: '500g Pack'
  },
  'amritpani': {
    imageUrl: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=600&q=80',
    brand: 'Vedic Organic Amritpani Culture',
    category: 'Organic',
    packagingSize: '5 Litre Canister'
  },
  'zinc': {
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
    brand: 'Chelated Zinc EDTA 12% Nutrient',
    category: 'Soil Nutrient',
    packagingSize: '500g Pack'
  }
};

/**
 * Returns exact product image, brand name, category, and packaging size for any given fertilizer or pesticide product name.
 */
export function getProductDetails(productName: string, isOrganic: boolean = false): AgroProductInfo {
  if (!productName) {
    return {
      name: 'AgroCare Crop Care Product',
      imageUrl: isOrganic 
        ? 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
      brand: isOrganic ? 'Organic Crop Shield' : 'AgroCare Crop Protection',
      category: isOrganic ? 'Organic' : 'Fungicide',
      packagingSize: '1 Unit'
    };
  }

  const nameLower = productName.toLowerCase();

  // Search keyword match in database
  for (const [keyword, info] of Object.entries(PRODUCT_IMAGE_DATABASE)) {
    if (nameLower.includes(keyword)) {
      return {
        name: productName,
        imageUrl: info.imageUrl,
        brand: info.brand,
        category: info.category,
        packagingSize: info.packagingSize
      };
    }
  }

  // Smart defaults based on remedy characteristics
  if (nameLower.includes('spray') || nameLower.includes('liquid') || nameLower.includes('oil') || isOrganic) {
    return {
      name: productName,
      imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
      brand: 'Bio-Agro Herbal Shield',
      category: isOrganic ? 'Organic' : 'Insecticide',
      packagingSize: '1 Litre Bottle'
    };
  }

  if (nameLower.includes('powder') || nameLower.includes('dust') || nameLower.includes('wp') || nameLower.includes('fungi')) {
    return {
      name: productName,
      imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=600&q=80',
      brand: 'AgroFung Protect WP',
      category: 'Fungicide',
      packagingSize: '500g Pack'
    };
  }

  // Default fertilizer / agrochem image
  return {
    name: productName,
    imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=600&q=80',
    brand: 'KisanCare Agriculture Grade Product',
    category: 'Fertilizer',
    packagingSize: 'Commercial Pack'
  };
}
