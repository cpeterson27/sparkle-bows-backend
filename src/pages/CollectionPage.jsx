import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import Seo from "../components/Seo";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { COLLECTIONS, getCollectionBySlug } from "../data/collections";

export default function CollectionPage({ products = [], addToCart }) {
  const { settings } = useSiteSettings();
  const { slug } = useParams();
  const collection = getCollectionBySlug(slug);

  if (!collection) {
    return <Navigate to="/" replace />;
  }

  const collectionProducts = products.filter(
    (product) => product.category === collection.category,
  );

  return (
    <div className="bg-[#f7f3ee]">
      <Seo
        title={collection.title}
        description={collection.description}
        type="website"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: collection.title,
          description: collection.description,
          url: new URL(
            `/collections/${collection.slug}`,
            settings.siteUrl || window.location.origin,
          ).toString(),
        }}
      />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-500">
            {collection.eyebrow}
          </p>
          <h1 className="mt-4 font-serif text-5xl text-slate-950">
            {collection.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            {collection.hero}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {COLLECTIONS.map((item) => (
              <Link
                key={item.slug}
                to={`/collections/${item.slug}`}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  item.slug === collection.slug
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50"
                }`}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {collectionProducts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {collectionProducts.map((product) => (
              <ProductCard
                key={product._id || product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="font-serif text-3xl text-slate-950">
              This collection is coming together.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              Add products in this collection from the admin dashboard and they
              will appear here automatically.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              Return to storefront
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
