import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface PriceInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  expectedPrice?: number | null;
  onSubmit: (price: number) => void;
}

export function PriceInputDialog({
  open,
  onOpenChange,
  productName,
  expectedPrice,
  onSubmit,
}: PriceInputDialogProps) {
  const [price, setPrice] = useState(expectedPrice?.toString() ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(price);
    if (isNaN(val) || val <= 0) return;
    onSubmit(val);
    setPrice("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle>Enter price</DialogTitle>
          <DialogDescription>
            What's the actual price for <strong>{productName}</strong>?
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={expectedPrice ? `Expected: $${expectedPrice.toFixed(2)}` : "0.00"}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!price || parseFloat(price) <= 0}>
              Add to cart
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
