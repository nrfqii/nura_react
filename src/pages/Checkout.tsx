import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Loader2, ArrowLeft, Truck, MapPin, User } from "lucide-react";

// Extend window interface for Midtrans Snap
declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess: (result: any) => void;
          onPending: (result: any) => void;
          onError: (result: any) => void;
          onClose: () => void;
        }
      ) => void;
    };
  }
}

interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
    volume?: string;
  };
}

interface Cart {
  id: number;
  cart_items: CartItem[];
}

const shippingOptions = [
  { id: "jne", name: "JNE Express", cost: 0, duration: "2–3 hari" },
  { id: "jnt", name: "J&T Express", cost: 0, duration: "1–2 hari" },
  { id: "sicepat", name: "SiCepat REG", cost: 0, duration: "1–2 hari" },
  // { id: 'cod', name: 'COD (Cash on Delivery)', cost: 0, duration: 'Saat pengiriman' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [voucherError, setVoucherError] = useState("");

  const getImagePath = (imageName: string) => {
    if (!imageName) return "/placeholder-product.jpg";
    // Images are now stored in Laravel backend storage
    return `http://localhost:8000/storage/${imageName}`;
  };

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: "",
    shipping_address: "",
    city: "",
    postal_code: "",
    shipping_method: "jne",
    payment_method: "bank_transfer",
    notes: "",
    voucher_code: "",
  });

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => apiService.getCart(),
    enabled: !!user,
  });

  const selectedShipping = shippingOptions.find(
    (option) => option.id === formData.shipping_method
  );
  const subtotal =
    cart?.items?.reduce(
      (total: number, item: CartItem) =>
        total + item.product.price * item.quantity,
      0
    ) || 0;
  const shippingCost = selectedShipping?.cost || 0;
  const adminFee = 0;
  const totalPrice = subtotal + shippingCost + adminFee - voucherDiscount;

  const handleApplyVoucher = async () => {
    if (!formData.voucher_code.trim()) {
      setVoucherError("Masukkan kode voucher");
      return;
    }

    try {
      const response = await apiService.applyVoucher(formData.voucher_code, subtotal);
      setAppliedVoucher(response.voucher);
      setVoucherDiscount(response.discount);
      setVoucherError("");
      toast({
        title: "Voucher Berhasil",
        description: `Diskon Rp ${formatCurrency(response.discount)} telah diterapkan`,
      });
    } catch (error: any) {
      setVoucherError(error.message || "Kode voucher tidak valid");
      setAppliedVoucher(null);
      setVoucherDiscount(0);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherDiscount(0);
    setFormData({ ...formData, voucher_code: "" });
    setVoucherError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.shipping_address.trim() ||
      !formData.city.trim() ||
      !formData.postal_code.trim()
    ) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua data pengiriman",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiService.createOrder({
        name: formData.name,
        phone: formData.phone,
        shipping_address: formData.shipping_address,
        city: formData.city,
        postal_code: formData.postal_code,
        shipping_method: formData.shipping_method,
        payment_method: formData.payment_method,
        notes: formData.notes,
        voucher_code: appliedVoucher?.code,
      });

      toast({
        title: "Berhasil!",
        description: appliedVoucher
          ? `Pesanan berhasil dibuat! Diskon Rp ${formatCurrency(voucherDiscount)} telah diterapkan.`
          : "Pesanan berhasil dibuat!",
      });

      // If payment method is not COD, redirect to payment
      if (formData.payment_method !== "cash_on_delivery") {
        // Create payment and redirect to Midtrans
        try {
          const paymentResponse = await apiService.createPayment(
            response.order_id,
            {}
          );

          // Load Midtrans Snap for real payment
          const loadSnap = () => {
            if (window.snap) {
              // If Snap is already loaded, use it directly
              window.snap.pay(paymentResponse.snap_token, {
                onSuccess: async (result: any) => {
                  console.log("Payment success:", result);
                  // Notify backend to confirm and update order status
                  try {
                    await apiService.confirmPayment(response.order_id, {
                      transaction_status:
                        result.transaction_status || "settlement",
                      status_code: result.status_code,
                      gross_amount: result.gross_amount,
                    });
                  } catch (err) {
                    console.error("Failed to confirm payment to backend", err);
                  }

                  toast({
                    title: "Pembayaran Berhasil",
                    description: "Pesanan Anda telah berhasil dibayar",
                  });
                  navigate("/orders");
                },
                onPending: async (result: any) => {
                  console.log("Payment pending:", result);
                  try {
                    await apiService.confirmPayment(response.order_id, {
                      transaction_status:
                        result.transaction_status || "pending",
                      status_code: result.status_code,
                      gross_amount: result.gross_amount,
                    });
                  } catch (err) {
                    console.error("Failed to confirm payment to backend", err);
                  }

                  toast({
                    title: "Pembayaran Pending",
                    description: "Pembayaran sedang diproses",
                  });
                  navigate("/orders");
                },
                onError: (result: any) => {
                  console.log("Payment error:", result);
                  toast({
                    title: "Pembayaran Gagal",
                    description: "Terjadi kesalahan dalam pembayaran",
                    variant: "destructive",
                  });
                  navigate("/orders");
                },
                onClose: () => {
                  console.log("Payment modal closed");
                  navigate("/orders");
                },
              });
            } else {
              // Load Snap script if not loaded
              const scriptElement = document.createElement("script");
              scriptElement.src = "https://app.sandbox.midtrans.com/snap/snap.js";
              scriptElement.setAttribute(
                "data-client-key",
                "SB-Mid-client-mh8JlyA0LtOPTqFk"
              );

              scriptElement.onload = () => {
                if (window.snap) {
                  window.snap.pay(paymentResponse.snap_token, {
                    onSuccess: async (result: any) => {
                      console.log("Payment success:", result);
                      // Notify backend to confirm and update order status
                      try {
                        await apiService.confirmPayment(response.order_id, {
                          transaction_status:
                            result.transaction_status || "settlement",
                          status_code: result.status_code,
                          gross_amount: result.gross_amount,
                        });
                      } catch (err) {
                        console.error("Failed to confirm payment to backend", err);
                      }

                      toast({
                        title: "Pembayaran Berhasil",
                        description: "Pesanan Anda telah berhasil dibayar",
                      });
                      navigate("/orders");
                    },
                    onPending: async (result: any) => {
                      console.log("Payment pending:", result);
                      try {
                        await apiService.confirmPayment(response.order_id, {
                          transaction_status:
                            result.transaction_status || "pending",
                          status_code: result.status_code,
                          gross_amount: result.gross_amount,
                        });
                      } catch (err) {
                        console.error("Failed to confirm payment to backend", err);
                      }

                      toast({
                        title: "Pembayaran Pending",
                        description: "Pembayaran sedang diproses",
                      });
                      navigate("/orders");
                    },
                    onError: (result: any) => {
                      console.log("Payment error:", result);
                      toast({
                        title: "Pembayaran Gagal",
                        description: "Terjadi kesalahan dalam pembayaran",
                        variant: "destructive",
                      });
                      navigate("/orders");
                    },
                    onClose: () => {
                      console.log("Payment modal closed");
                      navigate("/orders");
                    },
                  });
                }
              };

              document.head.appendChild(scriptElement);
            }
          };

          loadSnap();
        } catch (paymentError: any) {
          console.error("Payment creation failed:", paymentError);
          toast({
            title: "Error",
            description:
              "Gagal membuat pembayaran, tetapi pesanan sudah dibuat",
            variant: "destructive",
          });
          navigate("/orders");
        }
      } else {
        // COD - just redirect to orders
        navigate("/orders");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat pesanan",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Keranjang Anda kosong</h1>
          <Button onClick={() => navigate("/catalog")}>Lanjut Belanja</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/cart")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Keranjang
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Data Pembeli / Pengiriman */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Data Pembeli & Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nama Penerima</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="081234567890"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="shipping_address">Alamat Lengkap</Label>
                  <Textarea
                    id="shipping_address"
                    value={formData.shipping_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipping_address: e.target.value,
                      })
                    }
                    placeholder="Jl. Contoh No. 123, RT/RW 01/02"
                    required
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Kota / Kecamatan</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      placeholder="Jakarta Selatan"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Kode Pos</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          postal_code: e.target.value,
                        })
                      }
                      placeholder="12345"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Instruksi khusus untuk pengiriman"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Voucher Code */}
            <Card>
              <CardHeader>
                <CardTitle>Kode Voucher</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!appliedVoucher ? (
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Masukkan kode voucher"
                        value={formData.voucher_code}
                        onChange={(e) =>
                          setFormData({ ...formData, voucher_code: e.target.value })
                        }
                        className={voucherError ? "border-red-500" : ""}
                      />
                      <Button
                        type="button"
                        onClick={handleApplyVoucher}
                        variant="outline"
                      >
                        Terapkan
                      </Button>
                    </div>
                    {voucherError && (
                      <p className="text-sm text-red-600">{voucherError}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <p className="font-medium text-green-800">{appliedVoucher.name}</p>
                      <p className="text-sm text-green-600">
                        Diskon: Rp {formatCurrency(voucherDiscount)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={handleRemoveVoucher}
                      variant="outline"
                      size="sm"
                    >
                      Hapus
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>


            {/* Metode Pengiriman */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Metode Pengiriman
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.shipping_method}
                  onValueChange={(value) =>
                    setFormData({ ...formData, shipping_method: value })
                  }
                  className="space-y-3"
                >
                  {shippingOptions.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label
                        htmlFor={option.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{option.name}</div>
                            <div className="text-sm text-gray-600">
                              {option.duration}
                            </div>
                          </div>
                          <div className="font-semibold text-primary">
                            {option.cost === 0
                              ? "Gratis"
                              : `Rp ${formatCurrency(option.cost)}`}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Ringkasan Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {cart.items.map((item: CartItem) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <img
                        src={getImagePath(item.product.image)}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-gray-600">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="font-semibold text-sm">
                        Rp {formatCurrency(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <hr />

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal Produk</span>
                    <span>Rp {formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pengiriman</span>
                    <span>
                      {shippingCost === 0
                        ? "Gratis"
                        : `Rp ${formatCurrency(shippingCost)}`}
                    </span>
                  </div>
                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Diskon Voucher</span>
                      <span>-Rp {formatCurrency(voucherDiscount)}</span>
                    </div>
                  )}
                  {adminFee > 0 && (
                    <div className="flex justify-between">
                      <span>Biaya Admin</span>
                      <span>Rp {formatCurrency(adminFee)}</span>
                    </div>
                  )}
                </div>

                <hr />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total Bayar</span>
                  <span className="text-primary">
                    Rp {formatCurrency(totalPrice)}
                  </span>
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full mt-6"
                  disabled={isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Memproses...
                    </>
                  ) : (
                    "Buat Pesanan Sekarang"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
