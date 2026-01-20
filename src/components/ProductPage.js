import React, { useState } from "react";
import { Sparkles, Heart, ShoppingCart, Star, ArrowLeft, Plus, Minus } from "lucide-react";
import SparkleBackground from "./SparkleBackground";
import Confetti from "./Confetti";

export default function ProductPage({ product, onBack, onAddToCart, user, onAddReview }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1500);
  };

  const handleSubmitReview = () => {
    if (!reviewText.trim()) return;

    onAddReview(product._id, {
      productId: product._id,
      userName: user?.name || "Guest",
      rating: reviewRating,
      text: reviewText,
      date: new Date().toISOString(),
    });

    setReviewText("");
    setReviewRating(5);
    setShowReviewForm(false);
  };

  const averageRating = product.reviews?.length
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 relative">
      <SparkleBackground />

      <header className="relative z-10 bg-white/80 backdrop-blur-sm shadow-lg border-b-4 border-pink-300">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white shadow-lg cursor-pointer px-6 py-3 rounded-full hover:text-pink-700 font-bold bg-pink-500"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Shop
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Main Product Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border-4 border-pink-300 p-8 grid md:grid-cols-2 gap-8">
          <div>
            {/* Main Image */}
            <img
              src={product.images[selectedImage]?.url}
              alt={product.images[selectedImage]?.alt || product.name}
              className="w-full h-96 object-cover rounded-2xl border-4 border-pink-200 mb-4"
            />

            {/* Thumbnails */}
            <div className="flex gap-3">
              {product.images.map((imgObj, i) => (
                <img
                  key={i}
                  src={imgObj.url}
                  alt={imgObj.alt || `Thumbnail ${i + 1}`}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 object-cover rounded-xl border-4 cursor-pointer transition-all ${
                    selectedImage === i
                      ? "border-pink-500 scale-105"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right Side: Details & Add to Cart */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-pink-600">{product.name}</h1>

            <div className="flex items-center gap-4 mb-8">
              <span className="text-4xl font-bold text-purple-600">${product.price}</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    fill={i < Math.floor(averageRating) ? "#fbbf24" : "#d1d5db"}
                    stroke="none"
                    className="w-5 h-5"
                  />
                ))}
                <span className="text-gray-600 ml-2">({product.reviews?.length || 0})</span>
              </div>
            </div>

            <p className="text-gray-700 mb-8">
              {product.longDescription || product.description}
            </p>

            {/* Quantity Selector */}
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="cursor-pointer w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-2xl font-bold text-pink-600 w-12 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.inventory || 10, quantity + 1))}
                className="cursor-pointer w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              className="cursor-pointer w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 hover:scale-105 transition-all"
            >
              <ShoppingCart className="w-6 h-6" /> Add {quantity} to Cart <Sparkles className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-4 border-pink-300 space-y-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-pink-600 flex items-center gap-2">
              <Star className="w-6 h-6" /> Customer Reviews
            </h2>
            {user ? (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-pink-500 cursor-pointer text-white px-6 py-2 rounded-full font-bold hover:bg-pink-600 transition-all"
              >
                {showReviewForm ? "Cancel" : "Write Review"}
              </button>
            ) : (
              <p className="text-pink-400 font-bold italic">Login to leave a review! ✨</p>
            )}
          </div>

          {showReviewForm && (
            <div className="bg-pink-50 rounded-xl p-6 border-2 border-pink-200">
              <p className="text-pink-600 font-bold mb-2">Rate this bow:</p>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <Star
                      fill={star <= (hoverRating || reviewRating) ? "#f59e0b" : "#d1d5db"}
                      stroke="none"
                      className="w-10 h-10"
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your sparkle story..."
                className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 mb-4 focus:border-pink-500 outline-none"
              />
              <button
                onClick={handleSubmitReview}
                className="cursor-pointer bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold px-8 py-3 rounded-full hover:scale-105 transition-all"
              >
                Post Review 🎀
              </button>
            </div>
          )}

          {product.reviews && product.reviews.length > 0 ? (
            <div className="space-y-4">
              {product.reviews.map((r, i) => (
                <div key={i} className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-purple-600 flex items-center gap-2">
                        {r.userName} <Heart className="w-3 h-3 fill-pink-400" />
                      </p>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i2) => (
                          <Star
                            key={i2}
                            fill={i2 < r.rating ? "#fbbf24" : "#d1d5db"}
                            stroke="none"
                            className="w-4 h-4"
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 italic">{r.date}</span>
                  </div>
                  <p className="text-gray-700">{r.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No reviews yet! 💕</p>
          )}
        </div>
      </div>

      <Confetti show={showConfetti} />
    </div>
  );
}
