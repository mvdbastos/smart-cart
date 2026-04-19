interface RunningTotalProps {
  checkedTotal: number;
  estimatedTotal: number;
  checkedCount: number;
  totalCount: number;
}

export function RunningTotal({ checkedTotal, estimatedTotal, checkedCount, totalCount }: RunningTotalProps) {
  return (
    <div className="sticky bottom-16 z-30 border-t bg-background/95 backdrop-blur px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {checkedCount} of {totalCount} items
          </p>
          <p className="text-xs text-muted-foreground">
            Est. remaining: ${(estimatedTotal - checkedTotal).toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">${checkedTotal.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">in cart</p>
        </div>
      </div>
    </div>
  );
}
