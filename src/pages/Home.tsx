import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { Star, Sparkles, Shield, Truck } from "lucide-react";

const Home = () => {
  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: () => apiService.getProducts(),
  });

  const featuredProducts = products
    .filter((p: any) => p.bestseller)
    .slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <Hero />

        {/* Features Section */}
        <section className="py-16 gradient-subtle">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center space-y-3 animate-fade-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Kualitas Premium</h3>
                <p className="text-sm text-muted-foreground">
                  Bahan langka asli
                </p>
              </div>

              <div
                className="text-center space-y-3 animate-fade-in"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Terjamin Keasliannya</h3>
                <p className="text-sm text-muted-foreground">
                  Produk 100% asli
                </p>
              </div>

              <div
                className="text-center space-y-3 animate-fade-in"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Pengiriman Cepat</h3>
                <p className="text-sm text-muted-foreground">
                  Pengiriman ke seluruh indonesia
                </p>
              </div>

              <div
                className="text-center space-y-3 animate-fade-in"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Peringkat Teratas</h3>
                <p className="text-sm text-muted-foreground">
                  Disukai ribuan pelanggan
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Parfum Unggulan
              </h2>
              <p className="text-xl text-muted-foreground">
                Temukan aroma favorit kami
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">
                  Gagal memuat produk. Silakan coba lagi.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredProducts.map((product: any, index: number) => (
                  <div
                    key={product.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* About Section */}
        <section className="py-20 gradient-dark">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-bold text-primary">
                Cerita Nura Oud
              </h2>
              <p className="text-lg text-secondary-foreground opacity-90 leading-relaxed">
                Selama beberapa generasi, kami telah menciptakan parfum Timur
                Tengah yang luar biasa menggunakan oud terbaik, bunga langka,
                dan bahan berharga. Setiap aroma menceritakan kisah tradisi,
                kemewahan, dan keanggunan abadi. Para ahli parfum kami
                menggabungkan teknik kuno dengan seni modern untuk menciptakan
                aroma yang memikat dan menginspirasi.
              </p>
              <p className="text-lg text-secondary-foreground opacity-90 leading-relaxed">
                Setiap botol Nura Oud adalah komitmen kami terhadap keunggulan,
                keaslian, dan warisan budaya parfum Timur Tengah yang kaya.
              </p>
            </div>
          </div>
        </section>

        {/* Promo Banner */}
        <section className="py-20 gradient-subtle">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-6 p-12 rounded-lg shadow-elegant animate-scale-in">
              <h2 className="text-3xl md:text-4xl font-bold">
                Penawaran Spesial Peluncuran
              </h2>
              <p className="text-xl text-muted-foreground">
                Dapatkan diskon 15% untuk pesanan pertama dengan kode:{" "}
                <span className="font-bold text-primary">NURA15</span>
              </p>
              <p className="text-lg text-muted-foreground">
                Gratis ongkos kirim untuk pembelian di atas Rp 3.000.000
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
