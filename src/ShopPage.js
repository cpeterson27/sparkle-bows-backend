import React, { useState } from "react";
import ProductItem from "./components/ProductItem";
import ProductPage from "./components/ProductPage";
import { Sparkles } from "lucide-react";

export default function ShopPage({ products = [], cart = [], setCart, user, addReview, loading = false, error = null }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showConfetti, setShowConfetti] = useState(false);

  const categories = [
    { id: "all", name: "All Bows", emoji: "🎀" },
    { id: "sparkle", name: "Sparkly", emoji: "✨" },
    { id: "long", name: "Long Ribbon", emoji: "🎀" },
    { id: "new", name: "New Arrivals", emoji: "🆕" },
    { id: "bestseller", name: "Best Sellers", emoji: "🔥" },
  ];

  const addToCart = (product, quantity = 1) => {
    const existing = cart.find((item) => item._id === product._id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + quantity } : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity }]);
    }
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1500);
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "new") return p.newArrival;
    if (selectedCategory === "bestseller") return p.bestseller;
    return p.category === selectedCategory;
  });

  const bestSellers = products.filter((p) => p.bestseller).slice(0, 3);

  if (selectedProduct) {
    return (
      <ProductPage
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
        user={user}
        onAddReview={addReview}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-8">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex-shrink-0 w-24 h-24 rounded-full flex flex-col items-center cursor-pointer justify-center font-bold shadow-xl transition-all transform hover:scale-110 ${
              selectedCategory === cat.id
                ? "bg-gradient-to-br from-pink-500 to-purple-500 text-white scale-110"
                : "bg-white text-pink-600 border-4 border-pink-300"
            }`}
          >
            <span className="text-2xl mb-1">{cat.emoji}</span>
            <span className="text-xs text-center px-2">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Best Sellers */}
      {bestSellers.length > 0 && selectedCategory === "all" && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-pink-600 mb-4 flex items-center gap-2">
            🔥 Best Sellers This Week!
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bestSellers.map((product, idx) => (
              <ProductItem
                key={product._id || idx}
                product={product}
                onSelect={setSelectedProduct}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-pink-500 mx-auto animate-spin" />
          <p className="text-pink-600 mt-4">Loading sparkly bows...</p>
        </div>
      ) : error ? (
        <div className="text-center text-red-600 bg-red-100 border border-red-300 rounded-lg p-6 my-8">
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, idx) => (
            <ProductItem
              key={product._id || idx}
              product={product}
              onSelect={setSelectedProduct}
              onAddToCart={addToCart}
            />
          ))}
        </div>
      )}

      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="w-full h-full bg-white/0" />
        </div>
      )}
    </div>
  );
}
