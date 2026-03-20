// src/components/AdminForm.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDropzone } from "react-dropzone";
import {
  ImagePlus,
  GripHorizontal,
  X,
  Tag,
  DollarSign,
  Layers,
  TrendingUp,
  Package,
  Percent,
} from "lucide-react";
import api from "../api/axios.config";

const initialForm = {
  name: "",
  price: "",
  materialCost: "",
  inventory: "",
  category: "",
  newArrival: false,
  bestseller: false,
  featured: false,
};

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-7 py-5 border-b border-gray-100 bg-gray-50/60">
        <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-200 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-pink-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 leading-none">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-8">{children}</div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 font-semibold">{error}</p>
      )}
    </div>
  );
}

// ─── Input style ──────────────────────────────────────────────────────────────
const inp =
  "w-full rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white focus:border-pink-300 focus:ring-2 focus:ring-pink-100 pl-5 pr-4 py-5 text-sm text-gray-800 outline-none transition-all placeholder-gray-300";

// ─── Sortable Image ───────────────────────────────────────────────────────────
function SortableImage({ id, img, index, removeImage, updateAlt }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative w-24 h-36 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center pt-2 pb-2 px-1.5 group"
    >
      <div
        {...listeners}
        {...attributes}
        className="w-full flex justify-center mb-1.5 cursor-grab active:cursor-grabbing"
      >
        <GripHorizontal className="w-3.5 h-3.5 text-gray-300 group-hover:text-pink-400 transition-colors" />
      </div>
      <img
        src={img.url}
        alt={img.alt || `preview ${index + 1}`}
        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
      />
      <button
        type="button"
        onClick={() => removeImage(index)}
        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-colors"
      >
        <X className="w-2.5 h-2.5" />
      </button>
      <input
        type="text"
        placeholder="Alt…"
        value={img.alt}
        onChange={(e) => updateAlt(index, e.target.value)}
        className="w-full text-xs rounded-md border border-gray-200 bg-gray-50 focus:border-pink-300 px-1.5 py-1 mt-1.5 outline-none transition-colors"
      />
    </div>
  );
}

