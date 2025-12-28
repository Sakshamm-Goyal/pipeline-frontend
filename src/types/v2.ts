/**
 * V2 Pipeline Types
 *
 * These types match the Elara V2 Pipeline backend response structure.
 * They provide enhanced outfit scoring, reasoning, and clarification flows.
 */

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export enum ResponseType {
  TEXT = 'text',
  OUTFIT_RECOMMENDATION = 'outfit_recommendation',
  PRODUCT_LIST = 'product_list',
  CLARIFICATION = 'clarification',
  STYLE_ADVICE = 'style_advice',
  FEEDBACK_ACKNOWLEDGED = 'feedback_acknowledged',
  ERROR = 'error',
}

export enum IntentType {
  GENERAL_CHAT = 'general_chat',
  OUTFIT_REQUEST = 'outfit_request',
  SINGLE_ITEM_REQUEST = 'single_item_request',
  MULTI_ITEM_REQUEST = 'multi_item_request',
  ITEM_REPLACEMENT = 'item_replacement',
  WARDROBE_BASED_OUTFIT = 'wardrobe_based_outfit',
  IMAGE_BASED_OUTFIT = 'image_based_outfit',
  FEEDBACK = 'feedback',
  CLARIFICATION_RESPONSE = 'clarification_response',
  STYLE_ADVICE = 'style_advice',
}

export type ActivityType =
  | 'outdoor'      // hiking, camping, trekking
  | 'fitness'      // gym, workout, yoga
  | 'sports'       // tennis, golf, running
  | 'water'        // swimming, beach, pool
  | 'winter'       // skiing, snowboarding
  | 'formal'       // wedding, gala, interview
  | 'business'     // office, meeting, presentation
  | 'casual'       // everyday, weekend
  | 'social'       // date, party, dinner
  | 'travel';      // flight, road trip

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export interface V2Product {
  id: string;
  sourceId?: string;
  source?: string;

  // Basic info
  title: string;
  description?: string;
  brand?: string;
  retailer: string;

  // Categorization
  category: string;
  subcategory?: string;

  // Pricing
  price: number;
  originalPrice?: number;
  currency: string;
  onSale: boolean;
  discount?: number;

  // Media
  imageUrl: string;
  images?: string[];

  // Attributes
  color?: string;
  colors?: string[];
  sizes?: string[];
  material?: string;
  pattern?: string;
  fit?: string;

  // Links
  productUrl: string;
  affiliateUrl?: string;

  // Quality signals
  rating?: number;
  reviewCount?: number;
  inStock: boolean;

  // Activity/functionality tags (enriched)
  activityTags?: string[];
  formalityLevel?: 'casual' | 'smart-casual' | 'business' | 'formal';
  weatherSuitability?: string[];

  // Shopping Strategy (Issues #56-62)
  shoppingStrategy?: ShoppingStrategy;
}

// ============================================================================
// OUTFIT TYPES
// ============================================================================

export interface V2OutfitScores {
  functionality: number;      // 0-100: Is it suitable for the occasion?
  style: number;              // 0-100: Color harmony, cohesion
  budget: number;             // 0-100: Within price range
  personalization: number;    // 0-100: Matches user preferences
  availability: number;       // 0-100: Items in stock
  overall: number;            // Weighted average

  breakdown?: ScoreBreakdown[];
}

export interface ScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  reason: string;
}

export interface V2OutfitReasoning {
  // Natural language explanation
  summary: string;

  // Per-category reasoning
  occasionFit?: string;
  colorTheory?: string;
  styleCohesion?: string;
  practicalConsiderations?: string;

  // Tips
  stylingTips?: string[];
  careInstructions?: string[];
}

export interface V2OutfitItem {
  slot: string;
  displayName: string;

  // Product details
  product: V2Product;

  // Why this was chosen
  selectionReason?: string;

  // Alternatives for this slot
  alternatives?: V2Product[];

  // Is this slot locked?
  isLocked?: boolean;
}

