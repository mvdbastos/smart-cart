import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Plus } from "lucide-react";
import { api } from "@/lib/api";

interface Store {
  id: string;
  name: string;
  address: string | null;
  isPreset: boolean;
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const loadStores = async () => {
    const data = await api.get<Store[]>("/stores");
    setStores(data);
  };

  useEffect(() => {
    loadStores();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await api.post("/stores", { name: newName.trim(), address: newAddress.trim() || undefined });
    setNewName("");
    setNewAddress("");
    setDialogOpen(false);
    await loadStores();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stores</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Suggest Store
        </Button>
      </div>

      <div className="grid gap-3">
        {stores.map((store) => (
          <Card key={store.id}>
            <CardContent className="flex items-center gap-3 py-4 px-4">
              <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{store.name}</p>
                {store.address && <p className="text-sm text-muted-foreground">{store.address}</p>}
              </div>
              {store.isPreset && <Badge variant="secondary">Official</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suggest a Store</DialogTitle>
            <DialogDescription>Add a store that's not in the list yet</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store name</Label>
              <Input id="storeName" value={newName} onChange={(e) => setNewName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeAddress">Address (optional)</Label>
              <Input id="storeAddress" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!newName.trim()}>Add Store</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
