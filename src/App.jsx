import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import Header from "./components/Header";
import SiteFooter from "./components/SiteFooter";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import CollectionPage from "./pages/CollectionPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

import CartSidebar from "./components/CartSidebar";
import LoginModal from "./components/LoginModal";
import ContactModal from "./components/ContactModal";

import AdminPage from "./components/AdminPage";
import AdminDashboard from "./components/AdminDashboard";

import OrderHistory from "./components/OrderHistory";
import OrderDetails from "./components/OrderDetails";
import ThankYou from "./components/ThankYou";

import { createReview, updateReview, deleteReview } from "./api/reviews";
import api from "./api/axios.config";
import { AuthContext } from "./context/AuthContext";

export default function App() {
  const { user, loading: authLoading, completeOAuthLogin } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [oauthMessage, setOauthMessage] = useState("");

  const hasLoadedProducts = useRef(false);
  const handledOauthRef = useRef("");

  // ───────────────── Load products once
  useEffect(() => {
    if (hasLoadedProducts.current) return;
    hasLoadedProducts.current = true;

    (async () => {
      try {
        const res = await api.get("/api/products");
        const productsWithReviews = await Promise.all(
          res.data.map(async (p) => {
            try {
              const reviewsRes = await api.get(`/api/reviews/${p._id}`);
              return { ...p, reviews: reviewsRes.data || [] };
            } catch {
              return { ...p, reviews: p.reviews || [] };
            }
          }),
        );
        setProducts(productsWithReviews);
      } catch (err) {
        console.error("Error loading products:", err);
      }
    })();
  }, []);

  // ───────────────── Load cart from backend
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/cart");
        const cartData = Array.isArray(res.data)
          ? res.data
          : res.data?.items || [];
        setCart(cartData);
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error("Error loading cart:", err);
        }
      }
    })();
  }, []);

  // ───────────────── Sync cart to backend
  useEffect(() => {
    api.put("/api/cart", { items: cart }).catch((err) => {
      if (err.response?.status !== 404) console.error(err);
    });
  }, [cart]);

  // ───────────────── Handle OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthStatus = params.get("oauth");
    const oauthToken = params.get("token") || "";
    const oauthError = params.get("oauth_error");

    // Not an OAuth redirect — nothing to do
    if (!oauthStatus && !oauthError) return;

    // Prevent handling the same redirect twice
    const fingerprint = location.search;
    if (handledOauthRef.current === fingerprint) return;
    handledOauthRef.current = fingerprint;

    if (oauthError) {
      setOauthMessage("Sign-in could not be completed. Please try again.");
      navigate("/", { replace: true });
      return;
    }

    if (oauthStatus === "success") {
      setOauthMessage("Finishing your sign-in...");
      completeOAuthLogin(oauthToken)
        .then(() => {
          setOauthMessage("");
          navigate("/", { replace: true });
        })
        .catch(() => {
          setOauthMessage("We could not finish your sign-in. Please try again.");
          navigate("/", { replace: true });
        });
    }
  }, [location.search, completeOAuthLogin, navigate]); // oauthMessage intentionally excluded

  // ───────────────── Cart handlers
  const addToCart = useCallback((product, qty = 1) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.productId._id === product._id);
      if (exists) {
        return prev.map((i) =>
          i.productId._id === product._id
            ? { ...i, quantity: i.quantity + qty }
            : i,
        );
      }
      return [...prev, { productId: product, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((id) => {
    setCart((prev) => prev.filter((i) => i.productId._id !== id));
  }, []);

  const updateQuantity = useCallback(
    (id, newQty) => {
      if (newQty < 1) {
        removeItem(id);
        return;
      }
      setCart((prev) =>
        prev.map((i) =>
          i.productId._id === id ? { ...i, quantity: newQty } : i,
        ),
      );
    },
    [removeItem],
  );

  // ───────────────── Review handlers
  const addReview = async (productId, review) => {
    try {
      const response = await createReview({
        productId,
        userName: user?.name || "Guest",
        rating: review.rating,
        text: review.text,
      });
      const saved = response.data;
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? { ...p, reviews: [...(p.reviews || []), saved] }
            : p,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const updateUserReview = async (id, productId, text, rating) => {
    try {
      const resp = await updateReview(id, { text, rating });
      const updated = resp.data;
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? { ...p, reviews: p.reviews.map((r) => (r._id === id ? updated : r)) }
            : p,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUserReview = async (id, productId) => {
    try {
      await deleteReview(id);
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? { ...p, reviews: p.reviews.filter((r) => r._id !== id) }
            : p,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  // ───────────────── Loading state
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading your storefront...
          </p>
        </div>
      </div>
    );
  }

  const isAdminRoute = location.pathname.startsWith("/admin");
  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.productId?.price || 0) * item.quantity,
    0,
  );
  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen bg-white">
      {!isAdminRoute && (
        <Header
          cartItemCount={cartItemCount}
          onShowLogin={() => setShowLogin(true)}
          onShowCart={() => setShowCart((p) => !p)}
        />
      )}

      <main className={isAdminRoute ? "" : "pt-[92px] sm:pt-[102px]"}>
        {!isAdminRoute && oauthMessage ? (
          <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-center text-sm font-medium text-slate-700">
            {oauthMessage}
          </div>
        ) : null}

        <Routes>
          <Route
            path="/"
            element={<HomePage products={products} addToCart={addToCart} />}
          />
          <Route
            path="/product/:id"
            element={
              <ProductPage
                products={products}
                onAddToCart={addToCart}
                user={user}
                onAddReview={addReview}
              />
            }
          />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />
          <Route
            path="/collections/:slug"
            element={<CollectionPage products={products} addToCart={addToCart} />}
          />
          <Route
            path="/orders"
            element={user ? <OrderHistory /> : <Navigate to="/" />}
          />
          <Route
            path="/orders/:orderId"
            element={user ? <OrderDetails /> : <Navigate to="/" />}
          />
          <Route path="/thank-you/:orderId" element={<ThankYou />} />
          <Route
            path="/admin"
            element={
              user?.role === "admin" ? <AdminPage /> : <Navigate to="/" />
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/" />
            }
          />
          <Route
            path="/profile"
            element={
              user ? (
                <ProfilePage
                  products={products}
                  onUpdateReview={updateUserReview}
                  onDeleteReview={deleteUserReview}
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/settings"
            element={user ? <SettingsPage /> : <Navigate to="/" />}
          />
        </Routes>
      </main>

      {!isAdminRoute && <SiteFooter />}

      {showCart && (
        <CartSidebar
          cart={cart}
          cartTotal={cartTotal}
          cartItemCount={cartItemCount}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          user={user}
          onClose={() => setShowCart(false)}
        />
      )}

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={() => setShowLogin(false)}
        />
      )}

      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </div>
  );
}