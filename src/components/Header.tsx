import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, User, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/api";

export const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/catalog') {
      // Katalog is active only when on /catalog without bestseller filter or on product pages
      return (location.pathname === '/catalog' && !location.search.includes('bestseller')) || location.pathname.startsWith('/product');
    }
    return location.pathname === path;
  };

  // Fetch cart data for counter
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiService.getCart(),
    enabled: isAuthenticated,
  });

  const cartItemCount = cartData?.items?.length || 0;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 group">
            <h1 className="text-2xl font-bold text-primary transition-all duration-300 group-hover:scale-105 group-hover:text-primary/90">
              Nura Oud
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              Beranda
              {isActive('/') && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
              )}
            </Link>
            <Link
              to="/catalog"
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/catalog')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              Katalog
              {isActive('/catalog') && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
              )}
            </Link>
            <Link
              to="/catalog?filter=bestseller"
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === '/catalog' && location.search.includes('bestseller')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              Terlaris
              {location.pathname === '/catalog' && location.search.includes('bestseller') && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
              )}
            </Link>
            <Link
              to="/about"
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/about')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              Tentang Kami
              {isActive('/about') && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
              )}
            </Link>
            <Link
              to="/contact"
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive('/contact')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
            >
              Kontak
              {isActive('/contact') && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
              )}
            </Link>
            {isAuthenticated && (
              <Link
                to="/orders"
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/orders')
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                }`}
              >
                Pesanan Saya
                {isActive('/orders') && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
                )}
              </Link>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/cart">
                  <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 transition-colors duration-200">
                    <ShoppingCart className="h-5 w-5" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Hi, {user?.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/cart">
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors duration-200">
                    <ShoppingCart className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors duration-200">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              </>
            )}
            <Link to="/catalog">
              <Button className="gradient-luxury hover:shadow-luxury transition-all duration-200">
                Belanja Sekarang
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-primary/10 transition-colors duration-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 space-y-2 animate-fade-in">
            <Link
              to="/"
              className={`block py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive('/')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Beranda
            </Link>
            <Link
              to="/catalog"
              className={`block py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive('/catalog')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Katalog
            </Link>
            <Link
              to="/catalog?filter=bestseller"
              className={`block py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                location.pathname === '/catalog' && location.search.includes('bestseller')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Terlaris
            </Link>
            <Link
              to="/about"
              className={`block py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive('/about')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Tentang Kami
            </Link>
            <Link
              to="/contact"
              className={`block py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive('/contact')
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Kontak
            </Link>
            {isAuthenticated && (
              <Link
                to="/orders"
                className={`block py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive('/orders')
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Pesanan Saya
              </Link>
            )}
            <div className="flex items-center space-x-4 pt-4">
              {isAuthenticated ? (
                <>
                  <Link to="/cart" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="relative hover:bg-primary/5 transition-colors duration-200">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Keranjang
                      {cartItemCount > 0 && (
                        <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                          {cartItemCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Hi, {user?.name}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Keluar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/cart" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="hover:bg-primary/5 transition-colors duration-200">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Keranjang
                    </Button>
                  </Link>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="hover:bg-primary/5 transition-colors duration-200">
                      <User className="h-4 w-4 mr-2" />
                      Masuk
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
