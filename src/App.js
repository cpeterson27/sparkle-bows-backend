// src/App.js - COMPLETE MERGED VERSION
import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { Sparkles, Heart, Play } from "lucide-react";
import SparkleBackground from "./components/SparkleBackground";
import Confetti from "./components/Confetti";
import Header from "./components/Header";
import LoginModal from "./components/LoginModal";
import AccountModal from "./components/AccountModal";
import ProductPage from "./components/ProductPage";
import CartSidebar from "./components/CartSidebar";
import ProductItem from "./components/ProductItem";
import ContactModal from "./components/ContactModal";
import AdminPage from "./components/AdminPage";
import AdminDashboard from "./components/AdminDashboard";

// NEW: Order components
import OrderHistory from "./components/OrderHistory";
import OrderDetails from "./components/OrderDetails";
import ThankYou from "./components/ThankYou";

import { createReview, updateReview, deleteReview } from "./api/reviews";
import { AuthContext } from "./context/AuthContext";
import { Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import api from "./api/axios.config";

// ──────────────────────────────────────────────────────
// ProductRouteWrapper
// ──────────────────────────────────────────────────────
function ProductRouteWrapper({ products, onAddToCart, user, onAddReview }) {
  const { id } = useParams();
  const product = products.find((p) => p._id === id);
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate("/");
  };
  
  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-pink-600 text-xl">Product not found</p>
          <button
            onClick={handleBack}
            className="mt-4 bg-pink-500 text-white px-6 py-3 rounded-full font-bold hover:bg-pink-600 transition-all shadow-lg"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProductPage
      product={product}
      onBack={handleBack}
      onAddToCart={onAddToCart}
      user={user}
      onAddReview={onAddReview}
    />
  );
}

