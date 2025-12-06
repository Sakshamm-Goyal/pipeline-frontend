import React from 'react';
import { ProductFeedback } from './ProductFeedback';

interface Product {
  id?: string;
  product_id?: string;
  name?: string;
  title?: string;
  url?: string;
  productUrl?: string;
  image_url?: string;
  imageUrl?: string;
  price?: string;
  retailer?: string;
  brand?: string;
  onSale?: boolean;
  originalPrice?: number;
  discount?: number;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const displayName = product.name || product.title || 'Product';
  const productUrl = product.productUrl || product.url || '#';
  const imageUrl = product.imageUrl || product.image_url || 'https://via.placeholder.com/300x400?text=No+Image';
  const price = product.price || 'Price unavailable';
  const retailer = product.retailer || 'Online Store';
  const productId = product.id || product.product_id || `product-${Date.now()}`;

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
          {product.onSale && product.discount && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{product.discount}%
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
        </div>
      </a>
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




