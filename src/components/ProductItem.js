// src/components/ProductItem.jsx
import React from "react";
import { Star } from "lucide-react";

export default function ProductItem({ product, onSelect, onAddToCart }) {
  return (
    <div
      onClick={() => onSelect(product)}
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border-4 border-pink-200 transform hover:scale-110 hover:rotate-1 transition-all hover:shadow-2xl cursor-pointer group"
    >
      <div className="relative overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2 bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
          ${product.price.toFixed(2)}
        </div>
        {product.featured && (
          <div className="absolute top-2 left-2 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            ★ FEATURED
          </div>
        )}
        {product.inventory < 3 && (
          <div className="absolute bottom-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce">
            🔺 Only {product.inventory} Left
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold text-pink-600 mb-1">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-2">{product.description}</p>
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.round(product.reviews?.length > 0 
                    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length 
                    : 0)
                  ? "fill-yellow-400 text-yellow-700"
                  : "text-gray-400"
              }`}
            />
          ))}
          <span className="text-xs text-gray-600 ml-1">({product.reviews?.length || 0})</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product, 1);
          }}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
