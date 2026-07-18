import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Star } from "lucide-react";
import Confetti from "./Confetti";

function formatPrice(price) {
  return `$${Number(price || 0).toFixed(2)}`;
}

export function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  const firstImageUrl = product.images?.[0]?.url;
  const isSoldOut = Number(product.inventory || 0) <= 0;
  const reviewCount = product.reviews?.length || 0;
  const averageRating = reviewCount
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : 0;

  const handleQuickAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isSoldOut && onAddToCart) {
      onAddToCart(product, 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  return (
    <>
      <Confetti show={showConfetti} />
      <article
        onClick={() => navigate(`/product/${product._id}`)}
        className="group flex cursor-pointer flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
      >
        <div className="relative aspect-[4/4.5] overflow-hidden bg-gradient-to-br from-rose-50 via-white to-amber-50">
          <img
            src={firstImageUrl || "https://placehold.co/800x900?text=Sparkle+Bows"}
            alt={product.name}
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.04] ${
              isSoldOut ? "grayscale-[0.4]" : ""
            }`}
          />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <div className="flex flex-wrap gap-2">
              {product.newArrival && (
                <span className="rounded-full bg-white/92 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-900 shadow-sm">
                  New
                </span>
              )}
              {product.bestseller && (
                <span className="rounded-full bg-rose-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
                  Best Seller
                </span>
              )}
            </div>
            <span className="rounded-full bg-slate-950/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
              {isSoldOut ? "Sold Out" : `${product.inventory || 0} in stock`}
            </span>
          </div>

          {!isSoldOut && (
            <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 transition duration-300 group-hover:opacity-100">
              <button
                type="button"
                onClick={handleQuickAdd}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-600"
              >
                <ShoppingBag className="h-4 w-4" />
                Quick add
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {product.category || "Signature bow"}
            </p>
            {reviewCount > 0 && (
              <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{averageRating.toFixed(1)}</span>
                <span>({reviewCount})</span>
              </div>
            )}
          </div>

          <h3 className="mt-3 font-serif text-2xl text-slate-950">{product.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
            {product.shortDescription ||
              product.description ||
              "Handmade bow with boutique-level finishing and secure wear."}
          </p>

          <div className="mt-6 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Price
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-950">
                {formatPrice(product.price)}
              </p>
            </div>
            <span className="text-sm font-medium text-slate-600 transition group-hover:text-rose-600">
              View details
            </span>
          </div>
        </div>
      </article>
    </>
  );
}