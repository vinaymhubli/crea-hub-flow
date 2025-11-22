import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Eye, EyeOff, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (!password) {
      toast({
        title: 'Password Required',
        description: 'Please enter your password to confirm account deletion.',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: 'Error',
        description: 'User email not found.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);

    try {
      // First, verify the password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (signInError) {
        toast({
          title: 'Incorrect Password',
          description: 'The password you entered is incorrect.',
          variant: 'destructive',
        });
        setIsDeleting(false);
        return;
      }

      // Password is correct, proceed with account deletion
      // Call the delete_user RPC function
      const { error: deleteError } = await (supabase as any).rpc('delete_user_account', {
        user_id_to_delete: user.id,
      });

      if (deleteError) {
        console.error('Error deleting account:', deleteError);
        toast({
          title: 'Error',
          description: 'Failed to delete account. Please contact support.',
          variant: 'destructive',
        });
        setIsDeleting(false);
        return;
      }

      // Account deleted successfully
      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted.',
      });

      // Sign out and redirect to home
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setPassword('');
      setShowPassword(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="pt-2">
            This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">Warning:</h4>
            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
              <li>All your personal data will be deleted</li>
              <li>All your bookings and history will be removed</li>
              <li>This action is permanent and cannot be reversed</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Enter Your Password to Confirm</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isDeleting}
                className="pr-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDeleteAccount();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isDeleting}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isDeleting || !password}
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

