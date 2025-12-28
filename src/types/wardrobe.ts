// Wardrobe types matching backend schema

export enum WardrobeCategory {
  // Tops
  TSHIRT = 'tshirt',
  SHIRT = 'shirt',
  BLOUSE = 'blouse',
  TANK_TOP = 'tank_top',
  CROP_TOP = 'crop_top',
  SWEATER = 'sweater',
  HOODIE = 'hoodie',
  SWEATSHIRT = 'sweatshirt',
  CARDIGAN = 'cardigan',

  // Bottoms
  JEANS = 'jeans',
  PANTS = 'pants',
  SHORTS = 'shorts',
  SKIRT = 'skirt',
  LEGGINGS = 'leggings',
  JOGGERS = 'joggers',

  // Dresses
  DRESS = 'dress',
  JUMPSUIT = 'jumpsuit',
  ROMPER = 'romper',

  // Outerwear
  JACKET = 'jacket',
  COAT = 'coat',
  BLAZER = 'blazer',
  VEST = 'vest',
  PARKA = 'parka',

  // Footwear
  SNEAKERS = 'sneakers',
  BOOTS = 'boots',
  SANDALS = 'sandals',
  HEELS = 'heels',
  FLATS = 'flats',
  LOAFERS = 'loafers',

  // Accessories
  BAG = 'bag',
  BACKPACK = 'backpack',
  BELT = 'belt',
  HAT = 'hat',
  SCARF = 'scarf',
  SUNGLASSES = 'sunglasses',
  JEWELRY = 'jewelry',
  WATCH = 'watch',

  // Other
  ACTIVEWEAR = 'activewear',
  SWIMWEAR = 'swimwear',
  LOUNGEWEAR = 'loungewear',
  UNDERWEAR = 'underwear',
  SOCKS = 'socks',
}

export enum Pattern {
  SOLID = 'solid',
  STRIPED = 'striped',
  CHECKED = 'checked',
  PLAID = 'plaid',
  POLKA_DOT = 'polka_dot',
  PRINTED = 'printed',
  FLORAL = 'floral',
  ABSTRACT = 'abstract',
  GEOMETRIC = 'geometric',
  ANIMAL_PRINT = 'animal_print',
  TIE_DYE = 'tie_dye',
  CAMO = 'camo',
}

export enum Occasion {
  CASUAL = 'casual',
  FORMAL = 'formal',
  SEMI_FORMAL = 'semi_formal',
  BUSINESS = 'business',
  PARTY = 'party',
  DATE_NIGHT = 'date_night',
  WEDDING = 'wedding',
  OFFICE = 'office',
  WORKOUT = 'workout',
  TRAVEL = 'travel',
  BEACH = 'beach',
  BRUNCH = 'brunch',
  EVENING = 'evening',
  OUTDOOR = 'outdoor',
  LOUNGE = 'lounge',
}

export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  FALL = 'fall',
  AUTUMN = 'autumn',
  WINTER = 'winter',
  ALL_SEASON = 'all_season',
}

export enum ImageProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum StyleTag {
  CASUAL = 'casual',
  FORMAL = 'formal',
  SPORTY = 'sporty',
  BOHEMIAN = 'bohemian',
  MINIMALIST = 'minimalist',
  VINTAGE = 'vintage',
  STREETWEAR = 'streetwear',
  ELEGANT = 'elegant',
  PREPPY = 'preppy',
  EDGY = 'edgy',
  ROMANTIC = 'romantic',
  CLASSIC = 'classic',
  MODERN = 'modern',
  TRENDY = 'trendy',
  PROFESSIONAL = 'professional',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  AUD = 'AUD',
  INR = 'INR',
}

export interface AIAnalysis {
  dominantColor?: string;
  colorPalette: string[];
  pattern?: Pattern;
  style: StyleTag[];
  material?: string;
  occasion: Occasion[];
  season: Season[];
  confidence?: number;
}

export interface WardrobeEmbedding {
  vector: number[];
  model?: string;
  generatedAt?: Date;
  inputText?: string;
  imageVector?: number[];
}

export interface ImageProcessing {
  status: ImageProcessingStatus;
  backgroundRemoved: boolean;
  thumbnailGenerated: boolean;
  error?: string;
  retryCount: number;
  processedAt?: Date;
}

export interface WardrobeItem {
  _id: string;
  userId: string;

  // Basic Information
  category: string;
  subcategory?: string;
  name?: string;
  description?: string;

  // Images
  imageUrl: string;
  imageKey: string;
  processedImageUrl?: string;
  processedImageKey?: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;

  // AI Analysis
  aiAnalysis?: AIAnalysis;

  // Embeddings
  embedding?: WardrobeEmbedding;

  // Image Processing Status
  imageProcessing: ImageProcessing;

  // User-defined attributes
  userTags: string[];
  brand?: string;
  purchaseDate?: Date;
  price?: number;
  currency?: Currency;
  notes?: string;

  // Usage tracking
  isFavorite: boolean;
  timesWorn: number;
  lastWornAt?: Date;

  // Outfit references
  outfitIds: string[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface CreateWardrobeItemDto {
  category: WardrobeCategory;
  subcategory?: string;
  name?: string;
  description?: string;
  userTags?: string[];
  brand?: string;
  purchaseDate?: Date;
  price?: number;
  currency?: Currency;
  notes?: string;
  isFavorite?: boolean;
}

export interface UpdateWardrobeItemDto extends Partial<CreateWardrobeItemDto> {}

export interface QueryWardrobeDto {
  category?: WardrobeCategory;
  isFavorite?: boolean;
  brand?: string;
  tags?: string[];
}

export interface WardrobeStats {
  totalItems: number;
  favoriteItems: number;
  categoryCounts: Record<string, number>;
  brandCounts: Record<string, number>;
  colorDistribution: Record<string, number>;
  seasonalItems: Record<string, number>;
  occasionItems: Record<string, number>;
  averageTimesWorn: number;
  mostWornItems: WardrobeItem[];
  leastWornItems: WardrobeItem[];
  totalValue?: number;
}
