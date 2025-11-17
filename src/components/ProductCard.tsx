import { Link, useNavigate } from "react-router-dom";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/data/products";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: (productId: number) => apiService.addToCart(productId),
    onSuccess: (data) => {
      // Optimistically update cart cache
      queryClient.setQueryData(["cart"], data);
      toast.success("Produk berhasil ditambahkan ke keranjang!");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menambahkan ke keranjang"
      );
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to product detail
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info(
        "Silakan masuk terlebih dahulu untuk menambahkan ke keranjang"
      );
      navigate("/login");
      return;
    }

    addToCartMutation.mutate(Number(product.id));
  };

  const getImagePath = (imageName: string) => {
    if (!imageName) return "";
    // Images are now stored in Laravel backend storage
    return `http://localhost:8000/storage/${imageName}`;
  };

  return (
    <Card className="group overflow-hidden shadow-elegant hover:shadow-luxury transition-smooth animate-fade-in">
      <Link to={`/product/${product.id}`}>
        <div className="relative overflow-hidden aspect-square">
          <img
            src={getImagePath(product.image)}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-110 transition-smooth"
          />
          {product.bestseller && (
            <Badge className="absolute top-3 right-3 gradient-luxury">
              Terlaris
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-smooth">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground mb-2">{product.scent}</p>

        <div className="flex items-center space-x-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(product.rating)
                  ? "fill-primary text-primary"
                  : "text-muted"
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            {product.rating} ({product.reviews} ulasan)
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">
            Rp {new Intl.NumberFormat("id-ID").format(Number(product.price))}
          </span>
          <span className="text-sm text-muted-foreground">
            {product.volume}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full gradient-luxury group-hover:shadow-luxury transition-smooth"
          onClick={handleAddToCart}
          disabled={addToCartMutation.isPending}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {addToCartMutation.isPending
            ? "Menambahkan..."
            : "Tambah ke Keranjang"}
        </Button>
      </CardFooter>
    </Card>
  );
};
