import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Clock,
  Truck,
  CreditCard,
  Package,
  Home,
} from "lucide-react";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    image: string;
  };
}

interface Order {
  id: number;
  order_number: string;
  total_price: number;
  status: string;
  payment_status: string;
  payment_method: string;
  shipping_method: string;
  shipping_address: string;
  name: string;
  phone: string;
  city: string;
  postal_code: string;
  notes?: string;
  created_at: string;
  orderItems: OrderItem[];
}

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => apiService.getOrder(Number(orderId)),
    enabled: !!orderId && !!user,
  });

  const getImagePath = (imageName: string) => {
    try {
      return new URL(`../assets/${imageName}`, import.meta.url).href;
    } catch {
      return "/placeholder-product.jpg";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Menunggu Pembayaran
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Diproses
          </Badge>
        );
      case "shipped":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Dikirim
          </Badge>
        );
      case "delivered":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Diterima
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Memuat detail pesanan...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Pesanan tidak ditemukan</h1>
            <Button onClick={() => navigate("/orders")}>
              Lihat Pesanan Saya
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Success Header */}
        <section className="gradient-subtle py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Pesanan Berhasil Dibuat!
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Terima kasih, pesanan Anda telah berhasil dibuat! Silakan
              lanjutkan pembayaran untuk memproses pesanan Anda.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Order Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Detail Pesanan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Nomor Pesanan
                      </p>
                      <p className="font-semibold text-lg">
                        {order.order_number ||
                          `ORD-${order.id.toString().padStart(4, "0")}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Status Pesanan
                      </p>
                      {getStatusBadge(order.status)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Tanggal Pemesanan
                      </p>
                      <p className="font-medium">
                        {new Date(order.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Pembayaran
                      </p>
                      <p className="font-bold text-xl text-primary">
                        Rp {formatCurrency(order.total_price)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.orderItems?.map((item: OrderItem) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-4 p-4 border rounded-lg"
                      >
                        <img
                          src={getImagePath(item.product.image)}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Jumlah: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            Rp{" "}
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      Rp {formatCurrency(order.total_price)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="h-5 w-5 mr-2" />
                    Detail Pengiriman
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Nama Penerima
                      </p>
                      <p className="font-medium">{order.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Nomor Telepon
                      </p>
                      <p className="font-medium">{order.phone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Alamat Lengkap
                    </p>
                    <p className="font-medium">{order.shipping_address}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.city}, {order.postal_code}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Metode Pengiriman
                    </p>
                    <p className="font-medium">{order.shipping_method}</p>
                  </div>
                  {order.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Catatan</p>
                      <p className="font-medium">{order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Metode Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">{order.payment_method}</p>
                      <p className="text-sm text-muted-foreground">
                        Bank Transfer ke BCA 123456789 a.n. PT Nura Oud Essence
                      </p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                        <div>
                          <p className="font-medium text-yellow-800">
                            Pembayaran Belum Dilakukan
                          </p>
                          <p className="text-sm text-yellow-700">
                            Ini adalah simulasi pembayaran. Tidak perlu transfer
                            sungguhan.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate("/orders")}
                  variant="outline"
                  className="flex items-center"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Lihat di Menu "Pesanan Saya"
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  className="flex items-center gradient-luxury"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Kembali ke Beranda
                </Button>
              </div>

              {/* Chat Widget */}
              <Card>
                <CardHeader>
                  <CardTitle>Chat dengan Penjual</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderChat orderId={order.id} />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Simple inline chat component for order page
function OrderChat({ orderId }: { orderId: number }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const load = async () => {
    try {
      const res = await apiService.getChatMessages(orderId);
      setMessages(res.messages || []);
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  };

  useEffect(() => {
    if (!orderId) return;
    load();

    // Optional: Echo subscription if available
    // window.Echo should be configured in your frontend for private channel auth
    const channelName = `order.${orderId}`;
    let echoChannel: any = null;
    if ((window as any).Echo) {
      echoChannel = (window as any).Echo.private(channelName)
        .listen("AdminMessageSent", (e: any) => {
          setMessages((m) => [...m, e]);
        })
        .listen("CustomerMessageSent", (e: any) => {
          setMessages((m) => [...m, e]);
        });
    }

    const polling = setInterval(load, 10000);
    return () => {
      clearInterval(polling);
      if (echoChannel && echoChannel.unsubscribe) echoChannel.unsubscribe();
    };
  }, [orderId]);

  const send = async () => {
    if (!input.trim()) return;
    try {
      const res = await apiService.postChatMessage(orderId, input.trim());
      setMessages((m) => [...m, res.message]);
      setInput("");
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  return (
    <div className="space-y-3">
      <div className="max-h-64 overflow-y-auto space-y-2">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground">Belum ada pesan</div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded ${
              msg.is_admin ? "bg-blue-50 text-blue-900" : "bg-gray-50"
            }`}
          >
            <div className="text-sm font-medium">
              {msg.user?.name ?? (msg.is_admin ? "Admin" : "Anda")}
            </div>
            <div className="text-sm">{msg.message}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(msg.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Tulis pesan..."
        />
        <Button onClick={send}>Kirim</Button>
      </div>
    </div>
  );
}
