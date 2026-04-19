import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ShoppingCart, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface ShoppingListSummary {
  id: string;
  name: string;
  mode: "PLANNING" | "BUYING";
  _count: { items: number };
  selectedStore?: { id: string; name: string } | null;
  updatedAt: string;
}

export default function HomePage() {
  const { user, loginAnonymous, loading } = useAuth();
  const [lists, setLists] = useState<ShoppingListSummary[]>([]);

  useEffect(() => {
    if (user) {
      api.get<ShoppingListSummary[]>("/lists").then(setLists).catch(console.error);
    }
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <ShoppingCart className="h-16 w-16 text-primary" />
        <h1 className="text-3xl font-bold">Smart Cart</h1>
        <p className="text-muted-foreground text-center max-w-sm">
          Community-powered price comparison. Build your list, compare stores, shop smart.
        </p>
        <div className="flex gap-3">
          <Button onClick={loginAnonymous}>Get Started</Button>
          <Button variant="outline" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Lists</h1>
        <Button asChild>
          <Link to="/lists/new">
            <Plus className="h-4 w-4 mr-2" />
            New List
          </Link>
        </Button>
      </div>

      {lists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10 gap-3">
            <ClipboardList className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No shopping lists yet</p>
            <Button asChild>
              <Link to="/lists/new">Create your first list</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {lists.map((list) => (
            <Link key={list.id} to={`/lists/${list.id}/${list.mode === "BUYING" ? "buy" : "plan"}`}>
              <Card className="hover:bg-accent/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{list.name}</CardTitle>
                    <Badge variant={list.mode === "BUYING" ? "default" : "secondary"}>
                      {list.mode === "BUYING" ? "Shopping" : "Planning"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {list._count.items} items
                    {list.selectedStore && ` · ${list.selectedStore.name}`}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
