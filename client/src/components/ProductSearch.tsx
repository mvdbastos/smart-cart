import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
}

interface ProductSearchProps {
  onSelect: (product: Product) => void;
  placeholder?: string;
}

export function ProductSearch({ onSelect, placeholder = "Search products..." }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      const data = await api.get<Product[]>(`/products?q=${encodeURIComponent(query)}`);
      setResults(data);
      setOpen(true);
    }, 300);
    return () => clearTimeout(timeoutRef.current);
  }, [query]);

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {results.map((product) => (
            <button
              key={product.id}
              className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent text-left"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(product);
                setQuery("");
                setResults([]);
                setOpen(false);
              }}
            >
              <span>{product.name}</span>
              <span className="text-xs text-muted-foreground">
                {product.category} {product.unit ? `(${product.unit})` : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
