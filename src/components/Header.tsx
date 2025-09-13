
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, LogOut, Settings, LayoutDashboard, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { WalletBalanceIndicator } from './WalletBalanceIndicator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { balance, loading: walletLoading } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const getDesignersLink = () => {
    return profile?.user_type === 'client' ? '/customer-dashboard/designers' : '/designers';
  };

  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Designers', href: getDesignersLink() },
    { name: 'Services', href: '/services' },
    { name: 'How It Works', href: '/how-to-use' },
    { name: 'Contact Us', href: '/contact' },
  ];

  const handleSignOut = async () => {
    try {
      console.log('Header sign out clicked');
      await signOut();
      // Don't navigate here, let signOut handle the redirect
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback redirect
      navigate('/');
    }
  };

  const getDashboardLink = () => {
    if (profile?.is_admin) return '/admin-dashboard';
    if (profile?.user_type === 'designer') return '/designer-dashboard';
    return '/customer-dashboard';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="https://res.cloudinary.com/dknafpppp/image/upload/v1757697849/logo_final_2_x8c1wu.png" 
              alt="Meet My Designer" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-green-600 ${
                  location.pathname === item.href
                    ? 'text-green-600 border-b-2 border-green-600 pb-4 -mb-4'
                    : 'text-gray-700'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Wallet Balance Indicator */}
                <WalletBalanceIndicator className="hidden lg:block" />
                
                {/* Wallet Icon for Customers */}
                {profile?.user_type === 'client' && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/customer-dashboard/wallet')}
                    className="flex items-center space-x-2 text-gray-700 hover:text-green-600 hover:bg-green-50"
                  >
                    <Wallet className="w-5 h-5" />
                    <div className="flex flex-col items-start">
                      <span className="hidden sm:inline text-sm font-medium">Wallet</span>
                      {walletLoading ? (
                        <span className="text-xs text-gray-500">Loading...</span>
                      ) : (
                        <span className="text-xs font-semibold text-green-600">
                          ${balance.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </Button>
                )}
                
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm text-black">
                        {profile?.first_name} {profile?.last_name}
                      </p>
                      <p className="w-[200px] truncate text-xs text-zinc-700">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  {profile?.role === 'customer' && (
                    <DropdownMenuItem onClick={() => navigate('/customer-dashboard/wallet')}>
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>Wallet</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate(`${getDashboardLink()}/settings`)}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/auth">
                  <Button variant="ghost" className="text-gray-700 hover:text-green-600">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-4">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="text-gray-700 hover:text-green-600 py-2 border-b border-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  {!user && (
                    <div className="pt-4 space-y-2">
                      <Link to="/auth" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full">
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/auth" onClick={() => setIsOpen(false)}>
                        <Button className="w-full bg-gradient-to-r from-green-600 to-blue-600">
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
