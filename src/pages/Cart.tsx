import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Cart = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const getImagePath = (imageName: string) => {
    if (!imageName) return "/placeholder-product.jpg";
    // Images are now stored in Laravel backend storage
    return `http://localhost:8000/storage/${imageName}`;
  };

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiService.getCart(),
    enabled: isAuthenticated,
  });

  const updateCartItemMutation = useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) =>
      apiService.updateCartItem(cartItemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Gagal mengupdate item');
    },
  });

  const removeCartItemMutation = useMutation({
    mutationFn: (cartItemId: number) => apiService.removeCartItem(cartItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item berhasil dihapus dari keranjang');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus item');
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => apiService.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Keranjang berhasil dikosongkan');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Gagal mengosongkan keranjang');
    },
  });

  const handleUpdateQuantity = (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartItemMutation.mutate({ cartItemId, quantity: newQuantity });
  };

  const handleRemoveItem = (cartItemId: number) => {
    removeCartItemMutation.mutate(cartItemId);
  };

  const handleClearCart = () => {
    if (window.confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
      clearCartMutation.mutate();
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
            <h2 className="text-3xl font-bold mb-4">Silakan Masuk Terlebih Dahulu</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Anda perlu masuk untuk melihat keranjang belanja
            </p>
            <Link to="/login">
              <Button size="lg" className="gradient-luxury shadow-luxury">
                Masuk
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Memuat keranjang...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const cartItems = cartData?.items || [];
  const total = cartData?.total || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="gradient-subtle py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold animate-fade-in">Keranjang Belanja</h1>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-20 animate-fade-in">
                <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
                <h2 className="text-3xl font-bold mb-4">Keranjang Anda kosong</h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Temukan koleksi parfum yang luar biasa kami
                </p>
                <Link to="/catalog">
                  <Button size="lg" className="gradient-luxury shadow-luxury">
                    Mulai Belanja
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Item Keranjang ({cartItems.length})</h2>
                    <Button
                      variant="outline"
                      onClick={handleClearCart}
                      disabled={clearCartMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Kosongkan Keranjang
                    </Button>
                  </div>

                  {cartItems.map((item: any) => (
                    <div key={item.id} className="bg-card p-6 rounded-lg shadow-elegant">
                      <div className="flex items-center space-x-4">
                        <img
                          src={getImagePath(item.product.image) || '/placeholder-product.jpg'}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.product.name}</h3>
                          <p className="text-muted-foreground">{item.product.brand}</p>
                          <p className="text-primary font-semibold">
                            Rp{item.product.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={updateCartItemMutation.isPending || item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={updateCartItemMutation.isPending}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={removeCartItemMutation.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <span className="font-semibold">Subtotal:</span>
                        <span className="font-bold text-primary">
                          Rp{(item.product.price * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-card p-6 rounded-lg shadow-elegant sticky top-4">
                    <h2 className="text-2xl font-bold mb-6">Ringkasan Pesanan</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Subtotal ({cartItems.length} item)</span>
                        <span className="font-semibold">Rp{total.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pengiriman</span>
                        <span className="font-semibold">Gratis</span>
                      </div>
                      <div className="border-t pt-4 flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">Rp{total.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-6 gradient-luxury shadow-luxury"
                      size="lg"
                      onClick={handleCheckout}
                    >
                      Lanjut ke Checkout
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
