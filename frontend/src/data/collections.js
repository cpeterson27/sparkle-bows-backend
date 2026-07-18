export const COLLECTIONS = [
  {
    slug: "sparkle",
    title: "Sparkle Collection",
    category: "sparkle",
    description:
      "Statement bows designed for birthdays, celebrations, and girls who love shine.",
    eyebrow: "Signature shine",
    hero:
      "A premium edit of sparkle bows built to feel gift-worthy, photogenic, and boutique-level polished.",
  },
  {
    slug: "classic",
    title: "Classic Collection",
    category: "classic",
    description:
      "Timeless silhouettes for portraits, school outfits, and elevated everyday wear.",
    eyebrow: "Refined everyday",
    hero:
      "Classic bows for customers who want softness, structure, and presentation that still feels special.",
  },
  {
    slug: "ribbon",
    title: "Ribbon Collection",
    category: "long",
    description:
      "Long-tail ribbon bows with movement, shape, and boutique presence.",
    eyebrow: "Elegant detail",
    hero:
      "Longer silhouettes that feel polished in product photos, gifting moments, and special-event outfits.",
  },
];

export function getCollectionBySlug(slug) {
  return COLLECTIONS.find((collection) => collection.slug === slug) || null;
}
