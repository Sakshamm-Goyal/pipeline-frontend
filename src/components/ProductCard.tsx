import React, { useState } from 'react';
import { ProductFeedback } from './ProductFeedback';
import { V2Product } from '../types/v2';

interface ProductCardProps {
  product: V2Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [showDetails, setShowDetails] = useState(false);

  const displayName = product.title || 'Product';
  const productUrl = product.productUrl || '#';
  const imageUrl = product.imageUrl || 'https://via.placeholder.com/300x400?text=No+Image';
  const price = typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'Price unavailable';
  // Show source-aware retailer name
  const retailer = product.retailer ||
    (product.source === 'oxylabs' ? 'Amazon' :
     product.source === 'google_shopping' ? 'Google' :
     product.source || 'Online Store');
  const productId = product.id || `product-${Date.now()}`;

  // Shopping strategy data
  const strategy = product.shoppingStrategy;
  const valueRating = strategy?.valueRating;
  const saleInfo = strategy?.saleInfo;
  const deliveryEstimate = strategy?.deliveryEstimate;
  const returnPolicy = strategy?.returnPolicy;
  const promoCodes = strategy?.promoCodes;

  // Value tier colors
  const getValueTierColor = (tier?: string) => {
    switch (tier) {
      case 'exceptional': return 'bg-green-500';
      case 'great': return 'bg-green-400';
      case 'good': return 'bg-blue-400';
      case 'fair': return 'bg-yellow-400';
      case 'poor': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden border border-gray-200">
      <a
        href={productUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={displayName}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=No+Image';
            }}
          />
          {/* Sale Badge - Enhanced with shopping strategy */}
          {(saleInfo?.isOnSale || (product.onSale && product.discount)) && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
              {saleInfo?.saleBadge || `-${saleInfo?.discountPercent || product.discount}%`}
            </div>
          )}
          {/* Value Rating Badge */}
          {valueRating && (
            <div className={`absolute top-2 left-2 ${getValueTierColor(valueRating.tier)} text-white text-xs font-bold px-2 py-1 rounded shadow-lg`}>
              {valueRating.tier === 'exceptional' ? '⭐ Best Value' :
               valueRating.tier === 'great' ? '✓ Great Value' :
               valueRating.tier === 'good' ? 'Good Value' : ''}
            </div>
          )}
          {/* Activity tags badge */}
          {product.activityTags && product.activityTags.length > 0 && (
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
              {product.activityTags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-purple-600/80 text-white text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {/* Final Sale Warning */}
          {returnPolicy?.isFinalSale && (
            <div className="absolute bottom-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded">
              Final Sale
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
            {displayName}
          </h3>
          {product.brand && (
            <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-lg font-bold text-purple-600">{price}</p>
              {product.originalPrice && product.onSale && (
                <p className="text-xs text-gray-400 line-through">
                  ${product.originalPrice.toFixed(2)}
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500">{retailer}</p>
          </div>
          {/* Rating */}
          {product.rating !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-3 h-3 ${star <= product.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              {product.reviewCount !== undefined && (
                <span className="text-xs text-gray-400">({product.reviewCount})</span>
              )}
            </div>
          )}
          {/* Stock status */}
          {product.inStock === false && (
            <p className="text-xs text-red-500 mt-1">Out of stock</p>
          )}
          {/* Delivery Estimate */}
          {deliveryEstimate && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>
                {deliveryEstimate.estimatedDays <= 2 ? '🚀 ' : ''}
                {deliveryEstimate.estimatedDays} day{deliveryEstimate.estimatedDays !== 1 ? 's' : ''} delivery
              </span>
            </div>
          )}
        </div>
      </a>

      {/* Shopping Strategy Details (Expandable) */}
      {strategy && (
        <div className="px-4 py-2 border-t border-gray-100">
          <button
            onClick={(e) => { e.preventDefault(); setShowDetails(!showDetails); }}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            {showDetails ? 'Hide details' : 'Shopping info'}
            <svg className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDetails && (
            <div className="mt-2 space-y-2 text-xs text-gray-600">
              {/* Value Rating Reasons */}
              {valueRating && valueRating.reasons.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Why {valueRating.tier} value:</span>
                  <ul className="list-disc list-inside mt-1">
                    {valueRating.reasons.slice(0, 3).map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Return Policy */}
              {returnPolicy && (
                <div className="flex items-center gap-2">
                  <span className={`${returnPolicy.isFreeReturn ? 'text-green-600' : 'text-gray-600'}`}>
                    {returnPolicy.isFreeReturn ? '✓ Free returns' : 'Returns available'}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>{returnPolicy.returnWindowDays} days</span>
                </div>
              )}

              {/* Promo Codes */}
              {promoCodes && promoCodes.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                  <span className="font-medium text-yellow-800">🏷️ Available Code:</span>
                  <div className="mt-1">
                    {promoCodes.slice(0, 1).map((promo, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <code className="bg-yellow-100 px-2 py-0.5 rounded text-yellow-800 font-mono">
                          {promo.code}
                        </code>
                        <span className="text-yellow-700">{promo.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping Info */}
              {deliveryEstimate && (
                <div className="text-gray-500">
                  {deliveryEstimate.isExpressAvailable && (
                    <span className="text-green-600">⚡ Express shipping available</span>
                  )}
                  {deliveryEstimate.freeShippingThreshold && (
                    <span> • Free shipping over ${deliveryEstimate.freeShippingThreshold}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Feedback Section */}
      <div className="px-4 pb-3 border-t border-gray-100 pt-2">
        <div className="flex items-center justify-between">
          <ProductFeedback
            productId={productId}
            productTitle={displayName}
            compact
          />
          <a
            href={productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            View →
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;


