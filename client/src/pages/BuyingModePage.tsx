import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RunningTotal } from "@/components/RunningTotal";
import { PriceInputDialog } from "@/components/PriceInputDialog";
import { cn } from "@/lib/utils";
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
  isChecked: boolean;
  expectedPrice: string | null;
  actualPrice: string | null;
}

interface ShoppingList {
  id: string;
  name: string;
  mode: string;
  selectedStore?: { id: string; name: string } | null;
  items: ListItem[];
}

export default function BuyingModePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [priceDialogItem, setPriceDialogItem] = useState<ListItem | null>(null);

  const loadList = useCallback(async () => {
    if (!id) return;
    const data = await api.get<ShoppingList>(`/lists/${id}`);
    setList(data);
  }, [id]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleItemTap = (item: ListItem) => {
    if (item.isChecked) {
      // Uncheck
      uncheckItem(item.id);
    } else {
      // Open price dialog
      setPriceDialogItem(item);
    }
  };

  const checkItem = async (itemId: string, actualPrice: number) => {
    if (!id) return;
    await api.patch(`/lists/${id}/items/${itemId}`, {
      isChecked: true,
      actualPrice,
    });
    setPriceDialogItem(null);
    await loadList();
  };

  const uncheckItem = async (itemId: string) => {
    if (!id) return;
    await api.patch(`/lists/${id}/items/${itemId}`, {
      isChecked: false,
      actualPrice: null,
    });
    await loadList();
  };

  const backToPlanning = async () => {
    if (!id) return;
    await api.patch(`/lists/${id}`, { mode: "PLANNING", selectedStoreId: null });
    navigate(`/lists/${id}/plan`);
  };

  if (!list) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;
  }

  const checkedItems = list.items.filter((i) => i.isChecked);
  const uncheckedItems = list.items.filter((i) => !i.isChecked);
  const checkedTotal = checkedItems.reduce(
    (sum, i) => sum + (parseFloat(i.actualPrice ?? "0") * i.quantity),
    0
  );
  const estimatedTotal = list.items.reduce(
    (sum, i) =>
      sum + (parseFloat(i.actualPrice ?? i.expectedPrice ?? "0") * i.quantity),
    0
  );

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={backToPlanning}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{list.name}</h1>
          {list.selectedStore && (
            <p className="text-sm text-muted-foreground">
              Shopping at {list.selectedStore.name}
            </p>
          )}
        </div>
      </div>

      {/* Unchecked items */}
      {uncheckedItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-1">To buy</h2>
          {uncheckedItems.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleItemTap(item)}
            >
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity}
                    {item.expectedPrice && ` · Est: $${parseFloat(item.expectedPrice).toFixed(2)}`}
                  </p>
                </div>
                {item.expectedPrice && (
                  <Badge variant="outline" className="shrink-0">
                    ${(parseFloat(item.expectedPrice) * item.quantity).toFixed(2)}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Checked items */}
      {checkedItems.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground px-1">In cart</h2>
          {checkedItems.map((item) => (
            <Card
              key={item.id}
              className={cn("cursor-pointer opacity-70 transition-colors hover:opacity-100")}
              onClick={() => handleItemTap(item)}
            >
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-through text-muted-foreground">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity}
                  </p>
                </div>
                <Badge variant="default" className="shrink-0">
                  ${(parseFloat(item.actualPrice ?? "0") * item.quantity).toFixed(2)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* All done message */}
      {uncheckedItems.length === 0 && checkedItems.length > 0 && (
        <div className="text-center py-6">
          <p className="text-lg font-medium text-primary">All items in cart!</p>
          <p className="text-sm text-muted-foreground">Total: ${checkedTotal.toFixed(2)}</p>
        </div>
      )}

      {/* Running total */}
      <RunningTotal
        checkedTotal={checkedTotal}
        estimatedTotal={estimatedTotal}
        checkedCount={checkedItems.length}
        totalCount={list.items.length}
      />

      {/* Price input dialog */}
      {priceDialogItem && (
        <PriceInputDialog
          open={!!priceDialogItem}
          onOpenChange={(open) => !open && setPriceDialogItem(null)}
          productName={priceDialogItem.product.name}
          expectedPrice={priceDialogItem.expectedPrice ? parseFloat(priceDialogItem.expectedPrice) : null}
          onSubmit={(price) => checkItem(priceDialogItem.id, price)}
        />
      )}
    </div>
  );
}
