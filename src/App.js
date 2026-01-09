import React, { useState, useEffect } from "react";
import axios from "axios";
import { Sparkles, Heart, Star, MessageCircle, Play } from "lucide-react";
import SparkleBackground from "./components/SparkleBackground";
import Confetti from "./components/Confetti";
import Header from "./components/Header";
import LoginModal from "./components/LoginModal";
import AccountModal from "./components/AccountModal";
import ProductPage from "./components/ProductPage";
import CartSidebar from "./components/CartSidebar";
import API_URL from "./config/api"; // Add this import

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "All Bows", emoji: "🎀" },
    { id: "sparkle", name: "Sparkly", emoji: "✨" },
    { id: "long", name: "Long Ribbon", emoji: "🎀" },
    { id: "new", name: "New Arrivals", emoji: "🆕" },
    { id: "bestseller", name: "Best Sellers", emoji: "🔥" },
  ];

  // Load products from API - UPDATED WITH FULL URL
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // CHANGED: Use full API_URL instead of relative path
        const res = await axios.get(`${API_URL}/api/products`, {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
          },
        });

        const data = res.data;
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const addToCart = (product, quantity = 1) => {
    const existingItem = cart.find((item) => item._id === product._id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity }]);
    }

    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      setCart(cart.filter((item) => item._id !== productId));
    } else {
      setCart(
        cart.map((item) =>
          item._id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setOrders([]);
    setShowAccount(false);
  };

  const addReview = (productId, review) => {
    setProducts(
      products.map((p) =>
        p._id === productId
          ? { ...p, reviews: [...(p.reviews || []), review] }
          : p
      )
    );
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 relative">
      <SparkleBackground />

      <Header
        user={user}
        cartItemCount={cartItemCount}
        onShowLogin={() => setShowLogin(true)}
        onShowAccount={() => setShowAccount(true)}
        onShowCart={() => setShowCart(!showCart)}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-4 border-pink-300 mb-8 overflow-hidden">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-pink-600 mb-4 flex items-center justify-center gap-2 animate-bounce">
              <Sparkles className="w-8 h-8 animate-spin" />
              Welcome to My Bow Shop!
              <Sparkles
                className="w-8 h-8 animate-spin"
                style={{ animationDirection: "reverse" }}
              />
            </h2>
            <p className="text-gray-700 text-lg max-w-2xl mx-auto leading-relaxed mb-6">
              Hi! I'm a ballerina and I LOVE making sparkly bows! Every bow is
              made by me with my Cricut and hot glue gun. I add lots of sparkles
              because sparkles make everything better! 💖✨
            </p>

            {/* Video Placeholder */}
            <div className="mb-6 rounded-2xl overflow-hidden border-4 border-pink-300 shadow-xl bg-gradient-to-br from-pink-200 to-purple-200 p-4">
              <h3 className="text-center text-pink-600 font-bold text-xl mb-3 flex items-center justify-center gap-2">
                <Play className="w-6 h-6" />
                Watch Me Make Bows!
                <Heart className="w-6 h-6 fill-current animate-pulse" />
              </h3>
              <div className="relative pb-[56.25%] bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 rounded-xl overflow-hidden shadow-inner">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-32 h-32 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce cursor-pointer hover:scale-110 transition-transform">
                      <Play className="w-16 h-16 text-pink-500 fill-current ml-2" />
                    </div>
                    <div className="bg-white/90 rounded-2xl p-6 backdrop-blur-sm">
                      <p className="text-pink-600 font-bold text-xl mb-2">
                        🎬 Your Video Goes Here! 🎀
                      </p>
                      <p className="text-gray-700 text-sm mb-3">
                        Film a fun video showing:
                      </p>
                      <ul className="text-gray-600 text-sm space-y-1 text-left max-w-xs mx-auto">
                        <li>✨ Making bows with your Cricut</li>
                        <li>💖 Adding sparkles with hot glue gun</li>
                        <li>🩰 Modeling your favorite bows</li>
                        <li>📦 Packaging orders</li>
                        <li>💕 Telling customers about your shop!</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Buttons */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 w-24 h-24 rounded-full flex flex-col items-center justify-center font-bold shadow-xl transition-all transform hover:scale-110 ${
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

        {/* Best Sellers Section */}
        {bestSellers.length > 0 && selectedCategory === "all" && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-pink-600 mb-4 flex items-center gap-2">
              🔥 Best Sellers This Week!
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {bestSellers.map((product) => (
                <div
                  key={product._id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border-4 border-yellow-300 transform hover:scale-105 transition-all cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                      🔥 BESTSELLER
                    </div>
                    <div className="absolute top-2 right-2 bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      ${product.price}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-pink-600 mb-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-yellow-400 text-yellow-700"
                        />
                      ))}
                      <span className="text-xs text-gray-600 ml-1">
                        ({product.reviews?.length || 0})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <h2 className="text-3xl font-bold text-pink-600 mb-6">
          {selectedCategory === "all"
            ? "All Bows"
            : selectedCategory === "new"
            ? "✨ New Arrivals"
            : selectedCategory === "bestseller"
            ? "🔥 Best Sellers"
            : categories.find((c) => c.id === selectedCategory)?.name}
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-pink-500 mx-auto animate-spin" />
            <p className="text-pink-600 mt-4">Loading sparkly bows...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 bg-red-100 border border-red-300 rounded-lg p-6 my-8">
            <p className="font-bold mb-2">Oops! Something went wrong:</p>
            <p>{error}</p>
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border-4 border-pink-200 transform hover:scale-110 hover:rotate-1 transition-all hover:shadow-2xl cursor-pointer group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute top-2 right-2 bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-bounce">
                    ${product.price}
                  </div>
                  {product.newArrival && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                      🆕 NEW
                    </div>
                  )}
                  {product.bestseller && !product.newArrival && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                      🔥 HOT
                    </div>
                  )}
                  {product.inventory < 3 && (
                    <div className="absolute bottom-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce">
                      Only {product.inventory} left!
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 rounded-full px-6 py-3 font-bold text-pink-600 shadow-xl">
                      Click to see more! 👀
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-pink-600 mb-2 group-hover:text-purple-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-700"
                      />
                    ))}
                    <span className="text-xs text-gray-600 ml-1">
                      ({product.reviews?.length || 0})
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-3 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4 fill-current animate-pulse" />
                    Quick Add
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* About Section */}
        <div className="mt-12 bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 rounded-3xl shadow-2xl p-8 border-4 border-white">
          <div className="flex items-start gap-4">
            <MessageCircle className="w-12 h-12 text-pink-600 flex-shrink-0" />
            <div>
              <h3 className="text-2xl font-bold text-pink-600 mb-3">
                A Message from the Owner!
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                I'm 7 years old and I love ballet, sparkles, and making pretty
                things! I use my Cricut machine to cut faux leather into bow
                shapes, then I add glitter and sparkles with my hot glue gun
                (with grown-up help!). Every bow has an alligator clip so it's
                super easy to wear!
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                My favorite bows are the really long ones because they twirl
                when I spin! And I ALWAYS add extra sparkles because you can
                never have too many sparkles! ✨
              </p>
              <p className="text-pink-600 font-bold">
                Thank you for supporting my business! Every bow is made with
                love! 💕
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCart && (
        <CartSidebar
          cart={cart}
          cartTotal={cartTotal}
          cartItemCount={cartItemCount}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={updateQuantity}
        />
      )}

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />
      )}

      {showAccount && user && (
        <AccountModal
          user={user}
          orders={orders}
          onClose={() => setShowAccount(false)}
          onLogout={handleLogout}
        />
      )}

      {/* Footer */}
      <footer className="relative z-10 bg-white/80 backdrop-blur-sm border-t-4 border-pink-300 mt-12 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-pink-600 font-bold mb-2">Sparkle & Twirl Bows</p>
          <p className="text-gray-600 text-sm">
            Handmade with love, sparkles, and ballet magic! ✨💕
          </p>
        </div>
      </footer>

      <Confetti show={showConfetti} />
    </div>
  );
}
