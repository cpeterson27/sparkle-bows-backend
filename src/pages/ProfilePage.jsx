import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { savePrimaryAddress } from "../api/account";
import {
  Save,
  Edit2,
  AlertCircle,
  Star,
  Package,
  User,
  Shield,
  Bell,
  Mail,
  Phone,
  MapPin,
  Clock,
  ChevronRight,
  LogOut,
  Trash2,
  Camera, 
  Lock,
  Check,
  Sparkles,
} from "lucide-react";
import api from "../api/axios.config";

function ProfileField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function ProfileInput(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-rose-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-rose-100 ${props.className || ""}`}
    />
  );
}

export default function ProfilePage({ onUpdateReview, onDeleteReview, products }) {
  const { user, updateUserProfile, refreshCurrentUser, logoutUser } = useContext(AuthContext);

  const defaultAddress =
    user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0] || null;

  const [activeTab, setActiveTab] = useState("orders");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: defaultAddress?.line1 || "",
    city: defaultAddress?.city || "",
    state: defaultAddress?.state || "",
    zipCode: defaultAddress?.postalCode || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Notifications from MongoDB
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    marketing: false,
  });
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [userReviews, setUserReviews] = useState([]);

  useEffect(() => {
    const addr =
      user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0] || null;
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: addr?.line1 || "",
      city: addr?.city || "",
      state: addr?.state || "",
      zipCode: addr?.postalCode || "",
    });
  }, [user]);

  useEffect(() => {
    if (!user || notificationsLoaded) return;
    api
      .get("/api/user/notification-preferences")
      .then((res) => {
        if (res.data?.notificationPreferences) {
          setNotifications(res.data.notificationPreferences);
        }
        setNotificationsLoaded(true);
      })
      .catch(() => setNotificationsLoaded(true));
  }, [user, notificationsLoaded]);

  useEffect(() => {
    if (user && products) {
      const allUserReviews = [];
      products.forEach((p) => {
        (p.reviews || []).forEach((r) => {
          if (r.userName === user.name) {
            allUserReviews.push({
              ...r,
              productId: p._id,
              productName: p.name,
              productImage: p.images?.[0]?.url,
            });
          }
        });
      });
      setUserReviews(allUserReviews);
    }
  }, [user, products]);

  useEffect(() => {
    if (!user) return;
    api
      .get("/api/orders/my")
      .then((res) => setOrders(res.data))
      .catch((err) => console.error("Error fetching orders:", err))
      .finally(() => setLoadingOrders(false));
  }, [user]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleNotificationToggle = async (key) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    try {
      await api.patch("/api/user/notification-preferences", next);
    } catch {
      // revert on failure
      setNotifications(notifications);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Name and email are required");
      return;
    }

    const hasAnyAddressField = Boolean(
      formData.address.trim() ||
        formData.city.trim() ||
        formData.state.trim() ||
        formData.zipCode.trim()
    );
    const hasCompleteAddress =
      formData.address.trim() &&
      formData.city.trim() &&
      formData.state.trim() &&
      formData.zipCode.trim();

    if (hasAnyAddressField && !hasCompleteAddress) {
      setError("Complete street, city, state, and ZIP to save an address");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateUserProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      });
      if (hasCompleteAddress) {
        await savePrimaryAddress({
          line1: formData.address,
          city: formData.city,
          state: formData.state.toUpperCase(),
          postalCode: formData.zipCode,
        });
        await refreshCurrentUser();
      }
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800";
      case "shipped": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffe7f2,_#f8fafc_42%,_#f8fafc)]">
      {/* HEADER BANNER */}
      <div className="bg-[linear-gradient(135deg,_#9f1239,_#db2777_45%,_#f97316)] text-white py-14 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white/15 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/25 shadow-lg">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <button className="absolute bottom-0 right-0 bg-white text-rose-700 p-1.5 rounded-full shadow-lg hover:bg-rose-50 transition">
                  <Camera size={16} />
                </button>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
                  <Sparkles size={14} />
                  Customer Profile
                </div>
                <h1 className="mt-4 text-3xl font-semibold">{user?.name}</h1>
                <p className="mt-1 text-rose-100">{user?.email}</p>
                <p className="text-sm text-rose-100/90 mt-1">
                  Member since {new Date().getFullYear()}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">Orders</p>
                <p className="mt-2 text-2xl font-semibold">{orders.length}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">Reviews</p>
                <p className="mt-2 text-2xl font-semibold">{userReviews.length}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">Status</p>
                <p className="mt-2 text-lg font-semibold">
                  {user?.role === "admin" ? "Owner" : "Member"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* TAB NAVIGATION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {[
              { id: "orders", icon: Package, label: "Orders" },
              { id: "profile", icon: User, label: "Profile" },
              { id: "reviews", icon: Star, label: "Reviews" },
              { id: "security", icon: Shield, label: "Security" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-pink-50 text-pink-600 border-b-2 border-pink-500"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Order History</h2>
              <span className="text-gray-500">{orders.length} orders</span>
            </div>

            {loadingOrders ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-500">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No orders yet</h3>
                <p className="text-gray-500 mb-4">Start shopping to see your orders here!</p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 bg-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-pink-600 transition"
                >
                  Browse Products <ChevronRight size={18} />
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <Link
                  key={order._id}
                  to={`/orders/${order._id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-gray-800">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status || "Processing"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package size={14} />
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-pink-600">${order.total?.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">View Details →</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={item.productId?.images?.[0]?.url || "/placeholder.jpg"}
                          alt={item.productId?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-sm text-gray-500 ml-2">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
                      Customer Identity
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                      Personal Information
                    </h3>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700 hover:bg-rose-100 font-medium"
                    >
                      <Edit2 size={16} /> Edit
                    </button>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                    <AlertCircle size={18} /> {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                    <Check size={18} /> Profile updated successfully!
                  </div>
                )}

                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <ProfileField label="Full Name *">
                        <ProfileInput
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          autoComplete="name"
                          placeholder="Your name"
                        />
                      </ProfileField>
                      <ProfileField label="Email *">
                        <ProfileInput
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          autoComplete="email"
                          placeholder="you@example.com"
                        />
                      </ProfileField>
                      <ProfileField label="Phone Number" className="md:col-span-2">
                        <ProfileInput
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          autoComplete="tel"
                          placeholder="(555) 123-4567"
                        />
                      </ProfileField>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-sm font-semibold text-slate-900">Default Shipping Address</p>
                      <p className="mt-1 text-sm text-slate-600">Pre-filled at checkout to save you time.</p>
                      <div className="mt-5 space-y-5">
                        <ProfileField label="Street Address">
                          <ProfileInput
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            autoComplete="street-address"
                            placeholder="123 Main St"
                          />
                        </ProfileField>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <ProfileField label="City">
                            <ProfileInput
                              name="city"
                              value={formData.city}
                              onChange={handleChange}
                              autoComplete="address-level2"
                              placeholder="Omaha"
                            />
                          </ProfileField>
                          <ProfileField label="State">
                            <ProfileInput
                              name="state"
                              maxLength="2"
                              value={formData.state}
                              onChange={handleChange}
                              autoComplete="address-level1"
                              placeholder="NE"
                              className="uppercase"
                            />
                          </ProfileField>
                          <ProfileField label="ZIP Code">
                            <ProfileInput
                              name="zipCode"
                              value={formData.zipCode}
                              onChange={handleChange}
                              autoComplete="postal-code"
                              placeholder="68134"
                            />
                          </ProfileField>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 rounded-full bg-rose-600 text-white px-6 py-3 font-medium hover:bg-rose-700 transition disabled:opacity-50"
                      >
                        <Save size={18} /> {isSubmitting ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsEditing(false); setError(null); }}
                        className="px-6 py-3 border border-slate-300 text-slate-700 rounded-full font-medium hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { icon: User, label: "Full Name", value: user?.name },
                      { icon: Mail, label: "Email Address", value: user?.email },
                      { icon: Phone, label: "Phone Number", value: user?.phone || "Not provided" },
                      {
                        icon: MapPin,
                        label: "Shipping Address",
                        value: defaultAddress?.line1
                          ? `${defaultAddress.line1}, ${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.postalCode}`
                          : "No address set",
                      },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-3">
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <item.icon size={18} className="text-pink-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">{item.label}</p>
                          <p className="font-medium text-gray-800">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SIDEBAR */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Orders</span>
                    <span className="font-semibold text-gray-800">{orders.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Reviews Written</span>
                    <span className="font-semibold text-gray-800">{userReviews.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Account Type</span>
                    <span className="font-semibold text-pink-600">
                      {user?.role === "admin" ? "Admin" : "Member"}
                    </span>
                  </div>
                </div>
              </div>

              {/* NOTIFICATIONS */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <Bell size={18} /> Notifications
                </h3>
                <p className="text-sm text-gray-500 mb-4">Saved to your account.</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Order & shipping updates</p>
                      <p className="text-xs text-gray-500">Always on</p>
                    </div>
                    <div className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      On
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">New arrivals & offers</p>
                      <p className="text-xs text-gray-500">Early access & discounts</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNotificationToggle("marketing")}
                      className={`relative h-6 w-12 rounded-full transition-colors ${
                        notifications.marketing ? "bg-rose-500" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          notifications.marketing ? "translate-x-7" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={logoutUser}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">My Reviews</h2>
              <span className="text-gray-500">{userReviews.length} reviews</span>
            </div>

            {userReviews.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Star size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No reviews yet</h3>
                <p className="text-gray-500 mb-4">Purchase items and share your thoughts!</p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 bg-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-pink-600 transition"
                >
                  Browse Products <ChevronRight size={18} />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userReviews.map((review) => (
                  <ReviewCard
                    key={review._id}
                    review={review}
                    onUpdateReview={onUpdateReview}
                    onDeleteReview={onDeleteReview}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Lock size={18} /> Password & Security
              </h3>
              <p className="text-gray-600 mb-4">
                Manage your password, two-factor authentication, and account deletion from Settings.
              </p>
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 bg-pink-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-pink-600 transition"
              >
                Open Settings <ChevronRight size={18} />
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
              <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                <Trash2 size={18} /> Delete Account
              </h3>
              <p className="text-gray-600 mb-4">
                Permanently delete your account and all associated data.
              </p>
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 border border-red-300 text-red-600 px-6 py-2.5 rounded-lg font-medium hover:bg-red-50 transition"
              >
                Manage in Settings <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review, onUpdateReview, onDeleteReview }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(review.text);
  const [rating, setRating] = useState(review.rating);

  const saveReview = () => {
    onUpdateReview(review._id, review.productId, text, rating);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
      <div className="flex items-start gap-4">
        <img
          src={review.productImage || "/placeholder.jpg"}
          alt={review.productName}
          className="w-20 h-20 object-cover rounded-lg"
        />
        <div className="flex-1">
          <Link
            to={`/product/${review.productId}`}
            className="font-semibold text-gray-800 hover:text-pink-600 transition"
          >
            {review.productName}
          </Link>
          <div className="flex gap-1 my-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <Star
                key={num}
                size={16}
                fill={num <= rating ? "#ec4899" : "none"}
                stroke="#ec4899"
                className="cursor-pointer"
                onClick={() => isEditing && setRating(num)}
              />
            ))}
          </div>
          {isEditing ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm mt-2 focus:ring-2 focus:ring-pink-500"
              rows={3}
            />
          ) : (
            <p className="text-gray-600 text-sm">{review.text}</p>
          )}
          <div className="flex gap-3 mt-3">
            {isEditing ? (
              <>
                <button onClick={saveReview} className="text-sm bg-pink-500 text-white px-3 py-1 rounded">Save</button>
                <button onClick={() => setIsEditing(false)} className="text-sm text-gray-500 underline">Cancel</button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="text-sm text-pink-600 hover:underline">Edit</button>
                <button onClick={() => onDeleteReview(review._id, review.productId)} className="text-sm text-gray-500 hover:underline">Delete</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}