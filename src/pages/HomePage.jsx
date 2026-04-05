import React, { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  ArrowRight,
  CheckCircle2,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useProducts } from "../hooks/use-products";
import { ProductCard } from "../components/ProductCard";
import VipSignupSection from "../components/VipSignupSection";
import Seo from "../components/Seo";
import api from "../api/axios.config";

function FadeIn({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const STYLE_CARDS = [
  {
    category: "sparkle",
    label: "Sparkle bows",
    description:
      "Statement bows for birthdays, parties, and girls who love shine.",
    palette: "from-rose-100 via-white to-amber-100",
  },
  {
    category: "classic",
    label: "Classic bows",
    description:
      "Timeless shapes for portraits, school days, and polished everyday wear.",
    palette: "from-stone-100 via-white to-slate-100",
  },
  {
    category: "long",
    label: "Ribbon bows",
    description:
      "Long-tail silhouettes with soft movement and boutique presence.",
    palette: "from-amber-50 via-white to-rose-100",
  },
];

export default function HomePage({ addToCart }) {
  const { user } = useContext(AuthContext);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [featuredReviews, setFeaturedReviews] = useState([]);
  const { data: allProducts, isLoading } = useProducts({});

  // Load real reviews from MongoDB
  useEffect(() => {
    api
      .get("/api/reviews/featured")
      .then((res) => setFeaturedReviews(res.data || []))
      .catch(() => {});
  }, []);

  const categories = [
    { id: "all", label: "All bows" },
    { id: "sparkle", label: "Sparkle" },
    { id: "classic", label: "Classic" },
    { id: "long", label: "Ribbon" },
    { id: "bestseller", label: "Best sellers" },
    { id: "new", label: "New arrivals" },
  ];

  const filteredProducts = (allProducts || []).filter((product) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "new") return product.newArrival;
    if (selectedCategory === "bestseller") return product.bestseller;
    return product.category === selectedCategory;
  });

  const featuredProducts = (allProducts || [])
    .filter((product) => product.bestseller || product.featured)
    .slice(0, 4);
  const displayFeatured =
    featuredProducts.length > 0
      ? featuredProducts
      : (allProducts || []).slice(0, 4);

  const scrollToShop = () =>
    document
      .getElementById("shop-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="bg-[#f7f3ee] text-slate-950">
      <Seo
        title="Boutique Handmade Hair Bows"
        description="Premium handmade boutique hair bows with elevated presentation, thoughtful gifting appeal, and a storefront designed to support serious growth."
        type="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Store",
          name: "Sparkle Bows",
          description:
            "Premium handmade boutique hair bows with gift-worthy presentation and polished craftsmanship.",
          url: window.location.href,
        }}
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Manrope:wght@400;500;600;700;800&display=swap');
        .brand-serif { font-family: 'Fraunces', serif; }
        .brand-sans { font-family: 'Manrope', sans-serif; }
      `}</style>

      <div className="brand-sans">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,113,133,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.16),_transparent_26%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
            <FadeIn>
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-500">
                  Premium handmade bow shop
                </p>
                <h1 className="brand-serif mt-6 text-5xl leading-tight text-slate-950 sm:text-6xl">
                  Beautiful bows with the polish of a real boutique brand.
                </h1>
                <p className="mt-6 max-w-xl text-base leading-8 text-slate-600">
                  Sparkle Bows is built to feel gift-worthy from first click to
                  final delivery: refined product presentation, dependable
                  quality, and a storefront ready to support serious growth.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={scrollToShop}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-600"
                  >
                    Shop collection
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("bestseller");
                      scrollToShop();
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-slate-950"
                  >
                    View best sellers
                  </button>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      value: "Gift-ready",
                      label: "Presentation that feels premium",
                    },
                    {
                      value: "Small batch",
                      label: "Crafted with close quality control",
                    },
                    {
                      value: "Growth-ready",
                      label: "Built to support real operations",
                    },
                  ].map((item) => (
                    <div
                      key={item.value}
                      className="rounded-[28px] border border-slate-200 bg-[#fcfaf7] p-5"
                    >
                      <p className="text-lg font-semibold text-slate-950">
                        {item.value}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={120}>
              <div className="relative">
                <div className="rounded-[40px] border border-slate-200 bg-gradient-to-br from-rose-100 via-white to-amber-100 p-6 shadow-sm">
                  <div className="rounded-[34px] bg-white p-6 shadow-sm">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[28px] bg-slate-950 p-6 text-white">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-rose-200">
                          Signature
                        </p>
                        <h2 className="brand-serif mt-3 text-3xl">
                          Bows that look elevated in every photo.
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-slate-300">
                          Designed for birthdays, family photos, holiday
                          outfits, and polished everyday wear.
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="rounded-[28px] bg-[#fcfaf7] p-5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                            Why families return
                          </p>
                          <div className="mt-4 space-y-3 text-sm text-slate-600">
                            <p>Secure clips and polished finishing</p>
                            <p>Soft materials selected with comfort in mind</p>
                            <p>Presentation that feels ready to gift</p>
                          </div>
                        </div>
                        <div className="rounded-[28px] border border-rose-100 bg-rose-50 p-5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-500">
                            Built for growth
                          </p>
                          <p className="mt-3 text-sm leading-7 text-slate-600">
                            A more professional storefront builds confidence,
                            raises perceived value, and helps support repeat
                            orders as the brand grows.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* TRUST BAR */}
        <section className="border-b border-slate-200 bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 text-sm sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {[
              { icon: ShieldCheck, text: "Handmade quality control" },
              { icon: Truck, text: "Fast, dependable fulfillment" },
              { icon: PackageCheck, text: "Gift-worthy packaging" },
              { icon: CheckCircle2, text: "Designed for repeat customers" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-rose-300" />
                <span className="text-slate-200">{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURED PRODUCTS */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-500">
                  Featured collection
                </p>
                <h2 className="brand-serif mt-4 text-4xl text-slate-950">
                  The bows customers reach for first.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("bestseller");
                  scrollToShop();
                }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-rose-600"
              >
                Browse best sellers
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </FadeIn>

          {isLoading ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[4/5.7] animate-pulse rounded-[28px] bg-white"
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {displayFeatured.map((product, index) => (
                <FadeIn key={product._id || product.id} delay={index * 60}>
                  <ProductCard product={product} onAddToCart={addToCart} />
                </FadeIn>
              ))}
            </div>
          )}
        </section>

        {/* STYLE CARDS */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
            {STYLE_CARDS.map((item, index) => (
              <FadeIn key={item.category} delay={index * 90}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(item.category);
                    scrollToShop();
                  }}
                  className={`w-full rounded-[34px] border border-slate-200 bg-gradient-to-br ${item.palette} p-8 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Shop by style
                  </p>
                  <h3 className="brand-serif mt-6 text-3xl text-slate-950">
                    {item.label}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>
                  <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                    Browse style
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* FULL SHOP */}
        <section
          id="shop-section"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        >
          <FadeIn>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-500">
                  Full collection
                </p>
                <h2 className="brand-serif mt-4 text-4xl text-slate-950">
                  Every bow, all in one place.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
                  Handmade in small batches. Each style is crafted with boutique
                  quality and gift-worthy presentation.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                      selectedCategory === category.id
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:text-slate-950"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>

          {isLoading ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[4/5.7] animate-pulse rounded-[28px] bg-white"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="mt-10 rounded-[32px] border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
              No bows in this category yet.
            </div>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <FadeIn
                  key={product._id || product.id}
                  delay={Math.min(index * 40, 240)}
                >
                  <ProductCard product={product} onAddToCart={addToCart} />
                </FadeIn>
              ))}
            </div>
          )}
        </section>

        {/* VIP SIGNUP */}
        <VipSignupSection user={user} />

        {/* REVIEWS */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-500">
                    Customer confidence
                  </p>
                  <h2 className="brand-serif mt-4 text-4xl text-slate-950">
                    What customers are saying.
                  </h2>
                </div>
                {featuredReviews.length > 0 && (
                  <div className="rounded-full bg-amber-50 px-5 py-3 text-sm font-semibold text-slate-700">
                    Verified customer reviews
                  </div>
                )}
              </div>
            </FadeIn>

            {featuredReviews.length === 0 ? (
              <div className="mt-10 rounded-[32px] border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
                Customer reviews will appear here after your first orders.
              </div>
            ) : (
              <div className="mt-10 grid gap-6 lg:grid-cols-3">
                {featuredReviews.slice(0, 3).map((review, index) => (
                  <FadeIn key={review._id} delay={index * 90}>
                    <article className="rounded-[30px] border border-slate-200 bg-[#fcfaf7] p-7">
                      <div className="flex gap-1 text-amber-400">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                      <p className="mt-5 text-sm leading-7 text-slate-600">
                        "{review.text}"
                      </p>
                      <div className="mt-6 border-t border-slate-200 pt-5">
                        <p className="font-semibold text-slate-950">
                          {review.userName}
                        </p>
                      </div>
                    </article>
                  </FadeIn>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-500">
              Ready to shop
            </p>
            <h2 className="brand-serif mt-5 text-5xl text-slate-950">
              Handmade bows that look and feel like a real boutique.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-slate-500">
              Every bow is made by hand with careful attention to quality,
              presentation, and the details that make a gift feel special.
            </p>
            <button
              type="button"
              onClick={scrollToShop}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              Shop all bows
              <ArrowRight className="h-4 w-4" />
            </button>
            <div className="mt-5">
              <Link
                to="/collections/sparkle"
                className="text-sm font-semibold text-slate-700 transition hover:text-rose-600"
              >
                Explore collections
              </Link>
            </div>
          </FadeIn>
        </section>
      </div>
    </div>
  );
}