export interface V2OutfitPlan {
  id: string;
  createdAt?: string;

  // Request context
  occasion: string;
  activityType: ActivityType;
  functionalityLevel: 'low' | 'medium' | 'high';
  weatherConditions?: string;
  gender: string;

  // Reasoning
  overallReasoning?: string;
  styleDirection?: string;
  colorPalette?: string[];
}

export interface V2Outfit {
  id: string;
  createdAt?: string;

  // The plan this was built from
  plan?: V2OutfitPlan;

  // Name and description
  name: string;
  description?: string;

  // Items in the outfit
  items: V2OutfitItem[];

  // Pricing
  totalPrice: number;
  currency?: string;

  // Scores
  scores?: V2OutfitScores;

  // Rich reasoning
  reasoning?: V2OutfitReasoning;

  // Alternatives
  alternatives?: AlternativeOutfit[];

  // Tags
  tags?: string[];

  // Advanced Styling Analysis (Issues #69-72)
  stylingAnalysis?: StylingAnalysis;

  // Accessory Suggestions (Issues #48-55)
  accessorySuggestions?: AccessorySuggestions;

  // Price Breakdown
  priceBreakdown?: PriceBreakdown;

  // Outfit Compatibility
  compatibility?: OutfitCompatibility;
}

export interface AlternativeOutfit {
  name: string;
  description?: string;
  differentSlots: string[];
  priceDifference: number;
  styleDifference?: string;
}

// ============================================================================
// SHOPPING STRATEGY TYPES (NEW - Issues #56-62)
// ============================================================================

export interface ValueRating {
  score: number; // 0-100
  tier: 'exceptional' | 'great' | 'good' | 'fair' | 'poor';
  reasons: string[];
}

export interface SaleInfo {
  isOnSale: boolean;
  originalPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  saleBadge?: string;
}

export interface DeliveryEstimate {
  retailer: string;
  estimatedDays: number;
  estimatedDate?: string;
  shippingCost?: number;
  freeShippingThreshold?: number;
  isExpressAvailable: boolean;
  isSameDayAvailable?: boolean;
}

export interface ReturnPolicy {
  retailer: string;
  returnWindowDays: number;
  isFreeReturn: boolean;
  isFinalSale: boolean;
  conditions?: string[];
}

export interface PromoCode {
  code: string;
  description: string;
  discountType: 'percent' | 'fixed' | 'free_shipping';
  discountValue: number;
}

export interface ShoppingStrategy {
  valueRating?: ValueRating;
  saleInfo?: SaleInfo;
  deliveryEstimate?: DeliveryEstimate;
  returnPolicy?: ReturnPolicy;
  promoCodes?: PromoCode[];
}

// ============================================================================
// ADVANCED STYLING TYPES (NEW - Issues #69-72)
// ============================================================================

export type ColorScheme = 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'split_complementary' | 'neutral';
export type Undertone = 'warm' | 'cool' | 'neutral';
export type SilhouetteType = 'fitted' | 'relaxed' | 'oversized' | 'structured' | 'flowy';
export type PatternType = 'solid' | 'stripes' | 'plaid' | 'floral' | 'polka_dot' | 'geometric' | 'animal' | 'abstract';
export type PatternScale = 'small' | 'medium' | 'large';
export type TextureType = 'smooth' | 'matte' | 'shiny' | 'chunky' | 'ribbed' | 'fuzzy' | 'leather' | 'denim' | 'silk' | 'cotton' | 'wool' | 'linen';

export interface ColorHarmonyAnalysis {
  scheme: ColorScheme;
  harmony: number; // 0-100
  dominantColor: string;
  accentColors: string[];
  undertone: Undertone;
  suggestions: string[];
  issues: string[];
}

export interface SilhouetteAnalysis {
  topSilhouette: SilhouetteType;
  bottomSilhouette: SilhouetteType;
  isBalanced: boolean;
  balanceScore: number; // 0-100
  suggestions: string[];
  issues: string[];
}

