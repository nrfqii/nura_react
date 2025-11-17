/*  */ import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { apiService } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  ShoppingBag,
  X,
  Phone,
  CreditCard,
  MapPin,
  Star,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    image: string;
    volume?: string;
  };
}

interface Order {
  id: number;
  order_number: string;
  total_price: number;
  subtotal?: number;
  voucher_discount?: number;
  voucher_code?: string;
  status: string;
  payment_status: string;
  payment_method: string;
  shipping_method: string;
  created_at: string;
  orderItems: OrderItem[];
  // optional recipient / shipping fields returned by the API
  name?: string;
  phone?: string;
  shipping_address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
}

export default function Orders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    order: Order | null;
    snapToken: string | null;
  }>({
    open: false,
    order: null,
    snapToken: null,
  });

  const [paymentMethodModal, setPaymentMethodModal] = useState<{
    open: boolean;
    order: Order | null;
  }>({
    open: false,
    order: null,
  });

  const [orderDetailsModal, setOrderDetailsModal] = useState<{
    open: boolean;
    order: Order | null;
  }>({
    open: false,
    order: null,
  });

  // Rating modal state for delivered orders
  const [ratingModal, setRatingModal] = useState<{
    open: boolean;
    order: Order | null;
    ratings: Record<number, number>;
    comments: Record<number, string>;
  }>({
    open: false,
    order: null,
    ratings: {},
    comments: {},
  });

  // ref to focus chat input inside OrderChat
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const [chatDialog, setChatDialog] = useState<{
    open: boolean;
    order: Order | null;
  }>({ open: false, order: null });
  const [chatInitialMessages, setChatInitialMessages] = useState<any[] | null>(
    null
  );

  // Chat cache helpers: prefer React Query cache, fallback to localStorage
  const CHAT_CACHE_KEY = (orderId: number) => `chat_${orderId}_v1`;

  const getCachedMessages = (orderId: number) => {
    // Try React Query cache first
    try {
      const q = queryClient.getQueryData<any>(["chat", orderId]);
      if (q && Array.isArray(q)) return q;
    } catch (e) {
      // ignore
    }

    // Fallback to localStorage
    try {
      const raw = localStorage.getItem(CHAT_CACHE_KEY(orderId));
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore
    }
    return null;
  };

  const setCachedMessages = (orderId: number, messages: any[]) => {
    try {
      queryClient.setQueryData(["chat", orderId], messages);
    } catch (e) {}
    try {
      localStorage.setItem(CHAT_CACHE_KEY(orderId), JSON.stringify(messages));
    } catch (e) {}
  };

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => apiService.getOrders(),
    enabled: !!user,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: number) => apiService.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({
        title: "Berhasil",
        description: "Pesanan berhasil dibatalkan",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membatalkan pesanan",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      apiService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({
        title: "Berhasil",
        description: "Status pesanan berhasil diperbarui",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui status",
        variant: "destructive",
      });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (orderId: number) => {
      const order = paymentModal.order;
      if (!order) return apiService.createPayment(orderId);

      // Pass enabled_payments based on the order's payment method
      const enabledPayments = [
        order.payment_method === "bank_transfer"
          ? "bank_transfer"
          : order.payment_method === "gopay"
          ? "gopay"
          : order.payment_method === "ovo"
          ? "ovo"
          : order.payment_method === "dana"
          ? "dana"
          : "bank_transfer",
      ];

      // If running on localhost (dev) or the order uses a generic 'online_payment',
      // request simulate mode so the backend enables more sandbox payment options
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const shouldSimulate =
        isLocalhost || order.payment_method === "online_payment";

      return apiService.createPayment(orderId, {
        enabled_payments: enabledPayments,
        simulate: shouldSimulate,
      });
    },
    onSuccess: (data) => {
      setPaymentModal({
        open: true,
        order: paymentModal.order,
        snapToken: data.snap_token,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat pembayaran",
        variant: "destructive",
      });
    },
  });

  const updatePaymentMethodMutation = useMutation({
    mutationFn: ({
      orderId,
      paymentMethod,
    }: {
      orderId: number;
      paymentMethod: string;
    }) => apiService.updatePaymentMethod(orderId, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setPaymentMethodModal({ open: false, order: null });
      toast({
        title: "Berhasil",
        description: "Metode pembayaran berhasil diubah",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal mengubah metode pembayaran",
        variant: "destructive",
      });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: ({
      orderId,
      reviews,
    }: {
      orderId: number;
      reviews: Array<{ product_id: number; rating: number; comment?: string }>;
    }) => apiService.submitReviews(orderId, reviews),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setRatingModal({ open: false, order: null, ratings: {}, comments: {} });
      toast({
        title: "Berhasil",
        description: "Rating berhasil dikirim",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal mengirim rating",
        variant: "destructive",
      });
    },
  });

  const getImagePath = (imageName: string) => {
    if (!imageName) return "/placeholder-product.jpg";
    // Images are now stored in Laravel backend storage
    if (imageName.startsWith("http://") || imageName.startsWith("https://")) {
      return imageName;
    }
    return `http://localhost:8000/storage/${imageName}`;
  };

  const getStatusBadge = (order: Order) => {
    switch (order.status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Menunggu Pembayaran
          </Badge>
        );
      case "waiting":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Menunggu Pembayaran
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Dikemas
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
            Selesai
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Dibatalkan
          </Badge>
        );
      default:
        return <Badge variant="secondary">{order.status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "processing":
        return <Package className="h-5 w-5 text-blue-600" />;
      case "shipped":
        return <Truck className="h-5 w-5 text-purple-600" />;
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "cancelled":
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const filterOrdersByStatus = (status: string) => {
    if (!orders) return [];
    if (status === "all") return orders;
    if (status === "pending") {
      return orders.filter((order: Order) => order.status === "waiting");
    }
    // Normalize status comparison (backend may return localized or english values)
    const normalize = (s: string | undefined) =>
      (s || "").toString().toLowerCase();
    const target = status.toLowerCase();
    return orders.filter((order: Order) => {
      const os = normalize(order.status);
      if (target === "delivered") {
        return os === "delivered" || os === "selesai";
      }
      if (target === "pending") return os === "waiting" || os === "pending";
      return os === target;
    });
  };

  const isDelivered = (order: Order) => {
    const s = (order.status || "").toString().toLowerCase();
    return s === "delivered" || s === "selesai";
  };

  const handleCancelOrder = (orderId: number) => {
    cancelOrderMutation.mutate(orderId);
  };

  const handleConfirmReceived = (orderId: number) => {
    updateStatusMutation.mutate({ orderId, status: "delivered" });
  };

  const calculateShippingCost = (shippingMethod: string): number => {
    const costs: { [key: string]: number } = {
      jne: 25000,
      jnt: 20000,
      sicepat: 22000,
      cod: 0,
    };
    return costs[shippingMethod] || 25000;
  };

  const handlePayNow = (order: Order) => {
    setPaymentModal({ open: true, order, snapToken: null });
    createPaymentMutation.mutate(order.id);
  };

  const handleChangePaymentMethod = (order: Order) => {
    setPaymentMethodModal({ open: true, order });
  };

  const handleUpdatePaymentMethod = (paymentMethod: string) => {
    if (paymentMethodModal.order) {
      updatePaymentMethodMutation.mutate({
        orderId: paymentMethodModal.order.id,
        paymentMethod,
      });
    }
  };

  // Open order detail modal
  const handleViewOrderDetails = (order: Order) => {
    setOrderDetailsModal({ open: true, order });
  };

  const handleOpenRating = (order: Order) => {
    // Try to fetch existing reviews for this order and prefill ratings
    setRatingModal({ open: true, order, ratings: {}, comments: {} });
    (async () => {
      try {
        const res = await apiService.getOrderReviews(order.id);
        // expected shape: { reviews: [{ product_id, rating, comment, ... }, ...] }
        const ratings: Record<number, number> = {};
        const comments: Record<number, string> = {};
        (res.reviews || []).forEach((r: any) => {
          if (r.product_id && r.rating) ratings[r.product_id] = r.rating;
          if (r.product_id && r.comment) comments[r.product_id] = r.comment;
        });
        setRatingModal({ open: true, order, ratings, comments });
      } catch (e) {
        // If fetching reviews fails, just open with empty selections
        console.warn("Failed to load existing reviews", e);
        setRatingModal({ open: true, order, ratings: {}, comments: {} });
      }
    })();
  };

  const handleSelectRating = (productId: number, rating: number) => {
    setRatingModal((prev) => ({
      ...prev,
      ratings: { ...(prev.ratings || {}), [productId]: rating },
    }));
  };

  const hasUserReviewedOrder = (order: Order) => {
    // Check if user has already reviewed this order
    return order.orderItems?.some(
      (item) => (ratingModal.ratings || {})[item.product_id] !== undefined
    );
  };

  const handleCommentChange = (productId: number, comment: string) => {
    setRatingModal((prev) => ({
      ...prev,
      comments: { ...(prev.comments || {}), [productId]: comment },
    }));
  };

  const handleSubmitRatings = async () => {
    if (!ratingModal.order) return;
    const reviews = Object.entries(ratingModal.ratings)
      .map(([productId, rating]) => ({
        product_id: Number(productId),
        rating,
        comment: ratingModal.comments[Number(productId)] || undefined,
      }))
      .filter((r) => r.rating && r.product_id);

    if (reviews.length === 0) {
      toast({
        title: "Peringatan",
        description: "Pilih minimal satu produk untuk diberi rating",
        variant: "destructive",
      });
      return;
    }

    try {
      await submitReviewMutation.mutateAsync({
        orderId: ratingModal.order.id,
        reviews,
      });
      setRatingModal({ open: false, order: null, ratings: {}, comments: {} });
    } catch (e) {
      // mutation onError will show toast
    }
  };

  // Initialize Midtrans Snap when snapToken is available
  useEffect(() => {
    if (paymentModal.snapToken && paymentModal.open) {
      const loadSnap = () => {
        if (window.snap) {
          window.snap.pay(paymentModal.snapToken, {
            onSuccess: (result: any) => {
              console.log("Payment success:", result);
              // Notify backend to update order status
              if (paymentModal.order) {
                const payload = {
                  transaction_status:
                    result.transaction_status ||
                    result.transactionStatus ||
                    "capture",
                  status_code: result.status_code || result.statusCode,
                  gross_amount: result.gross_amount || result.grossAmount,
                };

                apiService
                  .confirmPayment(paymentModal.order.id, payload)
                  .then(() => {
                    queryClient.invalidateQueries({ queryKey: ["orders"] });
                    toast({
                      title: "Pembayaran Berhasil",
                      description: "Pesanan Anda telah berhasil dibayar",
                    });
                  })
                  .catch((err) => {
                    console.error("Failed to confirm payment to backend", err);
                    toast({
                      title: "Error",
                      description:
                        err.message || "Gagal mengonfirmasi pembayaran",
                      variant: "destructive",
                    });
                  })
                  .finally(() => {
                    setPaymentModal({
                      open: false,
                      order: null,
                      snapToken: null,
                    });
                  });
              } else {
                setPaymentModal({ open: false, order: null, snapToken: null });
                queryClient.invalidateQueries({ queryKey: ["orders"] });
                toast({
                  title: "Pembayaran Berhasil",
                  description: "Pesanan Anda telah berhasil dibayar",
                });
              }
            },
            onPending: (result: any) => {
              console.log("Payment pending:", result);
              if (paymentModal.order) {
                const payload = {
                  transaction_status:
                    result.transaction_status ||
                    result.transactionStatus ||
                    "pending",
                  status_code: result.status_code || result.statusCode,
                  gross_amount: result.gross_amount || result.grossAmount,
                };

                apiService
                  .confirmPayment(paymentModal.order.id, payload)
                  .then(() => {
                    queryClient.invalidateQueries({ queryKey: ["orders"] });
                    toast({
                      title: "Pembayaran Pending",
                      description: "Pembayaran sedang diproses",
                    });
                  })
                  .catch((err) => {
                    console.error(
                      "Failed to confirm pending payment to backend",
                      err
                    );
                    toast({
                      title: "Error",
                      description:
                        err.message || "Gagal mengonfirmasi pembayaran pending",
                      variant: "destructive",
                    });
                  })
                  .finally(() => {
                    setPaymentModal({
                      open: false,
                      order: null,
                      snapToken: null,
                    });
                  });
              } else {
                setPaymentModal({ open: false, order: null, snapToken: null });
                toast({
                  title: "Pembayaran Pending",
                  description: "Pembayaran sedang diproses",
                });
              }
            },
            onError: (result: any) => {
              console.log("Payment error:", result);
              setPaymentModal({ open: false, order: null, snapToken: null });
              toast({
                title: "Pembayaran Gagal",
                description: "Terjadi kesalahan dalam pembayaran",
                variant: "destructive",
              });
            },
            onClose: () => {
              setPaymentModal({ open: false, order: null, snapToken: null });
            },
          });
        } else {
          // Load Snap script if not loaded
          const script = document.createElement("script");
          script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
          script.setAttribute(
            "data-client-key",
            "SB-Mid-client-mh8JlyA0LtOPTqFk"
          );
          script.onload = () => {
            if (window.snap) {
              window.snap.pay(paymentModal.snapToken, {
                onSuccess: (result: any) => {
                  console.log("Payment success:", result);
                  // Notify backend to update order status
                  if (paymentModal.order) {
                    const payload = {
                      transaction_status:
                        result.transaction_status ||
                        result.transactionStatus ||
                        "capture",
                      status_code: result.status_code || result.statusCode,
                      gross_amount: result.gross_amount || result.grossAmount,
                    };

                    apiService
                      .confirmPayment(paymentModal.order.id, payload)
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ["orders"] });
                        toast({
                          title: "Pembayaran Berhasil",
                          description: "Pesanan Anda telah berhasil dibayar",
                        });
                      })
                      .catch((err) => {
                        console.error(
                          "Failed to confirm payment to backend",
                          err
                        );
                        toast({
                          title: "Error",
                          description:
                            err.message || "Gagal mengonfirmasi pembayaran",
                          variant: "destructive",
                        });
                      })
                      .finally(() => {
                        setPaymentModal({
                          open: false,
                          order: null,
                          snapToken: null,
                        });
                      });
                  } else {
                    setPaymentModal({
                      open: false,
                      order: null,
                      snapToken: null,
                    });
                    queryClient.invalidateQueries({ queryKey: ["orders"] });
                    toast({
                      title: "Pembayaran Berhasil",
                      description: "Pesanan Anda telah berhasil dibayar",
                    });
                  }
                },
                onPending: (result: any) => {
                  console.log("Payment pending:", result);
                  if (paymentModal.order) {
                    const payload = {
                      transaction_status:
                        result.transaction_status ||
                        result.transactionStatus ||
                        "pending",
                      status_code: result.status_code || result.statusCode,
                      gross_amount: result.gross_amount || result.grossAmount,
                    };

                    apiService
                      .confirmPayment(paymentModal.order.id, payload)
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ["orders"] });
                        toast({
                          title: "Pembayaran Pending",
                          description: "Pembayaran sedang diproses",
                        });
                      })
                      .catch((err) => {
                        console.error(
                          "Failed to confirm pending payment to backend",
                          err
                        );
                        toast({
                          title: "Error",
                          description:
                            err.message ||
                            "Gagal mengonfirmasi pembayaran pending",
                          variant: "destructive",
                        });
                      })
                      .finally(() => {
                        setPaymentModal({
                          open: false,
                          order: null,
                          snapToken: null,
                        });
                      });
                  } else {
                    setPaymentModal({
                      open: false,
                      order: null,
                      snapToken: null,
                    });
                    toast({
                      title: "Pembayaran Pending",
                      description: "Pembayaran sedang diproses",
                    });
                  }
                },
                onError: (result: any) => {
                  console.log("Payment error:", result);
                  setPaymentModal({
                    open: false,
                    order: null,
                    snapToken: null,
                  });
                  toast({
                    title: "Pembayaran Gagal",
                    description: "Terjadi kesalahan dalam pembayaran",
                    variant: "destructive",
                  });
                },
                onClose: () => {
                  setPaymentModal({
                    open: false,
                    order: null,
                    snapToken: null,
                  });
                },
              });
            }
          };
          document.head.appendChild(script);
        }
      };

      loadSnap();

      return () => {
        const existingScript = document.querySelector('script[src*="snap.js"]');
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
      };
    }
  }, [paymentModal.snapToken, paymentModal.open, queryClient, toast]);

  const renderOrderActions = (order: Order) => {
    switch (order.status) {
      case "pending":
        if (order.payment_method === "cash_on_delivery") {
          return (
            <div className="flex gap-2 flex-wrap">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={cancelOrderMutation.isPending}
                  >
                    Batalkan Pesanan
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Konfirmasi Pembatalan
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Apakah Anda yakin ingin membatalkan pesanan{" "}
                      {order.order_number || `ORD-${order.id}`}? Pembatalan ini
                      tidak dapat dibatalkan dan dana akan dikembalikan jika
                      sudah dibayar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancelOrderMutation.isPending}
                    >
                      Batalkan Pesanan
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        }
        return (
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={() => handlePayNow(order)}
              disabled={createPaymentMutation.isPending}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Bayar Sekarang
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChangePaymentMethod(order)}
              disabled={updatePaymentMethodMutation.isPending}
            >
              Ubah Metode Bayar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cancelOrderMutation.isPending}
                >
                  Batalkan Pesanan
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Konfirmasi Pembatalan
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin membatalkan pesanan{" "}
                    {order.order_number || `ORD-${order.id}`}? Pembatalan ini
                    tidak dapat dibatalkan dan dana akan dikembalikan jika sudah
                    dibayar.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancelOrderMutation.isPending}
                  >
                    Batalkan Pesanan
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      case "processing":
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Use cache first so chat appears instantly
                const cached = getCachedMessages(order.id);
                setChatInitialMessages(cached || null);
                setChatDialog({ open: true, order });
                setTimeout(() => chatInputRef.current?.focus(), 100);

                // Fetch history in background and persist to cache
                apiService
                  .getChatMessages(order.id)
                  .then((res) => {
                    const msgs = res.messages || [];
                    setChatInitialMessages(msgs);
                    setCachedMessages(order.id, msgs);
                  })
                  .catch(() => {
                    setChatInitialMessages([]);
                  });
              }}
            >
              <Phone className="h-4 w-4 mr-1" />
              Hubungi Penjual
            </Button>
          </div>
        );
      case "shipped":
        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" disabled={updateStatusMutation.isPending}>
                Konfirmasi Diterima
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Konfirmasi Penerimaan
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin barang sudah diterima? Ini akan menandai
                  pesanan {order.order_number || `ORD-${order.id}`} sebagai
                  selesai dan memproses pengembalian dana jika ada.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleConfirmReceived(order.id)}
                  disabled={updateStatusMutation.isPending}
                >
                  Konfirmasi Diterima
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      case "delivered":
        return null; // Rating will be shown in CardContent instead
      case "waiting":
        return (
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={() => handlePayNow(order)}
              disabled={createPaymentMutation.isPending}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Bayar Sekarang
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleChangePaymentMethod(order)}
              disabled={updatePaymentMethodMutation.isPending}
            >
              Ubah Metode Bayar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Use cache first for immediate display
                const cached = getCachedMessages(order.id);
                setChatInitialMessages(cached || null);
                setChatDialog({ open: true, order });
                setTimeout(() => chatInputRef.current?.focus(), 100);

                apiService
                  .getChatMessages(order.id)
                  .then((res) => {
                    const msgs = res.messages || [];
                    setChatInitialMessages(msgs);
                    setCachedMessages(order.id, msgs);
                  })
                  .catch(() => setChatInitialMessages([]));
              }}
            >
              <Phone className="h-4 w-4 mr-1" />
              Hubungi Penjual
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cancelOrderMutation.isPending}
                >
                  Batalkan Pesanan
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Konfirmasi Pembatalan
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin membatalkan pesanan{" "}
                    {order.order_number || `ORD-${order.id}`}? Pembatalan ini
                    tidak dapat dibatalkan dan dana akan dikembalikan jika sudah
                    dibayar.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancelOrderMutation.isPending}
                  >
                    Batalkan Pesanan
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      case "cancelled":
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/catalog")}
            >
              Pesan Lagi
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderOrderCard = (order: Order) => (
    <Card
      key={order.id}
      className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => handleViewOrderDetails(order)}
    >
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(order.status)}
              Pesanan{" "}
              {order.order_number ||
                `ORD-${order.id.toString().padStart(4, "0")}`}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(order.created_at).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            {getStatusBadge(order)}
            <div onClick={(e) => e.stopPropagation()}>
              {renderOrderActions(order)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Compact Product Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            {order.orderItems?.map((item: OrderItem) => (
              <div
                key={item.id}
                className="flex items-center gap-3 mb-2 last:mb-0"
              >
                <img
                  src={getImagePath(item.product.image)}
                  alt={item.product.name}
                  className="w-8 h-8 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-product.jpg";
                  }}
                />
                <span className="font-medium text-sm">
                  {item.product.name} × {item.quantity}
                </span>
              </div>
            ))}
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Metode:</span>
              <span className="font-medium ml-1">
                {order.payment_method === "cash_on_delivery"
                  ? "Cash on Delivery"
                  : order.payment_method === "bank_transfer"
                  ? "Transfer Bank"
                  : order.payment_method === "gopay"
                  ? "GoPay"
                  : order.payment_method === "ovo"
                  ? "OVO"
                  : order.payment_method === "dana"
                  ? "DANA"
                  : order.payment_method}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Kurir:</span>
              <span className="font-medium ml-1 uppercase">
                {order.shipping_method}
              </span>
            </div>
          </div>

          {/* Subtotal and Total */}
          <div className="pt-2 border-t space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span>Subtotal:</span>
              <span>
                Rp{" "}
                {formatCurrency(
                  order.orderItems?.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                  ) || 0
                )}
              </span>
            </div>
            <div className="flex justify-between items-center text-lg font-semibold pt-1 border-t">
              <span>💰 Total:</span>
              <span className="text-primary">
                Rp {formatCurrency(order.total_price)}
                {order.voucher_discount && order.voucher_discount > 0 && (
                  <div className="text-sm text-green-600 font-normal">
                    (Diskon: Rp {formatCurrency(order.voucher_discount)})
                  </div>
                )}
              </span>
            </div>
          </div>

          {/* Tracking Button for Shipped Orders */}
          {order.status === "shipped" && (
            <div className="pt-4 border-t">
              <div className="flex flex-col gap-2 items-center">
                <div className="text-sm font-medium">Paket Sedang Dikirim</div>
                <div className="text-xs text-muted-foreground">
                  Lacak status pengiriman Anda
                </div>
                <div>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/tracking/${order.id}`);
                    }}
                  >
                    <Truck className="h-4 w-4 mr-1" />
                    Lacak Pengiriman
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Star Rating for Delivered Orders */}
          {isDelivered(order) &&
            order.orderItems &&
            order.orderItems.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex flex-col gap-2 items-center">
                  <div className="text-sm font-medium">Pesanan Selesai</div>
                  <div className="text-xs text-muted-foreground">
                    Berikan penilaian untuk produk yang Anda terima
                  </div>
                  <div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRating(order);
                      }}
                      disabled={hasUserReviewedOrder(order)}
                    >
                      {hasUserReviewedOrder(order)
                        ? "Sudah Diberi Rating"
                        : "Berikan Rating"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );

  // Reuse the inline OrderChat used on OrderConfirmation page
  function OrderChat({
    orderId,
    inputRef,
    initialMessages,
  }: {
    orderId: number | null;
    inputRef?: React.RefObject<HTMLInputElement>;
    initialMessages?: any[] | null;
  }) {
    const [messages, setMessages] = useState<any[]>(initialMessages || []);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const messagesRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
      try {
        if (messagesRef.current) {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
      } catch (e) {
        // ignore
      }
    };

    const load = async (id: number) => {
      try {
        const res = await apiService.getChatMessages(id);
        const msgs = res.messages || [];
        setMessages(msgs);
        // persist to cache & localStorage for instant open next time
        try {
          queryClient.setQueryData(["chat", id], msgs);
        } catch (e) {}
        try {
          localStorage.setItem(CHAT_CACHE_KEY(id), JSON.stringify(msgs));
        } catch (e) {}
      } catch (e) {
        console.error("Failed to load messages", e);
      }
    };

    useEffect(() => {
      if (!orderId) return;
      // If we have initialMessages provided, show them immediately,
      // and then refresh shortly after to get any missed messages.
      if (!initialMessages) {
        load(orderId as number);
      } else {
        // refresh in background shortly
        const t = setTimeout(() => load(orderId as number), 500);
        // ensure scroll to bottom after render
        setTimeout(scrollToBottom, 100);
        return () => clearTimeout(t);
      }

      const channelName = `order.${orderId}`;
      let echoChannel: any = null;
      if ((window as any).Echo) {
        echoChannel = (window as any).Echo.private(channelName)
          .listen("AdminMessageSent", (e: any) => {
            setMessages((m) => {
              const next = [...m, e];
              // scroll after state update
              setTimeout(scrollToBottom, 50);
              return next;
            });
          })
          .listen("CustomerMessageSent", (e: any) => {
            setMessages((m) => {
              const next = [...m, e];
              setTimeout(scrollToBottom, 50);
              return next;
            });
          });
      }

      const polling = setInterval(() => load(orderId as number), 10000);
      return () => {
        clearInterval(polling);
        if (echoChannel && echoChannel.unsubscribe) echoChannel.unsubscribe();
      };
    }, [orderId]);

    const send = async () => {
      if (!input.trim() || !orderId) return;
      setIsSending(true);
      try {
        const res = await apiService.postChatMessage(
          orderId as number,
          input.trim()
        );
        setMessages((m) => [...m, res.message]);
        setInput("");
        setTimeout(() => {
          // focus back to input and scroll
          inputRef?.current?.focus();
          scrollToBottom();
        }, 50);
      } catch (e) {
        console.error("Failed to send message", e);
      } finally {
        setIsSending(false);
      }
    };

    return (
      <div className="space-y-3">
        <div ref={messagesRef} className="max-h-64 overflow-y-auto space-y-2">
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
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
            placeholder="Tulis pesan..."
            disabled={isSending}
          />
          <Button onClick={send} disabled={isSending}>
            {isSending ? "Mengirim..." : "Kirim"}
          </Button>
        </div>
      </div>
    );
  }

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
            <p>Memuat pesanan...</p>
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
        <section className="gradient-subtle py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold animate-fade-in">
              Pesanan Saya
            </h1>
            <p className="text-xl text-muted-foreground mt-4">
              Kelola dan pantau semua pesanan Anda di sini
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            {!orders || orders.length === 0 ? (
              <div className="text-center py-20 animate-fade-in">
                <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
                <h2 className="text-3xl font-bold mb-4">Belum ada pesanan</h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Anda belum memiliki pesanan. Mulai berbelanja sekarang!
                </p>
                <Button
                  onClick={() => navigate("/catalog")}
                  size="lg"
                  className="gradient-luxury shadow-luxury"
                >
                  Mulai Belanja
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-6 mb-8">
                  <TabsTrigger value="all">Semua</TabsTrigger>
                  <TabsTrigger value="pending">
                    <Clock className="h-4 w-4 mr-1" />
                    Menunggu
                  </TabsTrigger>
                  <TabsTrigger value="processing">
                    <Package className="h-4 w-4 mr-1" />
                    Dikemas
                  </TabsTrigger>
                  <TabsTrigger value="shipped">
                    <Truck className="h-4 w-4 mr-1" />
                    Dikirim
                  </TabsTrigger>
                  <TabsTrigger value="delivered">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Selesai
                  </TabsTrigger>
                  <TabsTrigger value="cancelled">
                    <X className="h-4 w-4 mr-1" />
                    Dibatalkan
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-6">
                  {filterOrdersByStatus("all").map(renderOrderCard)}
                </TabsContent>

                <TabsContent value="pending" className="space-y-6">
                  {filterOrdersByStatus("pending").map(renderOrderCard)}
                </TabsContent>

                <TabsContent value="processing" className="space-y-6">
                  {filterOrdersByStatus("processing").map(renderOrderCard)}
                </TabsContent>

                <TabsContent value="shipped" className="space-y-6">
                  {filterOrdersByStatus("shipped").map(renderOrderCard)}
                </TabsContent>

                <TabsContent value="delivered" className="space-y-6">
                  {filterOrdersByStatus("delivered").map(renderOrderCard)}
                </TabsContent>

                <TabsContent value="cancelled" className="space-y-6">
                  {filterOrdersByStatus("cancelled").map(renderOrderCard)}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </section>
      </main>

      {/* Payment Modal */}
      <Dialog
        open={paymentModal.open}
        onOpenChange={(open) => setPaymentModal({ ...paymentModal, open })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pembayaran Pesanan
            </DialogTitle>
            <DialogDescription>
              {paymentModal.order
                ? `Pesanan: ${
                    paymentModal.order.order_number ||
                    `ORD-${paymentModal.order.id}`
                  } - Total: Rp ${paymentModal.order.total_price.toLocaleString(
                    "id-ID"
                  )}`
                : "Memproses pembayaran..."}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[400px]">
            {createPaymentMutation.isPending ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Mempersiapkan pembayaran...</p>
                </div>
              </div>
            ) : paymentModal.snapToken ? (
              <div className="w-full">
                <div id="snap-container" className="w-full"></div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Memuat gateway pembayaran...
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Method Change Modal */}
      <Dialog
        open={paymentMethodModal.open}
        onOpenChange={(open) =>
          setPaymentMethodModal({ ...paymentMethodModal, open })
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Metode Pembayaran</DialogTitle>
            <DialogDescription>
              {paymentMethodModal.order && (
                <div className="space-y-2">
                  <p>
                    Pesanan:{" "}
                    {paymentMethodModal.order.order_number ||
                      `ORD-${paymentMethodModal.order.id}`}
                  </p>
                  <p>
                    Total: Rp{" "}
                    {paymentMethodModal.order.total_price.toLocaleString(
                      "id-ID"
                    )}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              {[
                {
                  id: "cash_on_delivery",
                  name: "Cash on Delivery",
                  icon: "💰",
                },
                { id: "bank_transfer", name: "Transfer Bank", icon: "🏦" },
                { id: "gopay", name: "GoPay", icon: "📱" },
                { id: "ovo", name: "OVO", icon: "📱" },
                { id: "dana", name: "DANA", icon: "📱" },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleUpdatePaymentMethod(method.id)}
                  disabled={updatePaymentMethodMutation.isPending}
                  className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <span className="text-2xl">{method.icon}</span>
                  <span className="font-medium text-left">{method.name}</span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Details Modal */}
      <Dialog
        open={orderDetailsModal.open}
        onOpenChange={(open) =>
          setOrderDetailsModal({ ...orderDetailsModal, open })
        }
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detail Pesanan
            </DialogTitle>
            <DialogDescription>
              {orderDetailsModal.order ? (
                <div className="space-y-1">
                  <div>
                    {orderDetailsModal.order.order_number ||
                      `ORD-${orderDetailsModal.order.id}`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(
                      orderDetailsModal.order.created_at
                    ).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    pukul{" "}
                    {new Date(
                      orderDetailsModal.order.created_at
                    ).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ) : (
                "Memuat..."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {orderDetailsModal.order ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>{getStatusBadge(orderDetailsModal.order)}</div>
                  <div
                    onClick={() => {
                      /* prevent auto close */
                    }}
                  ></div>
                </div>
                <div className="space-y-3">
                  {orderDetailsModal.order.orderItems?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 border rounded"
                    >
                      <img
                        src={getImagePath(item.product.image)}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Jumlah: {item.quantity}
                        </div>
                      </div>
                      <div className="font-semibold">
                        Rp {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Penerima
                      </div>
                      <div className="font-medium">
                        {orderDetailsModal.order.name}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        No. HP
                      </div>
                      <div className="font-medium">
                        {orderDetailsModal.order.phone}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Alamat Pengiriman
                      </div>
                      <div className="font-medium">
                        {orderDetailsModal.order.shipping_address}
                        {orderDetailsModal.order.city
                          ? `, ${orderDetailsModal.order.city}`
                          : ""}
                        {orderDetailsModal.order.postal_code
                          ? `, ${orderDetailsModal.order.postal_code}`
                          : ""}
                      </div>
                      {orderDetailsModal.order.notes && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Catatan: {orderDetailsModal.order.notes}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">
                          Kurir
                        </div>
                        <div className="font-medium uppercase">
                          {orderDetailsModal.order.shipping_method}
                        </div>
                      </div>
                      <div className="flex justify-between mt-2">
                        <div className="text-sm text-muted-foreground">
                          Metode Pembayaran
                        </div>
                        <div className="font-medium">
                          {orderDetailsModal.order.payment_method}
                        </div>
                      </div>

                      <div className="mt-4 border-t pt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <div className="text-muted-foreground">Subtotal</div>
                          <div className="font-medium">
                            Rp{" "}
                            {formatCurrency(
                              orderDetailsModal.order.orderItems?.reduce(
                                (sum, item) => sum + item.price * item.quantity,
                                0
                              ) || 0
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <div className="text-muted-foreground">
                            Ongkos Kirim
                          </div>
                          <div className="font-medium">Gratis</div>
                        </div>
                        {orderDetailsModal.order.voucher_discount &&
                          orderDetailsModal.order.voucher_discount > 0 && (
                            <div className="flex justify-between text-green-700">
                              <div className="text-muted-foreground">
                                Voucher Diskon
                              </div>
                              <div className="font-medium">
                                - Rp{" "}
                                {formatCurrency(
                                  orderDetailsModal.order.voucher_discount
                                )}
                              </div>
                            </div>
                          )}
                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                          <div>Total</div>
                          <div className="text-primary">
                            Rp{" "}
                            {formatCurrency(
                              orderDetailsModal.order.total_price
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Hubungi Penjual button (opens chat dialog) */}
                <div className="pt-6">
                  <div className="flex justify-end">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        // open chat dialog and set order
                        setChatDialog({
                          open: true,
                          order: orderDetailsModal.order,
                        });
                        // focus chat input after small delay
                        setTimeout(() => chatInputRef.current?.focus(), 100);
                      }}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Hubungi Penjual
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">Memuat detail pesanan...</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog (separate from order details) */}
      <Dialog
        open={chatDialog.open}
        onOpenChange={(open) => {
          setChatDialog({ ...chatDialog, open });
          if (!open) setChatInitialMessages(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chat dengan Penjual</DialogTitle>
            <DialogDescription>
              {chatDialog.order ? (
                <div>
                  Pesanan:{" "}
                  {chatDialog.order.order_number ||
                    `ORD-${chatDialog.order.id}`}
                </div>
              ) : (
                "Memuat..."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4">
            {chatDialog.order ? (
              <Card>
                <CardHeader>
                  <CardTitle>Percakapan</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderChat
                    orderId={chatDialog.order.id}
                    inputRef={chatInputRef}
                    initialMessages={chatInitialMessages}
                  />
                </CardContent>
              </Card>
            ) : (
              <div>Memuat...</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating Modal for delivered orders */}
      <Dialog
        open={ratingModal.open}
        onOpenChange={(open) => setRatingModal({ ...ratingModal, open })}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Berikan Rating</DialogTitle>
            <DialogDescription>
              {ratingModal.order
                ? `Pesanan: ${
                    ratingModal.order.order_number ||
                    `ORD-${ratingModal.order.id}`
                  }`
                : "Pilih produk untuk diberi rating"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {ratingModal.order?.orderItems?.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 border rounded"
              >
                <img
                  src={getImagePath(item.product.image)}
                  alt={item.product.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="font-medium">{item.product.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Jumlah: {item.quantity}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const selected =
                        (ratingModal.ratings || {})[item.product_id] === s;
                      const filled =
                        (ratingModal.ratings || {})[item.product_id] >= s;
                      return (
                        <button
                          key={s}
                          onClick={() => handleSelectRating(item.product_id, s)}
                          className={`transition-colors ${
                            filled
                              ? "text-yellow-400"
                              : "text-gray-300 hover:text-yellow-400"
                          } ${selected ? "scale-110" : ""}`}
                        >
                          <Star className="h-5 w-5 fill-current" />
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <Label
                      htmlFor={`comment-${item.product_id}`}
                      className="text-sm font-medium"
                    >
                      Ulasan (Opsional)
                    </Label>
                    <Textarea
                      id={`comment-${item.product_id}`}
                      value={
                        (ratingModal.comments || {})[item.product_id] || ""
                      }
                      onChange={(e) =>
                        handleCommentChange(item.product_id, e.target.value)
                      }
                      placeholder="Bagikan pengalaman Anda dengan produk ini..."
                      className="mt-1"
                      rows={3}
                      maxLength={1000}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {(ratingModal.comments || {})[item.product_id]?.length ||
                        0}
                      /1000 karakter
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setRatingModal({
                    open: false,
                    order: null,
                    ratings: {},
                    comments: {},
                  })
                }
              >
                Batal
              </Button>
              <Button
                onClick={handleSubmitRatings}
                disabled={submitReviewMutation.isPending}
              >
                Kirim Rating
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
