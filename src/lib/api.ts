// src/lib/api.ts
export const API_URL = "https://nuraoud.rf.gd/api";


class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem("auth_token");
    }
    return this.token;
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    // NOTE: API_BASE_URL doesn't exist in this file — use exported `API_URL`.
    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    };

    if (this.getToken()) {
      headers["Authorization"] = `Bearer ${this.getToken()}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "An error occurred" }));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  // Auth methods
  async login(credentials: { email: string; password: string }) {
    const response = await this.request("/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    // Backend returns `access_token` (Laravel Sanctum/personal token). Accept
    // both `access_token` and legacy `token` keys.
    const token =
      response.access_token ??
      response.token ??
      response?.token ??
      response?.access_token;
    if (token) {
      this.setToken(token);
    }
    return response;
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) {
    const response = await this.request("/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    const token =
      response.access_token ??
      response.token ??
      response?.token ??
      response?.access_token;
    if (token) {
      this.setToken(token);
    }
    return response;
  }

  async logout() {
    const response = await this.request("/logout", {
      method: "POST",
    });
    this.removeToken();
    return response;
  }

  async getUser() {
    return this.request("/user");
  }

  async updateUser(userData: {
    name?: string;
    email?: string;
    password?: string;
    password_confirmation?: string;
  }) {
    return this.request("/user", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  // Cart methods
  async getCart() {
    return this.request("/cart");
  }

  async addToCart(productId: number, quantity: number = 1) {
    const response = await this.request("/cart/add", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, quantity: quantity }),
    });
    return response;
  }

  async updateCartItem(cartItemId: number, quantity: number) {
    return this.request(`/cart/items/${cartItemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
  }

  async removeCartItem(cartItemId: number) {
    return this.request(`/cart/items/${cartItemId}`, {
      method: "DELETE",
    });
  }

  async clearCart() {
    return this.request("/cart/clear", {
      method: "DELETE",
    });
  }

  // Product methods
  async getProducts() {
    return this.request("/products");
  }

  async getProduct(id: number) {
    return this.request(`/products/${id}`);
  }

  // Order methods
  async getOrders() {
    return this.request("/orders");
  }

  async getOrder(id: number) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(data: {
    name: string;
    phone: string;
    shipping_address: string;
    city: string;
    postal_code: string;
    shipping_method: string;
    payment_method: string;
    notes?: string;
    voucher_code?: string;
  }) {
    return this.request("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async cancelOrder(orderId: number) {
    return this.request(`/orders/${orderId}/cancel`, {
      method: "POST",
    });
  }

  async updateOrderStatus(orderId: number, status: string) {
    return this.request(`/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async updatePaymentMethod(orderId: number, paymentMethod: string) {
    return this.request(`/orders/${orderId}/payment-method`, {
      method: "PUT",
      body: JSON.stringify({ payment_method: paymentMethod }),
    });
  }

  async createPayment(
    orderId: number,
    options: { enabled_payments?: string[]; simulate?: boolean } = {}
  ) {
    // If simulate is requested, include it as a query param so backend
    // can enable a broader set of sandbox payment methods.
    const query = options.simulate ? "?simulate=1" : "";
    // Don't send the simulate flag in the JSON body; backend reads it from query
    const body = { ...options } as any;
    if (body.simulate !== undefined) delete body.simulate;

    return this.request(`/orders/${orderId}/payment${query}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async confirmPayment(
    orderId: number,
    payload: {
      transaction_status: string;
      status_code?: string;
      gross_amount?: number;
    }
  ) {
    return this.request(`/orders/${orderId}/confirm-payment`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Chat methods (order specific)
  async getChatMessages(orderId: number) {
    return this.request(`/orders/${orderId}/chat`);
  }

  async postChatMessage(orderId: number, message: string) {
    return this.request(`/orders/${orderId}/chat`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  // Review methods
  async submitReviews(
    orderId: number,
    reviews: Array<{ product_id: number; rating: number; comment?: string }>
  ) {
    return this.request(`/orders/${orderId}/reviews`, {
      method: "POST",
      body: JSON.stringify({ reviews }),
    });
  }

  async getOrderReviews(orderId: number) {
    return this.request(`/orders/${orderId}/reviews`);
  }

  async getProductReviews(productId: number) {
    return this.request(`/products/${productId}/reviews`);
  }

  // Voucher methods
  async applyVoucher(code: string, subtotal: number) {
    return this.request("/vouchers/apply", {
      method: "POST",
      body: JSON.stringify({ code, subtotal }),
    });
  }

  // General chat methods (for product inquiries)
  async getGeneralChatMessages() {
    return this.request("/chat");
  }

  async postGeneralChatMessage(message: string) {
    return this.request("/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  // Tracking methods
  async getTracking(trackingNumber: string) {
    return this.request(`/tracking/${trackingNumber}`);
  }

  async getOrderTracking(orderId: number) {
    return this.request(`/orders/${orderId}/tracking`);
  }
}

export const apiService = new ApiService();
