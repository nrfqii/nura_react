import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-perfume.jpg";

export const Hero = () => {
  return (
    <section className="relative h-[600px] md:h-[700px] flex items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/70 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl space-y-6 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground leading-tight">
            Temukan Koleksi Parfum Pilihan Terbaik
          </h1>
          <p className="text-xl md:text-2xl text-secondary-foreground opacity-90">
            Koleksi parfum eksklusif bernuansa Timur Tengah dengan aroma khas dan elegan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link to="/catalog">
              <Button size="lg" className="gradient-luxury shadow-luxury text-lg px-8">
                Lihat Koleksi
              </Button>
            </Link>
            <Link to="/about">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 bg-background/10 backdrop-blur border-primary/30 hover:bg-primary/20"
              >
                Tentang Kami
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
