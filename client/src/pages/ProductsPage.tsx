import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { api } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newUnit, setNewUnit] = useState("");

  const loadProducts = async (q = "") => {
    const data = await api.get<Product[]>(`/products?q=${encodeURIComponent(q)}`);
    setProducts(data);
  };

  useEffect(() => {
    loadProducts(search);
  }, [search]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await api.post("/products", {
      name: newName.trim(),
      category: newCategory.trim() || undefined,
      unit: newUnit.trim() || undefined,
    });
    setNewName("");
    setNewCategory("");
    setNewUnit("");
    setDialogOpen(false);
    await loadProducts(search);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="pl-9"
        />
      </div>

      <div className="grid gap-2">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="flex items-center gap-3 py-3 px-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{product.name}</p>
              </div>
              {product.category && <Badge variant="outline">{product.category}</Badge>}
              {product.unit && (
                <span className="text-xs text-muted-foreground">{product.unit}</span>
              )}
            </CardContent>
          </Card>
        ))}
        {products.length === 0 && (
          <p className="text-center text-muted-foreground py-10">
            {search ? "No products found" : "No products yet"}
          </p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>Add a product to the community catalog</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product name</Label>
              <Input id="productName" value={newName} onChange={(e) => setNewName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productCategory">Category (optional)</Label>
              <Input id="productCategory" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Dairy, Fruits, Bakery" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productUnit">Unit (optional)</Label>
              <Input id="productUnit" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="e.g. kg, unit, L" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!newName.trim()}>Add Product</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
