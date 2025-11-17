import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Footer = () => {
  return (
    <footer className="gradient-dark text-secondary-foreground mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-primary">Nura Oud</h3>
            <p className="text-sm opacity-90">
              Parfum Timur Tengah premium yang dibuat dengan bahan terbaik dari seluruh dunia.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="hover:text-primary transition-smooth">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary transition-smooth">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary transition-smooth">
                <Twitter className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-primary">Tautan Cepat</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/catalog" className="text-sm hover:text-primary transition-smooth">
                  Belanja Semua
                </Link>
              </li>
              <li>
                <Link to="/catalog?filter=bestseller" className="text-sm hover:text-primary transition-smooth">
                  Terlaris
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm hover:text-primary transition-smooth">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm hover:text-primary transition-smooth">
                  Kontak
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4 text-primary">Layanan Pelanggan</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm hover:text-primary transition-smooth">
                  Pengiriman & Pengembalian
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-primary transition-smooth">
                  Kebijakan Privasi
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-primary transition-smooth">
                  Syarat & Ketentuan
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-primary transition-smooth">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4 text-primary">Newsletter</h4>
            <p className="text-sm mb-4 opacity-90">Berlangganan untuk mendapatkan penawaran khusus dan pembaruan.</p>
            <div className="flex space-x-2">
              <Input
                type="email"
                placeholder="Email Anda"
                className="bg-secondary border-primary/20"
              />
              <Button className="gradient-luxury">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-primary/20 mt-8 pt-8 text-center">
          <p className="text-sm opacity-80">
            © {new Date().getFullYear()} Nura Oud. Semua hak dilindungi. | Parfum Timur Tengah Mewah
          </p>
        </div>
      </div>
    </footer>
  );
};