// ──────────────────────────────────────────────────────
// Main Shop Component
// ──────────────────────────────────────────────────────
function ShopPage({
  products,
  loading,
  error,
  cart,
  setCart,
  user,
  addToCart,
  setShowConfetti,
  setShowContact,
  onSelectProduct,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "All Bows", emoji: "🎀" },
    { id: "sparkle", name: "Sparkly", emoji: "✨" },
    { id: "long", name: "Long Ribbon", emoji: "🎀" },
    { id: "new", name: "New Arrivals", emoji: "🆕" },
    { id: "bestseller", name: "Best Sellers", emoji: "🔥" },
  ];

  const handleProductSelect = (product) => {
    onSelectProduct(product._id);
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "new") return p.newArrival;
    if (selectedCategory === "bestseller") return p.bestseller;
    return p.category === selectedCategory;
  });

  const bestSellers = products.filter((p) => p.bestseller).slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-4 border-pink-300 mb-8">
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
            made by me with my Cricut and hot glue gun. 💖✨
          </p>

          <div className="mb-6 rounded-2xl overflow-hidden border-4 border-pink-300 shadow-xl bg-gradient-to-br from-pink-200 to-purple-200 p-4">
            <h3 className="text-center text-pink-600 font-bold text-xl mb-3 flex items-center justify-center gap-2">
              <Play className="w-6 h-6" /> Watch Me Make Bows!{" "}
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {bestSellers.length > 0 && selectedCategory === "all" && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-pink-600 mb-4 flex items-center gap-2">
            🔥 Best Sellers This Week!
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bestSellers.map((product, index) => (
              <ProductItem
                key={`best-${product._id || product.id || index}`}
                product={product}
                onSelect={handleProductSelect}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </div>
      )}

      <h2 className="text-3xl font-bold text-pink-600 mb-6">
        {selectedCategory === "all"
          ? "All Bows"
          : categories.find((c) => c.id === selectedCategory)?.name}
      </h2>

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
          {filteredProducts.map((product, index) => (
            <ProductItem
              key={`grid-${product._id || product.id || index}`}
              product={product}
              onSelect={handleProductSelect}
              onAddToCart={addToCart}
            />
          ))}
        </div>
      )}

      <div className="mt-16 text-center">
        <div className="inline-block bg-white/60 backdrop-blur-sm p-8 rounded-[2rem] border-2 border-pink-100 shadow-sm hover:shadow-md transition-shadow">
          <Heart className="w-10 h-10 text-pink-500 mx-auto mb-4 animate-pulse fill-pink-400" />
          <h3 className="text-2xl font-black text-pink-500 mb-2 uppercase tracking-tighter">
            Say Hello!
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto font-medium">
            Have a question about my bows or just want to say hi? I'd love to
            hear from you!
          </p>
          <button
            onClick={() => setShowContact(true)}
            className="bg-pink-500 text-white px-3 py-3 rounded-full font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer uppercase tracking-widest"
          >
            Contact Me 💌
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────
// Main App Component
// ──────────────────────────────────────────────────────
export default function App() {
  const { user, logoutUser } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  
  // NEW: Backend-synced cart format: [{ productId: {...product}, quantity: 1 }]
  const [cart, setCart] = useState([]);
  
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [userReviews, setUserReviews] = useState([]);
  const navigate = useNavigate();
  const hasLoadedProducts = useRef(false);

  // ───────────────── Load products ONCE on mount
  useEffect(() => {
    if (hasLoadedProducts.current) return;
    hasLoadedProducts.current = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/api/products");
        const data = res.data;

        // Fetch reviews for each product
        const productsWithReviews = await Promise.all(
          data.map(async (product) => {
            try {
              const reviewsRes = await api.get(`/api/reviews/${product._id}`);
              return {
                ...product,
                reviews: reviewsRes.data || [],
              };
            } catch (err) {
              console.error(
                `Error fetching reviews for product ${product._id}:`,
                err
              );
              return {
                ...product,
                reviews: product.reviews || [],
              };
            }
          })
        );

        setProducts(productsWithReviews);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Unable to load products");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // ───────────────── NEW: Load cart from backend
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await api.get("/api/cart");
        setCart(res.data || []);
      } catch (err) {
        console.error("Error fetching cart:", err);
      }
    };
    fetchCart();
  }, []);

  // ───────────────── NEW: Sync cart to backend whenever it changes
  useEffect(() => {
    api.put("/api/cart", { items: cart }).catch((err) => {
      console.error("Error saving cart:", err);
    });
  }, [cart]);

  // ───────────────── Update user reviews when user or products change
  useEffect(() => {
    if (user) {
      const allUserReviews = [];
      products.forEach((p) => {
        (p.reviews || []).forEach((r) => {
          if (r.userName === user.name) {
            allUserReviews.push({
              ...r,
              productId: p._id,
              productName: p.name,
            });
          }
        });
      });
      setUserReviews(allUserReviews);
    } else {
      setUserReviews([]);
    }
  }, [user, products]);

  // ───────────────── NEW: Cart calculations using backend format
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.productId.price * item.quantity,
    0
  );
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ───────────────── NEW: Add to cart (backend format)
  const addToCart = useCallback((product, quantity = 1) => {
    setCart((prev) => {
      const exists = prev.find(
        (item) => item.productId._id === product._id
      );
      if (exists) {
        return prev.map((item) =>
          item.productId._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { productId: product, quantity }];
    });

    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);

  // ───────────────── NEW: Update quantity (backend format)
  const updateQuantity = useCallback((id, newQty) => {
    if (newQty < 1) {
      removeItem(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId._id === id ? { ...item, quantity: newQty } : item
      )
    );
  }, []);

  // ───────────────── NEW: Remove item (backend format)
  const removeItem = useCallback((id) => {
    setCart((prev) =>
      prev.filter((item) => item.productId._id !== id)
    );
  }, []);

  // ───────────────── Logout handler
  const handleLogout = () => {
    logoutUser();
    setUserReviews([]);
    setShowAccount(false);
  };

  // ───────────────── Review handlers
  const addReview = async (productId, review) => {
    try {
      const reviewPayload = {
        productId: productId,
        userName: user?.name || "Guest",
        rating: review.rating,
        text: review.text,
      };

      const response = await createReview(reviewPayload);
      const savedReview = response.data;

      setProducts((prevProducts) => {
        return prevProducts.map((p) => {
          if (p._id === productId) {
            return {
              ...p,
              reviews: [...(p.reviews || []), savedReview],
            };
          }
          return p;
        });
      });

      if (user) {
        const productName = products.find((p) => p._id === productId)?.name;
        setUserReviews((prevUserReviews) => [
          ...prevUserReviews,
          {
            ...savedReview,
            productId,
            productName,
          },
        ]);
      }
    } catch (err) {
      console.error("Error saving review:", err);
    }
  };

  const updateUserReview = async (reviewId, productId, newText, newRating) => {
    try {
      const resp = await updateReview(reviewId, {
        text: newText,
        rating: newRating,
      });

      if (!resp || !resp.data) {
        throw new Error("Failed to update review");
      }

      const updatedReview = resp.data;

      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? {
                ...p,
                reviews: p.reviews.map((r) =>
                  r._id === reviewId ? updatedReview : r
                ),
              }
            : p
        )
      );

      setUserReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? updatedReview : r))
      );

      await refreshProducts();
    } catch (err) {
      console.error("Error updating review:", err);
      alert("Failed to update review. Please try again.");
    }
  };

  const deleteUserReview = async (reviewId, productId) => {
    try {
      await deleteReview(reviewId);

      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? {
                ...p,
                reviews: p.reviews.filter((r) => r._id !== reviewId),
              }
            : p
        )
      );

      setUserReviews((prev) => prev.filter((r) => r._id !== reviewId));

      await refreshProducts();
    } catch (err) {
      console.error("Error deleting review:", err);
      alert("Failed to delete review. Please try again.");
    }
  };

  const refreshProducts = async () => {
    try {
      const res = await api.get("/api/products");
      const data = res.data;

      const productsWithReviews = await Promise.all(
        data.map(async (product) => {
          try {
            const reviewsRes = await api.get(`/api/reviews/${product._id}`);
            const reviews = reviewsRes.data;
            return {
              ...product,
              reviews: reviews || [],
            };
          } catch (err) {
            console.error(
              `Error fetching reviews for product ${product._id}:`,
              err
            );
            return {
              ...product,
              reviews: product.reviews || [],
            };
          }
        })
      );

      setProducts(productsWithReviews);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (err) {
      console.error("Error refreshing products:", err);
    }
  };

  // ───────────────── Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      <SparkleBackground />
      <Header
        cartItemCount={cartItemCount}
        onShowLogin={() => setShowLogin(true)}
        onShowAccount={() => setShowAccount(true)}
        onShowCart={() => setShowCart(!showCart)}
      />

      <Routes>
        <Route
          path="/"
          element={
            <ShopPage
              products={products}
              loading={loading}
              error={error}
              cart={cart}
              setCart={setCart}
              user={user}
              addToCart={addToCart}
              setShowConfetti={setShowConfetti}
              setShowContact={setShowContact}
              onSelectProduct={(id) => navigate(`/product/${id}`)}
            />
          }
        />
        <Route
          path="/product/:id"
          element={
            <ProductRouteWrapper
              products={products}
              onAddToCart={addToCart}
              user={user}
              onAddReview={addReview}
            />
          }
        />

        {/* NEW: Order routes */}
        <Route
          path="/orders"
          element={user ? <OrderHistory /> : <Navigate to="/" />}
        />
        <Route
          path="/orders/:orderId"
          element={user ? <OrderDetails /> : <Navigate to="/" />}
        />
        <Route
          path="/thank-you/:orderId"
          element={<ThankYou />}
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            user && user.role === "admin" ? (
              <AdminPage onRefresh={refreshProducts} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            user && user.role === "admin" ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>

      {showCart && (
        <CartSidebar
          cart={cart}
          cartTotal={cartTotal}
          cartItemCount={cartItemCount}
          onClose={() => setShowCart(false)}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
        />
      )}
      {showLogin && (
        <LoginModal 
          onClose={() => setShowLogin(false)} 
          onLogin={() => setShowLogin(false)} 
        />
      )}
      {showAccount && user && (
        <AccountModal
          user={user}
          userReviews={userReviews}
          onUpdateReview={updateUserReview}
          onDeleteReview={deleteUserReview}
          onClose={() => setShowAccount(false)}
          onLogout={handleLogout}
        />
      )}
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}

      <footer className="bg-white/80 backdrop-blur-sm border-t-4 border-pink-300 mt-12 py-8">
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