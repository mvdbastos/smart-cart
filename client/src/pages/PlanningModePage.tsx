import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2, ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductSearch } from "@/components/ProductSearch";
import { StoreComparisonTable } from "@/components/StoreComparisonTable";
import { api } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
}

interface ListItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  expectedPrice: string | null;
}

interface ShoppingList {
  id: string;
  name: string;
  mode: string;
  items: ListItem[];
}

interface StoreComparison {
  store: { id: string; name: string };
  items: { productId: string; productName: string; quantity: number; unitPrice: number | null; subtotal: number | null }[];
  total: number;
  hasAllPrices: boolean;
}

export default function PlanningModePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [comparison, setComparison] = useState<StoreComparison[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const loadList = useCallback(async () => {
    if (!id) return;
    const data = await api.get<ShoppingList>(`/lists/${id}`);
    setList(data);
  }, [id]);

  const loadComparison = useCallback(async () => {
    if (!id) return;
    const data = await api.get<StoreComparison[]>(`/lists/${id}/compare`);
    setComparison(data);
  }, [id]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (showCompare) loadComparison();
  }, [showCompare, loadComparison]);

  const addItem = async (product: Product) => {
    if (!id) return;
    await api.post(`/lists/${id}/items`, { productId: product.id, quantity: 1 });
    await loadList();
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!id || quantity < 1) return;
    await api.patch(`/lists/${id}/items/${itemId}`, { quantity });
    await loadList();
  };

  const removeItem = async (itemId: string) => {
    if (!id) return;
    await api.delete(`/lists/${id}/items/${itemId}`);
    await loadList();
  };

  const startShopping = async (storeId: string) => {
    if (!id) return;
    await api.patch(`/lists/${id}`, { mode: "BUYING", selectedStoreId: storeId });
    navigate(`/lists/${id}/buy`);
  };

  if (!list) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{list.name}</h1>
        <Button
          variant="outline"
          onClick={() => setShowCompare(!showCompare)}
          disabled={list.items.length === 0}
        >
          {showCompare ? "Back to list" : "Compare stores"}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {showCompare ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Store Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StoreComparisonTable comparison={comparison} onSelectStore={startShopping} />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Add item */}
          <Card>
            <CardContent className="pt-6">
              <ProductSearch onSelect={addItem} placeholder="Add a product to your list..." />
            </CardContent>
          </Card>

          {/* Items */}
          {list.items.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">
              Search and add products to build your list
            </p>
          ) : (
            <div className="space-y-2">
              {list.items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.product.category}
                        {item.product.unit && ` · ${item.product.unit}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-16 text-center"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {list.items.length > 0 && (
            <Button className="w-full" size="lg" onClick={() => setShowCompare(true)}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Compare Stores ({list.items.length} items)
            </Button>
          )}
        </>
      )}
    </div>
  );
}
