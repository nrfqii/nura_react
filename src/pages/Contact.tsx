import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const Contact = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Kontak</h1>
              <p className="text-xl text-muted-foreground">
                Jika Anda memiliki pertanyaan, saran, atau membutuhkan bantuan, jangan ragu untuk menghubungi kami.
              </p>
            </div>

            <div className="space-y-8 text-lg leading-relaxed">
              <p>Email: <a href="mailto:support@nuraoud.com" className="text-primary hover:underline">support@nuraoud.com</a></p>
              <p>Telepon: <a href="tel:+6281234567890" className="text-primary hover:underline">+62 812 3456 7890</a></p>
              <p>Alamat: Jl. Parfum No. 123, Jakarta, Indonesia</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
