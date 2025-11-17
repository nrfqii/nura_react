import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
} from "lucide-react";
import { apiService } from "@/lib/api";

interface TrackingLog {
  id: number;
  status: string;
  description: string;
  location: string;
  timestamp: string;
}

interface TrackingData {
  tracking_number: string;
  provider: string;
  current_status: string;
  estimated_delivery: string;
  logs: TrackingLog[];
}

const Tracking = () => {
  const { trackingNumber } = useParams<{ trackingNumber?: string }>();
  const navigate = useNavigate();
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputTrackingNumber, setInputTrackingNumber] = useState(
    trackingNumber || ""
  );

  const fetchTracking = async (param: string) => {
    if (!param.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let data;
      if (/^\d+$/.test(param)) {
        // It's an order ID, use order-specific tracking
        data = await apiService.getOrderTracking(parseInt(param));
      } else {
        // It's a tracking number
        data = await apiService.getTracking(param);
      }
      setTrackingData(data);
    } catch (err) {
      let errorMessage = "Gagal memuat informasi pelacakan";
      if (err instanceof Error) {
        if (err.message.includes("404")) {
          errorMessage = /^\d+$/.test(param)
            ? "Informasi pelacakan pesanan tidak ditemukan. Pesanan mungkin belum dikirim."
            : "Nomor pelacakan tidak ditemukan. Silakan periksa nomor pelacakan Anda.";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trackingNumber) {
      fetchTracking(trackingNumber);
    }
  }, [trackingNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputTrackingNumber.trim()) {
      navigate(`/tracking/${inputTrackingNumber.trim()}`);
    }
  };

  const getStatusIcon = (status: string) => {
    if (!status) return <Package className="h-5 w-5 text-gray-500" />;
    switch (status.toLowerCase()) {
      case "terkirim":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "dalam pengiriman":
        return <Truck className="h-5 w-5 text-blue-500" />;
      case "paket sedang diproses":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status.toLowerCase()) {
      case "terkirim":
        return "bg-green-100 text-green-800";
      case "dalam pengiriman":
        return "bg-blue-100 text-blue-800";
      case "paket sedang diproses":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lacak Paket Anda
          </h1>
          <p className="text-gray-600">
            Masukkan nomor pelacakan untuk melihat pembaruan terbaru
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Informasi Pelacakan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="tracking-number">Nomor Pelacakan</Label>
                <Input
                  id="tracking-number"
                  type="text"
                  placeholder="Masukkan nomor pelacakan"
                  value={inputTrackingNumber}
                  onChange={(e) => setInputTrackingNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Lacak"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Alert className="mb-8">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Memuat informasi pelacakan...</span>
          </div>
        )}

        {trackingData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Detail Paket
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nomor Pelacakan</Label>
                    <p className="font-mono text-lg">
                      {trackingData.tracking_number}
                    </p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(trackingData.current_status)}
                      <Badge
                        className={getStatusColor(trackingData.current_status)}
                      >
                        {trackingData.current_status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Kurir</Label>
                    <p>{trackingData.provider}</p>
                  </div>
                  <div>
                    <Label>Estimasi Pengiriman</Label>
                    <p>
                      {new Date(
                        trackingData.estimated_delivery
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Riwayat Pelacakan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trackingData.logs.map((log, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            index === 0 ? "bg-blue-500" : "bg-gray-300"
                          }`}
                        />
                        {index < trackingData.logs.length - 1 && (
                          <div className="w-px h-12 bg-gray-300 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(log.status)}
                          <Badge
                            variant="outline"
                            className={getStatusColor(log.status)}
                          >
                            {log.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="font-medium">{log.description}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {log.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tracking;
