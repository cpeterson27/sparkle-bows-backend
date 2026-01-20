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
import api from "../api/axios.config";

const initialForm = {
  name: "",
  price: "",
  materialCost: "",
  inventory: "",
  category: "",
};

function SortableImage({ id, img, index, removeImage, updateAlt }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative w-24 h-40 bg-pink-50 rounded-lg shadow-sm flex flex-col items-center py-1"
    >
      {/* Drag handle (vertically spaced slightly from top) */}
      <div
        {...listeners}
        {...attributes}
        className="absolute top-2 text-pink-600 cursor-grab"
      >
        ⋮
      </div>

      {/* Image preview */}
      <img
        src={img.url}
        alt={img.alt || `preview ${index + 1}`}
        className="w-24 h-24 object-cover rounded"
      />

      {/* Remove button */}
      <button
        type="button"
        onClick={() => removeImage(index)}
        className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full text-sm"
      >
        ×
      </button>

      {/* Alt text input below the image */}
      <input
        type="text"
        placeholder="Alt text"
        value={img.alt}
        onChange={(e) => updateAlt(index, e.target.value)}
        className="form-input w-full text-xs rounded-full border-pink-500 bg-pink-100 focus:border-pink-600 focus:ring-pink-300 px-2 py-1 mt-2 mb-2"
      />
    </div>
  );
}

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
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
        images,
      };

      if (productToEdit) {
        await api.put(`/api/products/${productToEdit._id}`, payload);
      } else {
        await api.post("/api/products", payload);
      }

      setForm(initialForm);
      setImages([]);
      onSuccess();
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index) =>
    setImages((prev) => prev.filter((_, i) => i !== index));
  const clearAllImages = () => setImages([]);
  const updateAlt = (index, alt) =>
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, alt } : img))
    );

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await api.post("/api/uploads", formData);
      setImages((prev) => [...prev, { url: res.data.url, alt: "" }]);
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    }
  };

  const onDrop = useCallback((acceptedFiles) => acceptedFiles.forEach(uploadFile), []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  const sensors = useSensors(useSensor(PointerSensor));
  const handleDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id, 10);
      const newIndex = parseInt(over.id, 10);
      setImages((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-pink-50 p-6 rounded-2xl shadow-lg border-2 border-pink-300 space-y-6"
    >
      {/* Header + Cancel */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {productToEdit ? "Edit Bow" : "Add New Bow"}
        </h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-pink-300 hover:bg-pink-400 text-white font-semibold px-4 py-2 rounded-full"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="form-input w-full rounded-lg border-pink-500 bg-pink-100 focus:border-pink-600 focus:ring-pink-300 px-3 py-2"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Price</label>
        <input
          type="number"
          step="0.01"
          name="price"
          value={form.price}
          onChange={handleChange}
          className="form-input w-full rounded-lg border-pink-500 bg-pink-100 focus:border-pink-600 focus:ring-pink-300 px-3 py-2"
        />
        {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
      </div>

      {/* Material Cost */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Material Cost
        </label>
        <input
          type="number"
          step="0.01"
          name="materialCost"
          value={form.materialCost}
          onChange={handleChange}
          className="form-input w-full rounded-lg border-pink-500 bg-pink-100 focus:border-pink-600 focus:ring-pink-300 px-3 py-2"
        />
        {errors.materialCost && (
          <p className="text-red-500 text-sm">{errors.materialCost}</p>
        )}
      </div>

      {/* Inventory */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Inventory Stock
        </label>
        <input
          type="number"
          name="inventory"
          value={form.inventory}
          onChange={handleChange}
          className="form-input w-full rounded-lg border-pink-500 bg-pink-100 focus:border-pink-600 focus:ring-pink-300 px-3 py-2"
        />
        {errors.inventory && (
          <p className="text-red-500 text-sm">{errors.inventory}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="form-select w-full rounded-lg border-pink-500 bg-pink-100 focus:border-pink-600 focus:ring-pink-300 px-3 py-2"
        >
          <option value="">Select category</option>
          <option value="sparkle">Sparkly</option>
          <option value="long">Long Ribbon</option>
          <option value="classic">Classic</option>
          <option value="seasonal">Seasonal</option>
        </select>
      </div>

      {/* Upload Zone — now spaced down more */}
      <div
        {...getRootProps()}
        className={`mt-8 p-5 border-2 border-dashed rounded-lg text-center cursor-pointer ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-pink-400"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-700">Drag & drop images here, or click to select</p>
      </div>

      {/* Spacing around Clear All Images */}
      {images.length > 0 && (
        <div className="mt-4 mb-4">
          <button
            type="button"
            onClick={clearAllImages}
            className="bg-pink-300 hover:bg-pink-400 text-white font-semibold px-4 py-2 rounded-full"
          >
            Clear All Images
          </button>
        </div>
      )}

      {/* Sortable images */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images.map((_, i) => `${i}`)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-3 flex-wrap">
            {images.map((img, i) => (
              <SortableImage
                key={i}
                id={`${i}`}
                img={img}
                index={i}
                removeImage={removeImage}
                updateAlt={updateAlt}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 rounded-full"
      >
        {loading ? "Saving…" : productToEdit ? "Save Changes" : "Add Bow"}
      </button>
    </form>
  );
}