// ─── Live Preview ─────────────────────────────────────────────────────────────
function ProductPreview({ form, images }) {
  const price = parseFloat(form.price) || 0;
  const cost = parseFloat(form.materialCost) || 0;
  const inventory = parseInt(form.inventory) || 0;
  const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : null;
  const profit = price > 0 && cost > 0 ? (price - cost).toFixed(2) : null;
  const mainImage = images[0]?.url ?? null;

  const categoryLabel = {
    sparkle: "✨ Sparkly",
    long: "🎀 Long Ribbon",
    classic: "🎗️ Classic",
    seasonal: "🌸 Seasonal",
  }[form.category] ?? null;

  return (
    <div className="flex flex-col gap-5 sticky top-6 w-full">
      {/* Label */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Live Preview
        </p>
      </div>

      {/* Product card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden w-full">
        {/* Hero image */}
        <div className="relative bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 w-full" style={{ paddingBottom: "75%" }}>
          <div className="absolute inset-0 flex items-center justify-center">
            {mainImage ? (
              <img src={mainImage} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/70 border border-pink-100 flex items-center justify-center">
                  <ImagePlus className="w-7 h-7 text-pink-200" />
                </div>
                <p className="text-xs font-medium text-pink-300">No image yet</p>
              </div>
            )}
          </div>
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {form.newArrival && (
              <span className="bg-purple-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">🆕 NEW</span>
            )}
            {form.bestseller && (
              <span className="bg-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">🔥 BEST</span>
            )}
            {form.featured && (
              <span className="bg-amber-400 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">⭐ FEATURED</span>
            )}
          </div>
          {categoryLabel && (
            <div className="absolute top-3 right-3">
              <span className="text-xs font-semibold text-purple-600 bg-white/90 border border-purple-100 px-2.5 py-1 rounded-full shadow-sm">
                {categoryLabel}
              </span>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="p-6">
          <h3 className="font-bold text-gray-900 text-lg leading-snug mb-1">
            {form.name || <span className="text-gray-300 font-normal text-base">Product name…</span>}
          </h3>
          <p className="text-3xl font-bold text-pink-500 mb-5">
            {price > 0 ? `$${price.toFixed(2)}` : <span className="text-gray-200 text-xl font-normal">$0.00</span>}
          </p>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Cost</p>
              </div>
              <p className="text-base font-bold text-orange-500">
                {cost > 0 ? `$${cost.toFixed(2)}` : <span className="text-gray-300 font-normal text-sm">—</span>}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Percent className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Margin</p>
              </div>
              <p className={`text-base font-bold ${margin !== null ? (parseFloat(margin) >= 50 ? "text-emerald-500" : "text-amber-500") : "text-gray-300"}`}>
                {margin !== null ? `${margin}%` : "—"}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Profit</p>
              </div>
              <p className="text-base font-bold text-emerald-500">
                {profit ? `$${profit}` : <span className="text-gray-300 font-normal text-sm">—</span>}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Package className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Stock</p>
              </div>
              <p className={`text-base font-bold ${inventory > 5 ? "text-gray-800" : inventory > 0 ? "text-amber-500" : "text-gray-300"}`}>
                {inventory > 0 ? `${inventory} units` : "—"}
              </p>
            </div>
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              {images.slice(0, 5).map((img, i) => (
                <img key={i} src={img.url} alt="" className="w-10 h-10 object-cover rounded-lg border border-gray-200" />
              ))}
              {images.length > 5 && (
                <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-400">+{images.length - 5}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export default function AdminForm({ productToEdit, onSuccess, onCancel }) {
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (productToEdit) {
      setForm({
        name: productToEdit.name || "",
        price: productToEdit.price ?? "",
        materialCost: productToEdit.materialCost ?? "",
        inventory: productToEdit.inventory ?? "",
        category: productToEdit.category || "",
        newArrival: !!productToEdit.newArrival,
        bestseller: !!productToEdit.bestseller,
        featured: !!productToEdit.featured,
      });
      setImages(productToEdit.images || []);
    } else {
      setForm(initialForm);
      setImages([]);
    }
  }, [productToEdit]);

  const validate = () => {
    const errs = {};
    if (!form.name) errs.name = "Required";
    if (!form.price) errs.price = "Required";
    if (!form.materialCost) errs.materialCost = "Required";
    if (!form.inventory) errs.inventory = "Required";
    if (!form.category) errs.category = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        price: parseFloat(form.price),
        materialCost: parseFloat(form.materialCost),
        inventory: parseInt(form.inventory, 10),
        category: form.category,
        newArrival: form.newArrival,
        bestseller: form.bestseller,
        featured: form.featured,
        images,
      };
      if (productToEdit)
        await api.put(`/api/products/${productToEdit._id}`, payload);
      else await api.post("/api/products", payload);
      setForm(initialForm);
      setImages([]);
      onSuccess();
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (i) => setImages((p) => p.filter((_, idx) => idx !== i));
  const updateAlt = (i, alt) =>
    setImages((p) => p.map((img, idx) => (idx === i ? { ...img, alt } : img)));

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await api.post("/api/uploads", fd);
      setImages((p) => [...p, { url: res.data.url, alt: "" }]);
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    }
  };

  const onDrop = useCallback((files) => files.forEach(uploadFile), []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  const sensors = useSensors(useSensor(PointerSensor));
  const handleDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id)
      setImages((p) => arrayMove(p, parseInt(active.id), parseInt(over.id)));
  };

  return (
    // ── TRUE 50/50 grid — neither column can steal space from the other ──
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "start" }}>

      {/* ── LEFT: Form ─────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-7">

        {/* Product Info */}
        <SectionCard icon={Layers} title="Product Info" subtitle="Name and category">
          <div className="grid grid-cols-2 gap-6">
            <Field label="Product Name" error={errors.name}>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                className={inp} placeholder="e.g. Sparkle Princess Bow" />
            </Field>
            <Field label="Category" error={errors.category}>
              <select name="category" value={form.category} onChange={handleChange} className={inp}>
                <option value="">Select category…</option>
                <option value="sparkle">✨ Sparkly</option>
                <option value="long">🎀 Long Ribbon</option>
                <option value="classic">🎗️ Classic</option>
                <option value="seasonal">🌸 Seasonal</option>
              </select>
            </Field>
          </div>
        </SectionCard>

        {/* Pricing */}
        <SectionCard icon={DollarSign} title="Pricing & Inventory" subtitle="Price, cost, and stock">
          <div className="grid grid-cols-3 gap-6">
            <Field label="Sale Price ($)" error={errors.price}>
              <input type="number" step="0.01" name="price" value={form.price}
                onChange={handleChange} className={inp} placeholder="0.00" />
            </Field>
            <Field label="Material Cost ($)" error={errors.materialCost}>
              <input type="number" step="0.01" name="materialCost" value={form.materialCost}
                onChange={handleChange} className={inp} placeholder="0.00" />
            </Field>
            <Field label="Stock Qty" error={errors.inventory}>
              <input type="number" name="inventory" value={form.inventory}
                onChange={handleChange} className={inp} placeholder="0" />
            </Field>
          </div>
        </SectionCard>

        {/* Tags */}
        <SectionCard icon={Tag} title="Tags" subtitle="Highlight this product in the store">
          <div className="flex flex-col gap-3">
            {[
              { name: "newArrival", label: "New Arrival", emoji: "🆕", desc: "Show as new in store" },
              { name: "bestseller", label: "Bestseller", emoji: "🔥", desc: "Mark as top selling" },
              { name: "featured", label: "Featured", emoji: "⭐", desc: "Highlight on homepage" },
            ].map(({ name, label, emoji, desc }) => (
              <label
                key={name}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                  form[name]
                    ? "border-pink-300 bg-pink-50"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
                }`}
              >
                <input type="checkbox" name={name} checked={form[name]}
                  onChange={handleChange} className="sr-only" />
                <span className="text-xl w-7 text-center flex-shrink-0">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold leading-none ${form[name] ? "text-pink-700" : "text-gray-700"}`}>
                    {label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  form[name] ? "bg-pink-500 border-pink-500" : "border-gray-300"
                }`}>
                  {form[name] && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </label>
            ))}
          </div>
        </SectionCard>

        {/* Images */}
        <SectionCard icon={ImagePlus} title="Product Images" subtitle="First image is the cover · drag to reorder">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className="rounded-xl border-2 border-dashed text-center cursor-pointer transition-all py-12 px-6"
              style={{ backgroundColor: isDragActive ? "#fce7f3" : "#fdf2f8", borderColor: isDragActive ? "#f472b6" : "#f9a8d4" }}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                isDragActive ? "bg-pink-100" : "bg-white border border-gray-200"
              }`}>
                <ImagePlus className={`w-6 h-6 ${isDragActive ? "text-pink-500" : "text-gray-400"}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700">
                  {isDragActive ? "Release to upload" : "Drop images here"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  or <span className="text-pink-500 font-semibold">click to browse</span> · JPG, PNG, WEBP
                </p>
              </div>
            </div>
          </div>

          {/* Uploaded thumbnails */}
          {images.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                {images.length} image{images.length !== 1 ? "s" : ""} · drag to reorder
              </p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={images.map((_, i) => `${i}`)} strategy={horizontalListSortingStrategy}>
                  <div className="flex gap-3 flex-wrap">
                    {images.map((img, i) => (
                      <SortableImage key={i} id={`${i}`} img={img} index={i}
                        removeImage={removeImage} updateAlt={updateAlt} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </SectionCard>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold py-7 rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed text-xl tracking-widest uppercase"
        >
          {loading ? "Saving…" : productToEdit ? "💾 Save Changes" : "🎀 Add Bow to Store"}
        </button>
      </form>

      {/* ── RIGHT: Live Preview ─────────────────────────────────────────── */}
      <div>
        <ProductPreview form={form} images={images} />
      </div>

    </div>
  );
}