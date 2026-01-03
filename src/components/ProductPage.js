import React, { useState } from "react";
import {
  Sparkles,
  Heart,
  ShoppingCart,
  Star,
  ArrowLeft,
  Plus,
  Minus,
} from "lucide-react";
import SparkleBackground from "./SparkleBackground";
import Confetti from "./Confetti";

export default function ProductPage({
  product,
  onBack,
  onAddToCart,
  user,
  onAddReview,
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      onBack();
    }, 1500);
  };

  const handleSubmitReview = () => {
    if (reviewText.trim()) {
      onAddReview(product._id, {
        userName: user?.name || "Guest",
        rating: reviewRating,
        text: reviewText,
        date: new Date().toLocaleDateString(),
      });
      setReviewText("");
      setReviewRating(5);
      setShowReviewForm(false);
    }
  };

  const averageRating =
    product.reviews?.length > 0
      ? (
          product.reviews.reduce((sum, r) => sum + r.rating, 0) /
          product.reviews.length
        ).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 relative">
      <SparkleBackground />

      <header className="relative z-10 bg-white/80 backdrop-blur-sm shadow-lg border-b-4 border-pink-300">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-bold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Shop
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border-4 border-pink-300 mb-8">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            <div>
              <div className="relative rounded-2xl overflow-hidden border-4 border-pink-200 mb-4">
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-96 object-cover"
                />
                {/* Thumbnail Selector */}
                <div className="flex gap-3 mt-4">
                  {product.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Thumbnail ${index + 1} of ${product.name}`}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 object-cover rounded-xl border-4 cursor-pointer transition-all
        ${
          selectedImage === index
            ? "border-pink-500 scale-105"
            : "border-transparent opacity-70 hover:opacity-100"
        }`}
                    />
                  ))}
                </div>

                {product.featured && (
                  <div className="absolute top-4 left-4 bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                    <Star className="w-4 h-4 fill-current" />
                    Featured Bow!
                  </div>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-4xl font-bold text-pink-600 mb-4">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-bold text-purple-600">
                  ${product.price}
                </span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(averageRating)
                          ? "fill-yellow-400 text-yellow-700"
                          : "text-gray-400"
                      }`}
                    />
                  ))}
                  <span className="text-gray-600 ml-2">
                    ({product.reviews?.length || 0})
                  </span>
                </div>
              </div>

              <div className="bg-pink-50 rounded-xl p-4 mb-6">
                <p className="text-gray-700 leading-relaxed">
                  {product.longDescription}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-gray-700">
                  <Heart className="w-5 h-5 text-pink-500 fill-current" />
                  <span>Handmade with love by a 7-year-old</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <span>Made with Cricut & hot glue gun</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Star className="w-5 h-5 text-pink-500 fill-current" />
                  <span>Strong alligator clip included</span>
                </div>
              </div>

              {product.inventory < 3 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                  <p className="text-red-600 font-bold text-center">
                    ⚠️ Only {product.inventory} left in stock! Order soon!
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <span className="text-gray-700 font-bold">Quantity:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full bg-pink-200 hover:bg-pink-300 flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-2xl font-bold text-pink-600 w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.inventory, quantity + 1))
                    }
                    className="w-10 h-10 rounded-full bg-pink-200 hover:bg-pink-300 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold py-4 rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2 text-lg"
              >
                <ShoppingCart className="w-6 h-6" />
                Add {quantity} to Cart
                <Sparkles className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border-4 border-pink-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-pink-600 flex items-center gap-2">
              <Star className="w-6 h-6 fill-current" />
              Customer Reviews
            </h3>
            {user && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-pink-500 text-white px-4 py-2 rounded-full font-bold hover:bg-pink-600 transition-all"
              >
                Write Review
              </button>
            )}
          </div>

          {showReviewForm && (
            <div className="bg-pink-50 rounded-xl p-6 mb-6">
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="transform hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= reviewRating
                          ? "fill-yellow-400 text-yellow-700"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell us what you think about this bow!"
                className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-500 outline-none mb-4"
                rows="4"
              />
              <button
                onClick={handleSubmitReview}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold px-6 py-2 rounded-full hover:shadow-lg transition-all"
              >
                Submit Review
              </button>
            </div>
          )}

          {product.reviews && product.reviews.length > 0 ? (
            <div className="space-y-4">
              {product.reviews.map((review, idx) => (
                <div
                  key={idx}
                  className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-purple-600">
                        {review.userName}
                      </p>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-700"
                                : "text-gray-400"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">{review.date}</span>
                  </div>
                  <p className="text-gray-700">{review.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No reviews yet! Be the first to share your thoughts! 💕
            </p>
          )}
        </div>
      </div>

      <Confetti show={showConfetti} />
    </div>
  );
}
