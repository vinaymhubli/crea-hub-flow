import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSecurity() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    try {
      if (!user?.email) {
        toast({ title: "No user", description: "You must be logged in.", variant: "destructive" });
        return;
      }

      if (!currentPassword) {
        toast({ title: "Enter current password", description: "Current password is required.", variant: "destructive" });
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({ title: "Passwords do not match", description: "Re-type the new password.", variant: "destructive" });
        return;
      }

      setLoading(true);

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email as string,
        password: currentPassword,
      });
      if (reauthError) {
        throw new Error("Current password is incorrect");
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password updated", description: "Your admin password has been changed." });
    } catch (e: any) {
      toast({ title: "Failed to update password", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <Card className="bg-white border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-br from-red-400 to-pink-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Admin Security
          </CardTitle>
          <CardDescription className="text-white/80">
            Manage your admin account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div>
            <Label className="font-semibold text-gray-700">Current Password</Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="border-gray-200 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label className="font-semibold text-gray-700">New Password</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border-gray-200 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label className="font-semibold text-gray-700">Confirm New Password</Label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-gray-200 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Button className="w-full" onClick={handleChangePassword} disabled={loading}>
            {loading ? "Updating..." : (
              <span className="inline-flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