export interface PatternMixAnalysis {
  patterns: { type: PatternType; scale: PatternScale; slot: string }[];
  isSafe: boolean;
  mixingScore: number; // 0-100
  suggestions: string[];
  issues: string[];
}

export interface TextureAnalysis {
  textures: { type: TextureType; slot: string }[];
  hasVariety: boolean;
  varietyScore: number; // 0-100
  suggestions: string[];
  issues: string[];
}

export interface StylingAnalysis {
  colorHarmony: ColorHarmonyAnalysis;
  silhouette: SilhouetteAnalysis;
  patternMix: PatternMixAnalysis;
  texture: TextureAnalysis;
  overallScore: number;
  overallSuggestions: string[];
  stylingTips: string[];
}

// ============================================================================
// ACCESSORY SUGGESTIONS (NEW - Issues #48-55)
// ============================================================================

export interface AccessorySuggestion {
  category: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  searchTerms: string[];
  colorRecommendation?: string;
}

export interface AccessorySuggestions {
  suggestions: AccessorySuggestion[];
  fromWardrobe: any[];
  toShop: { category: string; searchTerms: string[]; reason: string }[];
  stylingTip: string;
}

// ============================================================================
// PRICE BREAKDOWN (NEW)
// ============================================================================

export interface PriceBreakdownItem {
  slot: string;
  title: string;
  brand?: string;
  source: 'shopping' | 'wardrobe';
  price: number;
  originalPrice?: number;
  estimatedValue: number;
  saleDiscount: number;
  saleSavings: number;
  wardrobeSavings: number;
  priceDisplay: string;
  savingsDisplay?: string;
  retailer?: string;
  productUrl?: string;
}

export interface PriceBreakdown {
  shoppingCost: number;
  wardrobeValue: number;
  totalOutfitValue: number;
  savings: number;
  itemCount: {
    fromWardrobe: number;
    toShop: number;
    total: number;
  };
  items: PriceBreakdownItem[];
  averageItemPrice: number;
  mostExpensiveItem?: { slot: string; title: string; price: number };
  leastExpensiveItem?: { slot: string; title: string; price: number };
  totalSaleSavings: number;
}

// ============================================================================
// OUTFIT COMPATIBILITY
// ============================================================================

export interface OutfitCompatibility {
  score: number;
  issues: string[];
  suggestions: string[];
  hasIssues: boolean;
}

// ============================================================================
// AGENT RESPONSE
// ============================================================================

export interface StyleAdvice {
  topic: string;
  advice: string;
  examples?: string[];
  doList: string[];
  dontList: string[];
  relatedTopics?: string[];
}

export interface SuggestedAction {
  label: string;
  action: string;
  data?: any;
}

export interface V2AgentResponse {
  type: ResponseType;
  message: string;

  // Structured data based on type
  data?: {
    outfits?: V2Outfit[];
    products?: V2Product[];
    clarificationOptions?: string[];
    advice?: StyleAdvice;
  };

  // Metadata
  metadata?: {
    intent: IntentType;
    confidence: number;
    processingTime: number;
    agentUsed?: string;
    modelsUsed?: string[];
  };

  // Suggested actions
  suggestedActions?: SuggestedAction[];
}

// ============================================================================
// CLARIFICATION TYPES
// ============================================================================

export interface ClarificationContext {
  originalMessage: string;
  missingFields: string[];
  partialFilters?: Record<string, any>;
  clarificationQuestion: string;
  attempts?: number;
}

export interface ClarificationResponse {
  type: 'clarification';
  message: string;
  data: {
    clarificationOptions: string[];
    missingFields?: string[];
    context?: ClarificationContext;
  };
}

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

export function isV2Outfit(outfit: any): outfit is V2Outfit {
  return (
    outfit &&
    typeof outfit.id === 'string' &&
    typeof outfit.name === 'string' &&
    Array.isArray(outfit.items) &&
    outfit.items.every((item: any) =>
      item.product && typeof item.product.title === 'string'
    )
  );
}

