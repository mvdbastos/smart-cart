import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReputationBadge } from "@/components/ReputationBadge";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { LogOut, TrendingUp, TrendingDown, Award } from "lucide-react";

interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  reputation: number;
  provider: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    api.get<UserProfile>("/auth/me").then(setProfile).catch(console.error);
  }, []);

  if (!user || !profile) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardContent className="py-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium">{profile.name || profile.email || "Guest User"}</p>
              {profile.email && <p className="text-sm text-muted-foreground">{profile.email}</p>}
              <p className="text-xs text-muted-foreground capitalize">{profile.provider.toLowerCase()} account</p>
            </div>
            <ReputationBadge reputation={profile.reputation} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Reputation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-primary">{profile.reputation}</p>
            <p className="text-sm text-muted-foreground mt-1">reputation points</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center border-t pt-4">
            <div>
              <TrendingUp className="h-5 w-5 mx-auto text-green-500" />
              <p className="text-xs text-muted-foreground mt-1">Report accurate prices to earn reputation</p>
            </div>
            <div>
              <TrendingDown className="h-5 w-5 mx-auto text-red-500" />
              <p className="text-xs text-muted-foreground mt-1">Inaccurate prices lose reputation</p>
            </div>
            <div>
              <Award className="h-5 w-5 mx-auto text-yellow-500" />
              <p className="text-xs text-muted-foreground mt-1">Early reporters get bonus recovery</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={logout}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
