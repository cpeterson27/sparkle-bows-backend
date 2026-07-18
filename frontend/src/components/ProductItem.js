import React, { useState } from "react";
import { Star } from "lucide-react";

export default function ProductItem({ product, onSelect, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);

  const averageRating = product.reviews?.length
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
      product.reviews.length
    : 0;

  const isSoldOut = product.inventory === 0;

  const firstImageUrl = product.images?.[0]?.url;

  const handleQuantityChange = (newQty) => {
    if (newQty >= 1 && newQty <= product.inventory) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!isSoldOut) {
      onAddToCart(product, quantity);
      setQuantity(1); // Reset quantity after adding to cart
    }
  };

  return (
    <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-4 border-pink-200 hover:scale-105 transition-all hover:shadow-2xl group">
      {/* ───── IMAGE + SOLD OUT LAYOUT ───── */}
      <div
        onClick={() => !isSoldOut && onSelect(product)}
        className={`h-64 overflow-hidden ${!isSoldOut ? "cursor-pointer" : "cursor-not-allowed"}`}
      >
        <img
          src={firstImageUrl || "https://placehold.co/400x400?text=Sparkle+Bow"}
          alt={product.images?.[0]?.alt || product.name}
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
          style={{
            filter: isSoldOut ? "grayscale(100%) brightness(0.8)" : "none",
          }}
        />

        {/* Sold Out Badge */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="bg-white text-gray-900 px-6 py-3 rounded-full font-black text-lg shadow-2xl border-4 border-red-500 uppercase tracking-widest">
              🚫 Sold Out
            </span>
          </div>
        )}

        {/* Badges */}
        {(product.featured ||
          product.price ||
          product.newArrival ||
          product.bestseller) && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 max-w-[90%]">
            {product.newArrival && (
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                🆕 NEW
              </div>
            )}
            {product.bestseller && (
              <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                🔥 BEST SELLER
              </div>
            )}
            {product.featured && (
              <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                ★ FEATURED
              </div>
            )}
            {product.price && (
              <div className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                ${product.price.toFixed(2)}
              </div>
            )}
          </div>
        )}

        {!isSoldOut && product.inventory > 0 && product.inventory < 3 && (
          <div className="absolute bottom-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce">
            🔺 Only {product.inventory} Left
          </div>
        )}
      </div>

      <div className="mt-5 mb-8" />

      {/* ───── PRODUCT DETAILS ───── */}
      <div className="p-4 pt-0">
        <h3
          onClick={() => !isSoldOut && onSelect(product)}
          className={`
            text-xl font-bold text-pink-600
            ${!isSoldOut ? "cursor-pointer hover:text-pink-700" : ""}
          `}
        >
          {product.name}
        </h3>

        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className="w-4 h-4"
              fill={i < Math.round(averageRating) ? "#fbbf24" : "#d1d5db"}
              stroke="none"
            />
          ))}
          <span className="text-xs text-gray-600 ml-1">
            ({product.reviews?.length || 0})
          </span>
        </div>

        {/* ───── QUANTITY SELECTOR ───── */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-gray-600">Qty:</span>
          <div className="flex items-center bg-pink-100 rounded-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuantityChange(quantity - 1);
              }}
              disabled={quantity <= 1 || isSoldOut}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-pink-200 text-pink-600 font-bold hover:bg-pink-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              -
            </button>
            <span className="w-10 text-center font-bold text-pink-600">
              {quantity}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuantityChange(quantity + 1);
              }}
              disabled={quantity >= product.inventory || isSoldOut}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-pink-200 text-pink-600 font-bold hover:bg-pink-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isSoldOut}
          className={`
            cursor-pointer w-full font-bold py-3 rounded-full shadow-lg transition-all
            ${
              isSoldOut
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:scale-105 transform"
            }
          `}
        >
          {isSoldOut ? "Sold Out" : `Add to Cart (${quantity})`}
        </button>
      </div>
    </div>
  );
}