export function isV2Product(product: any): product is V2Product {
  return (
    product &&
    typeof product.id === 'string' &&
    typeof product.title === 'string' &&
    typeof product.price === 'number'
  );
}

export function isClarificationResponse(response: any): response is ClarificationResponse {
  return (
    response &&
    response.type === 'clarification' &&
    response.data?.clarificationOptions?.length > 0
  );
}

// ============================================================================
// ADAPTER FUNCTIONS (V1 to V2 compatibility)
// ============================================================================

/**
 * Converts a V1 product format to V2 format
 * Also handles Oxylabs product format from backend
 */
export function adaptProductToV2(product: any): V2Product {
  // Determine retailer from source if available
  const retailer = product.retailer ||
    (product.source === 'oxylabs' ? 'Amazon' :
     product.source === 'google_shopping' ? 'Google Shopping' :
     product.source || 'Online Store');

  return {
    id: product.id || product.externalId || product.product_id || `product-${Date.now()}`,
    sourceId: product.externalId,
    source: product.source,
    title: product.title || product.name || 'Unknown Product',
    brand: product.brand,
    retailer,
    category: product.category || 'unknown',
    price: typeof product.price === 'number'
      ? product.price
      : parseFloat(String(product.price)?.replace(/[^0-9.]/g, '')) || 0,
    originalPrice: product.originalPrice,
    currency: product.currency || 'USD',
    onSale: product.onSale || (product.originalPrice && product.originalPrice > product.price) || false,
    discount: product.discount || (product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : undefined),
    imageUrl: product.imageUrl || product.image_url || '',
    images: product.images,
    color: product.color,
    colors: product.colors,
    productUrl: product.productUrl || product.url || '#',
    inStock: product.inStock !== false,
    rating: product.rating,
    reviewCount: product.reviewCount,

    // Activity/functionality tags
    activityTags: product.activityTags,
    formalityLevel: product.formalityLevel,
    weatherSuitability: product.weatherSuitability,

    // Shopping Strategy (Issues #56-62)
    shoppingStrategy: product.shoppingStrategy ? {
      valueRating: product.shoppingStrategy.valueRating,
      saleInfo: product.shoppingStrategy.saleInfo,
      deliveryEstimate: product.shoppingStrategy.deliveryEstimate,
      returnPolicy: product.shoppingStrategy.returnPolicy,
      promoCodes: product.shoppingStrategy.promoCodes,
    } : undefined,
  };
}

/**
 * Converts a V1 outfit format to V2 format
 * Supports both V1 (flat item structure) and V2 (nested product object) formats
 */
