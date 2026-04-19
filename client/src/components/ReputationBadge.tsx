import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReputationBadge({ reputation }: { reputation: number }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        reputation >= 10 ? "bg-yellow-100 text-yellow-800" :
        reputation >= 0 ? "bg-green-100 text-green-800" :
        "bg-red-100 text-red-800"
      )}
    >
      <Star className="h-3 w-3" />
      {reputation}
    </div>
  );
}
