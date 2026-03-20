import { useState, useEffect } from "react";
import api from "../api/axios.config";

export function useProducts(options = {}) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/api/products");
        let products = res.data;

        // Filter by featured if option is set
        if (options.featured === "true") {
          products = products.filter(
            (p) => p.featured || p.bestseller || p.newArrival,
          );
        }

        // Filter by category if option is set
        if (options.category) {
          products = products.filter((p) => p.category === options.category);
        }

        setData(products);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [options.featured, options.category]);

  return { data, isLoading, error };
}
