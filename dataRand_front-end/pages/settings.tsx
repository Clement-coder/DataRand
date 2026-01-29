"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Bell, HardDrive } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function SettingsPage() {
  const { profile, updateProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;

    setIsLoading(true);
    const { error } = await updateProfile({
      full_name: fullName,
      avatar_url: avatarUrl,
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
    }
  };
  
  const getInitials = (name: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Public Profile</CardTitle>
            <CardDescription>
              This information will be displayed publicly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                        {getInitials(fullName)}
                    </AvatarFallback>
                </Avatar>
                <Input
                    placeholder="Avatar URL"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="max-w-sm"
                />
            </div>
            <div className="space-y-2">
              <label htmlFor="fullName">Full Name</label>
              <Input
                id="fullName"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Button onClick={handleSave} disabled={isLoading || authLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
            <CardDescription>
              Manage your notification preferences. (Coming soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">This feature is under development.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HardDrive className="h-5 w-5" /> Device Management</CardTitle>
            <CardDescription>
              Manage your connected devices for the compute layer. (Coming soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">This feature is under development.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default withAuth(SettingsPage);
