import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import Confetti from "../components/Confetti";
import Seo from "../components/Seo";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { trackViewItem } from "../lib/analytics";

function formatPrice(price) {
  return `$${Number(price || 0).toFixed(2)}`;
}

function formatReviewDate(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString();
}

export default function ProductPage({
  products = [],
  onAddToCart,
  user,
  onAddReview,
}) {
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const { id } = useParams();
  const product = useMemo(
    () => products.find((item) => item._id === id || item.id === id),
    [id, products],
  );

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (product?._id) {
      trackViewItem(product);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-[70vh] bg-[#f7f3ee] px-4 py-20">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-500">
            Product unavailable
          </p>
          <h1 className="mt-4 font-serif text-4xl text-slate-950">
            We could not find that bow.
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-500">
            It may have been removed or the page link may be outdated. Head
            back to the collection to browse current inventory.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to shop
          </button>
        </div>
      </div>
    );
  }

  const images =
    product.images?.length > 0
      ? product.images
      : [{ url: "https://placehold.co/900x1000?text=Sparkle+Bows", alt: product.name }];

  const reviewCount = product.reviews?.length || 0;
  const averageRating = reviewCount
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
      reviewCount
    : 0;
  const inStock = Number(product.inventory || 0) > 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    onAddToCart(product, quantity);
    setShowConfetti(true);
    window.setTimeout(() => setShowConfetti(false), 1500);
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

  return (
    <div className="bg-[#f7f3ee]">
      <Seo
        title={product.seoTitle || product.name}
        description={
          product.seoDescription ||
          product.description ||
          "Premium handmade boutique bow with polished presentation and gift-worthy finishing."
        }
        keywords={product.seoKeywords}
        type="product"
        image={images[0]?.url}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description:
            product.seoDescription ||
            product.description ||
            "Premium handmade boutique bow with polished presentation.",
          image: images.map((image) => image.url).filter(Boolean),
          brand: {
            "@type": "Brand",
            name: settings.organizationName || settings.siteName || "Sparkle Bows",
          },
          category: product.category || undefined,
          url: new URL(
            `/product/${product._id}`,
            settings.siteUrl || window.location.origin,
          ).toString(),
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: Number(product.price || 0).toFixed(2),
            url: new URL(
              `/product/${product._id}`,
              settings.siteUrl || window.location.origin,
            ).toString(),
            availability:
              inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
        }}
      />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-5 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to shop
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-sm">
              <div className="aspect-[4/4.4] bg-gradient-to-br from-rose-50 via-white to-amber-50">
                <img
                  src={images[selectedImage]?.url}
                  alt={images[selectedImage]?.alt || product.name}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={image.url || index}
                  onClick={() => setSelectedImage(index)}
                  className={`overflow-hidden rounded-2xl border bg-white transition ${
                    selectedImage === index
                      ? "border-slate-950 shadow-md"
                      : "border-slate-200 hover:border-rose-300"
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt || `${product.name} ${index + 1}`}
                    className="aspect-square h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm lg:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-500">
              {product.category || "Signature collection"}
            </p>
            <h1 className="mt-4 font-serif text-4xl text-slate-950 sm:text-5xl">
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <p className="text-3xl font-semibold text-slate-950">
                {formatPrice(product.price)}
              </p>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm text-slate-700">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`h-4 w-4 ${
                        index < Math.round(averageRating)
                          ? "fill-current"
                          : ""
                      }`}
                    />
                  ))}
                </div>
                <span>
                  {reviewCount > 0 ? `${averageRating.toFixed(1)} (${reviewCount} reviews)` : "No reviews yet"}
                </span>
              </div>
            </div>

            <p className="mt-6 text-base leading-8 text-slate-600">
              {product.longDescription ||
                product.description ||
                "A polished handmade bow designed for dependable wear, beautiful gifting, and boutique-level presentation."}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <ShieldCheck className="h-5 w-5 text-rose-500" />
                <p className="mt-3 text-sm font-semibold text-slate-950">
                  Boutique finish
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Handmade with polished presentation and secure construction.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <Truck className="h-5 w-5 text-rose-500" />
                <p className="mt-3 text-sm font-semibold text-slate-950">
                  Fast fulfillment
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Ready for gifting, events, and everyday orders.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-rose-500" />
                <p className="mt-3 text-sm font-semibold text-slate-950">
                  Quality checked
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Every bow is packed to arrive clean, secure, and gift-ready.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-slate-200 bg-[#fcfaf7] p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Availability
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {inStock
                      ? `${product.inventory} ready to ship`
                      : "Currently sold out"}
                  </p>
                </div>

                <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="rounded-full p-3 text-slate-700 transition hover:bg-slate-100"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-12 text-center text-lg font-semibold text-slate-950">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((current) =>
                        Math.min(Number(product.inventory || 10), current + 1),
                      )
                    }
                    className="rounded-full p-3 text-slate-700 transition hover:bg-slate-100"
                    disabled={!inStock}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <ShoppingBag className="h-5 w-5" />
                {inStock ? `Add ${quantity} to cart` : "Sold out"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-500">
              Customer trust
            </p>
            <h2 className="mt-4 font-serif text-4xl text-slate-950">
              Reviews from families who want quality that lasts.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">
              Real feedback matters when you are building a premium boutique.
              Show shoppers that your craftsmanship and presentation hold up in
              real life.
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-950">Customer reviews</p>
                <p className="text-sm text-slate-500">
                  {reviewCount > 0
                    ? `${reviewCount} review${reviewCount === 1 ? "" : "s"}`
                    : "Be the first to review this bow"}
                </p>
              </div>
              {user ? (
                <button
                  type="button"
                  onClick={() => setShowReviewForm((current) => !current)}
                  className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-slate-950"
                >
                  {showReviewForm ? "Close review" : "Write a review"}
                </button>
              ) : (
                <p className="text-sm text-slate-500">
                  Sign in to leave a review.
                </p>
              )}
            </div>

            {showReviewForm && (
              <div className="rounded-[28px] border border-slate-200 bg-[#fcfaf7] p-6">
                <p className="text-sm font-semibold text-slate-950">Rate this bow</p>
                <div className="mt-4 flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-amber-400 transition hover:scale-105"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoverRating || reviewRating) ? "fill-current" : ""
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder="Tell future customers what made this bow feel worth it."
                  className="mt-4 min-h-32 w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                />
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  className="mt-4 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
                >
                  Publish review
                </button>
              </div>
            )}

            {reviewCount > 0 ? (
              product.reviews.map((review, index) => (
                <div
                  key={review._id || `${review.userName}-${index}`}
                  className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {review.userName || "Customer"}
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <Star
                            key={starIndex}
                            className={`h-4 w-4 ${
                              starIndex < review.rating ? "fill-current" : ""
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">
                      {formatReviewDate(review.date)}
                    </p>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {review.text}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                No reviews yet. This is a good place to build social proof as orders come in.
              </div>
            )}
          </div>
        </div>
      </section>

      <Confetti show={showConfetti} />
    </div>
  );
}
