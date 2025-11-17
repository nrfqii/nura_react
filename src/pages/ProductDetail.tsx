import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star, ShoppingCart, Heart, Share2, Check, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: () => apiService.getProduct(Number(id)),
    enabled: !!id,
  });

  const { data: allProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => apiService.getProducts(),
  });

  const { data: reviews } = useQuery({
    queryKey: ['product-reviews', id],
    queryFn: () => apiService.getProductReviews(Number(id)),
    enabled: !!id,
  });

  const [quantity, setQuantity] = useState(1);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Load general chat messages when modal opens
  const loadChatMessages = async () => {
    try {
      const res = await apiService.getGeneralChatMessages();
      setChatMessages(res.messages || []);
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  };

  useEffect(() => {
    if (chatModalOpen) {
      loadChatMessages();
    }
  }, [chatModalOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading product...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Produk Tidak Ditemukan</h1>
            <Link to="/catalog">
              <Button>Kembali ke Katalog</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getImagePath = (imageName: string) => {
    if (!imageName) return "";
    // Images are now stored in Laravel backend storage
    return `http://localhost:8000/storage/${imageName}`;
  };

  const relatedProducts = allProducts?.filter(p => p.id !== product.id && p.category === product.category).slice(0, 3) || [];

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      return;
    }

    try {
      await apiService.addToCart(Number(product.id), quantity);
      toast.success(`Ditambahkan ${quantity} ${product.name} ke keranjang`);
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan ke keranjang");
    }
  };

  const handleOpenChat = () => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu untuk chat");
      return;
    }
    setChatModalOpen(true);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;

    try {
      const res = await apiService.postGeneralChatMessage(chatInput.trim());
      setChatMessages((prev) => [...prev, res.message]);
      setChatInput("");
      // Don't show success notification for chat messages
    } catch (error: any) {
      toast.error("Gagal mengirim pesan");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <section className="py-6 border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-smooth">Beranda</Link>
              <span>/</span>
              <Link to="/catalog" className="hover:text-primary transition-smooth">Katalog</Link>
              <span>/</span>
              <span className="text-foreground">{product.name}</span>
            </div>
          </div>
        </section>

        {/* Product Details */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Product Image */}
              <div className="animate-fade-in">
                <div className="relative aspect-square rounded-lg overflow-hidden shadow-elegant">
                  <img
                    src={getImagePath(product.image)}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                  {product.bestseller && (
                    <Badge className="absolute top-4 right-4 gradient-luxury">
                      Terlaris
                    </Badge>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-2">{product.name}</h1>
                  <p className="text-xl text-muted-foreground">{product.category}</p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating)
                            ? "fill-primary text-primary"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating} ({product.reviews} ulasan)
                  </span>
                </div>

                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-bold text-primary">Rp{product.price.toLocaleString()}</span>
                  <span className="text-lg text-muted-foreground">/ {product.volume}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">Tersedia ({product.stock} tersedia)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">Gratis ongkos kirim untuk pembelian di atas Rp 3.000.000</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">Garansi keaslian</span>
                  </div>
                </div>

                <div className="border-t border-b py-6 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Deskripsi</h3>
                    <p className="text-muted-foreground">{product.description}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Catatan Aroma</h3>
                    <p className="text-muted-foreground">{product.scent}</p>
                  </div>
                </div>

                {/* Quantity and Actions */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="font-semibold">Jumlah:</label>
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        -
                      </Button>
                      <span className="px-4">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      size="lg"
                      className="flex-1 gradient-luxury shadow-luxury"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Tambah ke Keranjang
                    </Button>
                    <Button size="lg" variant="outline" onClick={handleOpenChat}>
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                    <Button size="lg" variant="outline">
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button size="lg" variant="outline">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-20 gradient-subtle">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Anda Mungkin Juga Suka</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Reviews Section */}
        {reviews?.reviews?.data && reviews.reviews.data.length > 0 && (
          <section className="py-20">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Ulasan Pelanggan</h2>
              <div className="max-w-4xl mx-auto space-y-6">
                {reviews.reviews.data.map((review: any) => (
                  <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                          {review.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <span className="font-medium">{review.user?.name || 'Anonymous'}</span>
                          <p className="text-sm text-muted-foreground">{product.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? "fill-primary text-primary" : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-muted-foreground">{review.comment}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.created_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Chat Modal */}
      <Dialog open={chatModalOpen} onOpenChange={setChatModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat dengan Penjual
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto space-y-2">
              {chatMessages.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Belum ada pesan. Mulai percakapan dengan penjual!
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.is_admin ? "bg-gray-200 text-gray-900" : "bg-blue-500 text-white"
                    }`}>
                      <div className="text-sm">
                        <strong>{msg.is_admin ? "Admin" : "Anda"}:</strong> {msg.message}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {new Date(msg.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ketik pesan Anda..."
                className="flex-1 min-h-[60px]"
              />
              <Button onClick={handleSendChatMessage} disabled={!chatInput.trim()}>
                Kirim
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default ProductDetail;
