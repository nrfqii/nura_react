import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Product } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/api";

const Catalog = () => {
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => apiService.getProducts(),
  });

  const { data: reviews } = useQuery({
    queryKey: ['all-product-reviews'],
    queryFn: async () => {
      if (!products) return null;
      const reviewsData: any = {};
      for (const product of products) {
        try {
          const productReviews = await apiService.getProductReviews(Number(product.id));
          if (productReviews.reviews?.length > 0) {
            reviewsData[product.id] = productReviews.reviews;
          }
        } catch (error) {
          // Skip if reviews fail to load
        }
      }
      return reviewsData;
    },
    enabled: !!products && products.length > 0,
  });

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!products) return;

    let result = [...products];

    // Apply bestseller filter from URL
    if (filterParam === "bestseller") {
      result = result.filter(p => p.bestseller);
    }

    // Apply category filter
    if (category !== "all") {
      result = result.filter(p => p.category === category);
    }

    // Apply search
    if (searchQuery) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.scent.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // featured - keep original order
        break;
    }

    setFilteredProducts(result);
  }, [products, category, sortBy, searchQuery, filterParam]);

  const categories: string[] = products ? ["all", ...Array.from(new Set(products.map(p => p.category)))] : ["all"];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading products...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="gradient-subtle py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
              {filterParam === "bestseller" ? "Terlaris" : "Koleksi Kami"}
            </h1>
            <p className="text-xl text-muted-foreground animate-fade-in">
              Jelajahi berbagai parfum Timur Tengah yang luar biasa
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="py-8 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari parfum..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                {/* Category Filter */}
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat === "all" ? "Semua Kategori" : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Urutkan berdasarkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Unggulan</SelectItem>
                    <SelectItem value="price-low">Harga: Rendah ke Tinggi</SelectItem>
                    <SelectItem value="price-high">Harga: Tinggi ke Rendah</SelectItem>
                    <SelectItem value="rating">Peringkat Teratas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Menampilkan {filteredProducts.length} dari {products?.length || 0} produk
              </p>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-xl text-muted-foreground">Tidak ada produk yang cocok dengan kriteria Anda.</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setCategory("all");
                    setSearchQuery("");
                  }}
                >
                  Hapus Filter
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Reviews Section */}
        {reviews && Object.keys(reviews).length > 0 && (
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Ulasan Pelanggan</h2>
              <div className="max-w-4xl mx-auto space-y-6">
                {Object.entries(reviews).flatMap(([productId, productReviews]: [string, any[]]) =>
                  productReviews.slice(0, 3).map((review: any) => (
                    <div key={`${productId}-${review.id}`} className="bg-white p-6 rounded-lg shadow-sm border">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                            {review.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <span className="font-medium">{review.user?.name || 'Anonymous'}</span>
                            <div className="text-sm text-muted-foreground">
                              {products?.find(p => p.id === Number(productId))?.name}
                            </div>
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
                  ))
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Catalog;