export function adaptOutfitToV2(outfit: any, index: number = 0): V2Outfit {
  return {
    id: outfit.id || `outfit-${outfit.outfit_id || index}`,
    name: outfit.name || `Outfit ${index + 1}`,
    description: outfit.summary || outfit.description,
    items: (outfit.items || []).map((item: any, itemIndex: number) => {
      // V2 format: item has nested product object
      // V1 format: item has flat product properties
      const hasNestedProduct = item.product && typeof item.product === 'object';

      return {
        slot: item.slot || item.category || 'other',
        displayName: item.displayName || item.name || item.title || `Item ${itemIndex + 1}`,
        product: hasNestedProduct
          ? adaptProductToV2(item.product)  // V2: nested product
          : adaptProductToV2({              // V1: flat structure
              id: item.product_id || item.id,
              title: item.name || item.title,
              price: item.priceValue || item.price,
              imageUrl: item.imageUrl || item.image_url,
              productUrl: item.productUrl || item.url,
              retailer: item.retailer,
              brand: item.brand,
              color: item.color,
            }),
        selectionReason: item.selectionReason,
        alternatives: item.alternatives?.map((alt: any) => adaptProductToV2(alt)),
        isLocked: item.isLocked,
      };
    }),
    totalPrice: outfit.totalPrice || parseFloat(outfit.total_price?.replace(/[^0-9.]/g, '')) || 0,
    currency: outfit.currency || 'USD',
    scores: outfit.scores || (outfit.score ? {
      functionality: 0,
      style: 0,
      budget: 0,
      personalization: 0,
      availability: 0,
      overall: outfit.score * 10, // Convert 0-10 to 0-100
    } : undefined),
    reasoning: outfit.reasoning ? {
      summary: outfit.reasoning.summary || outfit.reasoning.occasion || '',
      occasionFit: outfit.reasoning.occasionFit || outfit.reasoning.occasion,
      colorTheory: outfit.reasoning.colorTheory || outfit.reasoning.color,
      styleCohesion: outfit.reasoning.styleCohesion,
      practicalConsiderations: outfit.reasoning.practicalConsiderations || outfit.reasoning.weather,
      stylingTips: outfit.reasoning.stylingTips || (outfit.reasoning.trend ? [outfit.reasoning.trend] : undefined),
    } : undefined,
    tags: outfit.tags,
    // Pass through the plan object for activity type and color palette display
    plan: outfit.plan ? {
      id: outfit.plan.id || `plan-${index}`,
      occasion: outfit.plan.occasion,
      activityType: outfit.plan.activityType,
      functionalityLevel: outfit.plan.functionalityLevel,
      weatherConditions: outfit.plan.weatherConditions,
      gender: outfit.plan.gender,
      overallReasoning: outfit.plan.overallReasoning,
      styleDirection: outfit.plan.styleDirection,
      colorPalette: outfit.plan.colorPalette,
    } : undefined,

    // New V2 features (Issues #48-72)
    // Styling Analysis (Issues #69-72)
    stylingAnalysis: outfit.stylingAnalysis ? {
      colorHarmony: outfit.stylingAnalysis.colorHarmony,
      silhouette: outfit.stylingAnalysis.silhouette,
      patternMix: outfit.stylingAnalysis.patternMix,
      texture: outfit.stylingAnalysis.texture,
      overallScore: outfit.stylingAnalysis.overallScore || 0,
      overallSuggestions: outfit.stylingAnalysis.overallSuggestions || [],
      stylingTips: outfit.stylingAnalysis.stylingTips || [],
    } : undefined,

    // Accessory Suggestions (Issues #48-55)
    accessorySuggestions: outfit.accessorySuggestions ? {
      suggestions: outfit.accessorySuggestions.suggestions || [],
      fromWardrobe: outfit.accessorySuggestions.fromWardrobe || [],
      toShop: outfit.accessorySuggestions.toShop || [],
      stylingTip: outfit.accessorySuggestions.stylingTip || '',
    } : undefined,

    // Price Breakdown
    priceBreakdown: outfit.priceBreakdown ? {
      shoppingCost: outfit.priceBreakdown.shoppingCost || 0,
      wardrobeValue: outfit.priceBreakdown.wardrobeValue || 0,
      totalOutfitValue: outfit.priceBreakdown.totalOutfitValue || 0,
      savings: outfit.priceBreakdown.savings || 0,
      itemCount: outfit.priceBreakdown.itemCount || { fromWardrobe: 0, toShop: 0, total: 0 },
      items: outfit.priceBreakdown.items || [],
      averageItemPrice: outfit.priceBreakdown.averageItemPrice || 0,
      mostExpensiveItem: outfit.priceBreakdown.mostExpensiveItem,
      leastExpensiveItem: outfit.priceBreakdown.leastExpensiveItem,
      totalSaleSavings: outfit.priceBreakdown.totalSaleSavings || 0,
    } : undefined,

    // Outfit Compatibility
    compatibility: outfit.compatibility ? {
      score: outfit.compatibility.score || 100,
      issues: outfit.compatibility.issues || [],
      suggestions: outfit.compatibility.suggestions || [],
      hasIssues: outfit.compatibility.hasIssues || false,
    } : undefined,
  };
}
