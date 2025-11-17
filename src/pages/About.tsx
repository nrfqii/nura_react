import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Tentang Kami</h1>
              <p className="text-xl text-muted-foreground">
                Cerita di balik aroma mewah Nura Oud
              </p>
            </div>

            <div className="space-y-12">
              {/* Our Story */}
              <section className="bg-card rounded-lg p-8 shadow-elegant animate-fade-in">
                <h2 className="text-3xl font-bold mb-6 text-primary">Cerita Kami</h2>
                <div className="space-y-4 text-lg leading-relaxed">
                  <p>
                    Selamat datang di Nura Oud, toko parfum mewah yang menghadirkan aroma terbaik dari berbagai penjuru dunia.
                    Kami berkomitmen untuk menyediakan produk berkualitas tinggi dengan pelayanan terbaik untuk pelanggan kami.
                  </p>
                  <p>
                    Misi kami adalah memberikan pengalaman berbelanja parfum yang mudah, nyaman, dan memuaskan.
                    Terima kasih telah memilih Nura Oud sebagai destinasi parfum Anda.
                  </p>
                </div>
              </section>

              {/* Our Values */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-card rounded-lg p-6 shadow-elegant text-center animate-slide-up">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🌟</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Kualitas Premium</h3>
                  <p className="text-muted-foreground">
                    Hanya menggunakan bahan-bahan terbaik dan paling langka dari seluruh dunia.
                  </p>
                </div>

                <div className="bg-card rounded-lg p-6 shadow-elegant text-center animate-slide-up" style={{ animationDelay: "0.1s" }}>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🛡️</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Keaslian Terjamin</h3>
                  <p className="text-muted-foreground">
                    Setiap produk kami dijamin 100% asli dan berkualitas tinggi.
                  </p>
                </div>

                <div className="bg-card rounded-lg p-6 shadow-elegant text-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🚚</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Pengiriman Cepat</h3>
                  <p className="text-muted-foreground">
                    Layanan pengiriman cepat dan aman ke seluruh Indonesia.
                  </p>
                </div>
              </section>

              {/* Contact CTA */}
              <section className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 text-center animate-fade-in">
                <h2 className="text-2xl font-bold mb-4">Punya Pertanyaan?</h2>
                <p className="text-muted-foreground mb-6">
                  Kami siap membantu Anda menemukan aroma yang sempurna.
                </p>
                <a
                  href="/contact"
                  className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200"
                >
                  Hubungi Kami
                </a>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
