import { cn } from "@/lib/utils";

interface StoreComparison {
  store: { id: string; name: string };
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number | null;
    subtotal: number | null;
  }[];
  total: number;
  hasAllPrices: boolean;
}

interface Props {
  comparison: StoreComparison[];
  onSelectStore?: (storeId: string) => void;
}

export function StoreComparisonTable({ comparison, onSelectStore }: Props) {
  if (comparison.length === 0) {
    return <p className="text-sm text-muted-foreground">No price data available yet.</p>;
  }

  // Sort by total (cheapest first)
  const sorted = [...comparison].sort((a, b) => a.total - b.total);
  const cheapestId = sorted[0]?.store.id;

  // Get product list from first store
  const products = sorted[0]?.items ?? [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-2 font-medium">Product</th>
            <th className="text-center py-2 px-1 font-medium">Qty</th>
            {sorted.map((s) => (
              <th
                key={s.store.id}
                className={cn(
                  "text-right py-2 px-2 font-medium",
                  s.store.id === cheapestId && "text-primary"
                )}
              >
                {s.store.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product, idx) => (
            <tr key={product.productId} className="border-b last:border-0">
              <td className="py-2 px-2">{product.productName}</td>
              <td className="text-center py-2 px-1">{product.quantity}</td>
              {sorted.map((s) => {
                const item = s.items[idx];
                return (
                  <td
                    key={s.store.id}
                    className={cn("text-right py-2 px-2", s.store.id === cheapestId && "text-primary font-medium")}
                  >
                    {item?.unitPrice != null ? `$${item.subtotal?.toFixed(2)}` : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 font-semibold">
            <td className="py-2 px-2" colSpan={2}>Total</td>
            {sorted.map((s) => (
              <td
                key={s.store.id}
                className={cn(
                  "text-right py-2 px-2",
                  s.store.id === cheapestId && "text-primary"
                )}
              >
                ${s.total.toFixed(2)}
                {!s.hasAllPrices && <span className="text-xs text-muted-foreground ml-1">*</span>}
              </td>
            ))}
          </tr>
          {onSelectStore && (
            <tr>
              <td className="py-2 px-2" colSpan={2}></td>
              {sorted.map((s) => (
                <td key={s.store.id} className="text-right py-2 px-2">
                  <button
                    onClick={() => onSelectStore(s.store.id)}
                    className="text-xs text-primary underline hover:no-underline"
                  >
                    Shop here
                  </button>
                </td>
              ))}
            </tr>
          )}
        </tfoot>
      </table>
      <p className="text-xs text-muted-foreground mt-2">* Partial prices — some items have no data for this store</p>
    </div>
  );
}
