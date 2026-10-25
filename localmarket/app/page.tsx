"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  RegistrationModal,
  UserProfile,
} from "@/app/components/RegistrationModal";
import { PaymentView } from "@/app/components/PaymentView";
import {
  OrderConfirmationView,
  ConfirmedOrderInfo,
} from "@/app/components/OrderConfirmationView";

type ProductItem = {
  id: number;
  product: string;
  shop: string;
  category: string;
  brand: string;
  unit: string;
  price: number;
  distance: string;
  available: boolean;
  shopId?: number;
};

type ShopDetails = {
  id: number;
  name: string;
  address: string;
  hours: string;
  rating: string;
  phone: string;
};

type SupabaseProduct = {
  id: number;
  name: string;
  category: string;
  brand: string | null;
  unit: string | null;
  price: number;
  distance: string | null;
  available: boolean | null;
  shop_id: number;
};

type SupabaseShop = {
  id: number;
  name: string;
  address: string | null;
  hours: string | null;
  rating: number | null;
  phone: string | null;
};

type CartItem = {
  id: number;
  product: string;
  shop: string;
  brand: string;
  unit: string;
  price: number;
  quantity: number;
};

const OFFER_QUANTITY = 3;
const OFFER_DISCOUNT = 0.1;

/*
 * CATEGORY ICONS
 * These are still used for category buttons and small UI elements.
 * They are NOT used as product-image fallbacks.
 */
const categoryIcons: Record<string, string> = {
  All: "✨",
  Grocery: "🛒",
  "Dairy & Eggs": "🥛",
  Fruits: "🍎",
  Vegetables: "🥦",
  "Baby Care": "👶",
  Personal: "🧴",
  "Personal Care": "🧴",
  Household: "🏠",
  "Snacks & Biscuits": "🍪",
  Beverages: "🥤",
  Bakery: "🍞",
  "Masala & Spices": "🌶️",
  Medical: "💊",
  Clothing: "👕",
  "Hardware & Electrical": "🔨",
  Hardware: "🔧",
  "Pet Care": "🐶",
};

function getCategoryIcon(category: string) {
  return categoryIcons[category] || "🛍️";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");
  const [selectedShop, setSelectedShop] =
    useState<string | null>(null);
  const [availableOnly, setAvailableOnly] =
    useState(false);

  const [databaseProducts, setDatabaseProducts] =
    useState<ProductItem[]>([]);

  const [databaseShops, setDatabaseShops] =
    useState<ShopDetails[]>([]);

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [showCart, setShowCart] =
    useState(false);

  const [addedProductId, setAddedProductId] =
    useState<number | null>(null);

  const [lastAddedProduct, setLastAddedProduct] =
    useState("");

  const [showAddToast, setShowAddToast] =
    useState(false);

  const addFeedbackTimer = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  const [showCheckout, setShowCheckout] =
    useState(false);

  const [checkoutStep, setCheckoutStep] =
    useState<"details" | "payment">("details");

  const [orderPlaced, setOrderPlaced] =
    useState(false);

  const [confirmedOrder, setConfirmedOrder] =
    useState<ConfirmedOrderInfo | null>(null);

  const [customerName, setCustomerName] =
    useState("");

  const [customerPhone, setCustomerPhone] =
    useState("");

  const [customerAddress, setCustomerAddress] =
    useState("");

  const [registeredUser, setRegisteredUser] =
    useState<UserProfile | null>(null);

  const [showRegistration, setShowRegistration] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [databaseError, setDatabaseError] =
    useState("");

  const isCartInitialized = useRef(false);

  useEffect(() => {
    let ignore = false;

    async function loadProductsFromSupabase() {
      const {
        data: shopData,
        error: shopError,
      } = await supabase
        .from("shops")
        .select(
          "id, name, address, hours, rating, phone"
        )
        .order("id", {
          ascending: true,
        });

      if (ignore) return;

      if (shopError) {
        console.error(
          "Shop loading error:",
          shopError
        );

        setDatabaseError(
          shopError.message
        );

        setDatabaseShops([]);
        setDatabaseProducts([]);
        setLoading(false);

        return;
      }

      const {
        data: productData,
        error: productError,
      } = await supabase
        .from("products")
        .select(
          "id, name, category, brand, unit, price, distance, available, shop_id"
        )
        .order("id", {
          ascending: true,
        })
        .range(0, 9999);

      if (ignore) return;

      if (productError) {
        console.error(
          "Product loading error:",
          productError
        );

        setDatabaseError(
          productError.message
        );

        setDatabaseProducts([]);
        setLoading(false);

        return;
      }

      const shops =
        (shopData || []) as SupabaseShop[];

      const dbProducts =
        (productData || []) as SupabaseProduct[];

      const convertedShops: ShopDetails[] =
        shops.map((shop) => ({
          id: shop.id,
          name: shop.name,
          address:
            shop.address ||
            "Justice Market",
          hours:
            shop.hours ||
            "Hours not available",
          rating:
            shop.rating !== null &&
            shop.rating !== undefined
              ? String(shop.rating)
              : "Not rated",
          phone:
            shop.phone ||
            "Phone not available",
        }));

      setDatabaseShops(
        convertedShops
      );

      const shopMap =
        new Map<number, string>();

      shops.forEach((shop) => {
        shopMap.set(
          shop.id,
          shop.name
        );
      });

      const convertedProducts: ProductItem[] =
        dbProducts.map((item) => ({
          id: item.id,
          product: item.name,
          shop:
            shopMap.get(
              item.shop_id
            ) || "Unknown Shop",
          category: item.category,
          brand: item.brand || "",
          unit: item.unit || "",
          price: Number(item.price),
          distance:
            item.distance ||
            "Distance unavailable",
          available:
            item.available === null ||
            item.available === undefined
              ? false
              : item.available,
          shopId: item.shop_id,
        }));

      setDatabaseProducts(
        convertedProducts
      );

      setLoading(false);
    }

    loadProductsFromSupabase();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    try {
      const savedUser =
        localStorage.getItem(
          "localmarket-registered-user"
        );

      if (savedUser) {
        const parsed: UserProfile =
          JSON.parse(savedUser);
        queueMicrotask(() => {
          setRegisteredUser(parsed);
          if (parsed.name) {
            setCustomerName(parsed.name);
          }
          if (parsed.phone) {
            setCustomerPhone(parsed.phone);
          }
          if (parsed.address) {
            setCustomerAddress(parsed.address);
          }
        });
      }
    } catch (e) {
      console.error("Error reading saved user:", e);
    }
  }, []);

  async function handleSaveRegistration(
    profile: UserProfile
  ) {
    setRegisteredUser(profile);
    setCustomerName(profile.name);
    setCustomerPhone(profile.phone);
    setCustomerAddress(profile.address);

    localStorage.setItem(
      "localmarket-registered-user",
      JSON.stringify(profile)
    );

    try {
      const { error } = await supabase
        .from("registrations")
        .insert({
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
        });

      if (error) {
        console.log(
          "Supabase registrations table note:",
          error.message
        );
      }
    } catch (err) {
      console.log(
        "Supabase registrations sync notice:",
        err
      );
    }
  }

  function handleClearRegistration() {
    setRegisteredUser(null);
    localStorage.removeItem(
      "localmarket-registered-user"
    );
  }

  useEffect(() => {
    try {
      const savedCart =
        localStorage.getItem(
          "localmarket-cart"
        );

      if (savedCart) {
        const parsed: CartItem[] =
          JSON.parse(savedCart);
        queueMicrotask(() => {
          setCart(parsed);
          isCartInitialized.current = true;
        });
      } else {
        isCartInitialized.current = true;
      }
    } catch {
      localStorage.removeItem(
        "localmarket-cart"
      );
      isCartInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (!isCartInitialized.current) {
      return;
    }
    localStorage.setItem(
      "localmarket-cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  const categories = useMemo(() => {
    const categorySet =
      new Set<string>();

    databaseProducts.forEach(
      (item) => {
        if (item.category) {
          categorySet.add(
            item.category
          );
        }
      }
    );

    return [
      {
        name: "All",
        icon: categoryIcons.All,
      },

      ...Array.from(categorySet)
        .sort()
        .map((category) => ({
          name: category,
          icon:
            categoryIcons[
              category
            ] || "🛍️",
        })),
    ];
  }, [databaseProducts]);

  const bestPrices = useMemo(() => {
    const priceMap =
      new Map<string, number>();

    databaseProducts.forEach(
      (item) => {
        if (!item.available) {
          return;
        }

        const productName =
          item.product
            .toLowerCase()
            .trim();

        const currentBestPrice =
          priceMap.get(
            productName
          );

        if (
          currentBestPrice ===
            undefined ||
          item.price <
            currentBestPrice
        ) {
          priceMap.set(
            productName,
            item.price
          );
        }
      }
    );

    return priceMap;
  }, [databaseProducts]);

  const productCounts = useMemo(() => {
    const countMap =
      new Map<string, number>();

    databaseProducts.forEach(
      (item) => {
        if (!item.available) {
          return;
        }

        const productName =
          item.product
            .toLowerCase()
            .trim();

        countMap.set(
          productName,
          (countMap.get(
            productName
          ) || 0) + 1
        );
      }
    );

    return countMap;
  }, [databaseProducts]);

  const filteredProducts = useMemo(() => {
    const searchText =
      search.toLowerCase().trim();

    return databaseProducts.filter(
      (item) => {
        const matchesSearch =
          searchText === "" ||
          item.product
            .toLowerCase()
            .includes(searchText) ||
          item.shop
            .toLowerCase()
            .includes(searchText) ||
          item.category
            .toLowerCase()
            .includes(searchText) ||
          item.brand
            .toLowerCase()
            .includes(searchText);

        const matchesCategory =
          selectedCategory ===
            "All" ||
          item.category ===
            selectedCategory;

        const matchesAvailability =
          !availableOnly ||
          item.available;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesAvailability
        );
      }
    );
  }, [
    databaseProducts,
    search,
    selectedCategory,
    availableOnly,
  ]);

  const selectedShopProducts =
    selectedShop
      ? databaseProducts.filter(
          (item) => {
            const belongsToShop =
              item.shop ===
              selectedShop;

            const matchesAvailability =
              !availableOnly ||
              item.available;

            return (
              belongsToShop &&
              matchesAvailability
            );
          }
        )
      : [];

  const cartCount = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        item.price *
          item.quantity,
      0
    );
  }, [cart]);

  const cartDiscount = useMemo(() => {
    return cart.reduce(
      (total, item) => {
        if (
          item.quantity >=
          OFFER_QUANTITY
        ) {
          return (
            total +
            item.price *
              item.quantity *
              OFFER_DISCOUNT
          );
        }

        return total;
      },
      0
    );
  }, [cart]);

  const cartTotal =
    cartSubtotal - cartDiscount;

  function isBestPrice(
    item: ProductItem
  ) {
    const productName =
      item.product
        .toLowerCase()
        .trim();

    const bestPrice =
      bestPrices.get(productName);

    const numberOfShops =
      productCounts.get(
        productName
      ) || 0;

    return (
      item.available &&
      bestPrice !== undefined &&
      numberOfShops > 1 &&
      item.price === bestPrice
    );
  }

  function addToCart(
    item: ProductItem
  ) {
    if (!item.available) {
      alert(
        "This product is currently out of stock."
      );

      return;
    }

    setCart((currentCart) => {
      const existingItem =
        currentCart.find(
          (cartItem) =>
            cartItem.id === item.id
        );

      if (existingItem) {
        return currentCart.map(
          (cartItem) =>
            cartItem.id ===
            item.id
              ? {
                  ...cartItem,
                  quantity:
                    cartItem.quantity +
                    1,
                }
              : cartItem
        );
      }

      return [
        ...currentCart,
        {
          id: item.id,
          product: item.product,
          shop: item.shop,
          brand: item.brand,
          unit: item.unit,
          price: item.price,
          quantity: 1,
        },
      ];
    });

    setAddedProductId(item.id);
    setLastAddedProduct(item.product);
    setShowAddToast(true);

    if (addFeedbackTimer.current) {
      clearTimeout(addFeedbackTimer.current);
    }

    addFeedbackTimer.current =
      setTimeout(() => {
        setAddedProductId(null);
        setShowAddToast(false);
      }, 2500);
  }

  function increaseQuantity(
    id: number
  ) {
    setCart((currentCart) =>
      currentCart.map(
        (item) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
      )
    );
  }

  function decreaseQuantity(
    id: number
  ) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  }

  function removeFromCart(
    id: number
  ) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.id !== id
      )
    );
  }

  async function testSupabase() {
    const { error } =
      await supabase
        .from("shops")
        .select("*")
        .limit(1);

    if (error) {
      alert(
        `Supabase connection works, but the shops table is not ready yet.\n\n${error.message}`
      );

      return;
    }

    alert(
      "Supabase connection is working!"
    );
  }

  function handleProceedToPayment() {
    if (!customerName.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!customerPhone.trim()) {
      alert("Please enter your phone number.");
      return;
    }

    if (customerPhone.trim().length < 7) {
      alert("Please enter a valid phone number (at least 7 digits).");
      return;
    }

    if (!customerAddress.trim()) {
      alert("Please enter your delivery address.");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setCheckoutStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleConfirmOrderWithPayment(paymentInfo: {
    method: string;
    transactionId: string;
    paidAt: string;
  }) {
    const orderId = `LM-${Date.now().toString().slice(-6)}`;

    const { error } = await supabase.from("orders").insert({
      customer_name: customerName.trim(),
      phone: customerPhone.trim(),
      address: `${customerAddress.trim()} [Payment: ${paymentInfo.method}]`,
      total: Number(cartTotal.toFixed(2)),
    });

    if (error) {
      console.error("Order save error:", error);
      alert(
        `Your order could not be saved. Please try again.\n\n${error.message}`
      );
      return;
    }

    const orderDetails: ConfirmedOrderInfo = {
      orderId,
      transactionId: paymentInfo.transactionId,
      paymentMethod: paymentInfo.method,
      paidAt: paymentInfo.paidAt,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      items: [...cart],
      subtotal: cartSubtotal,
      discount: cartDiscount,
      total: cartTotal,
    };

    setConfirmedOrder(orderDetails);
    setOrderPlaced(true);
    setCart([]);

    if (!registeredUser) {
      const autoProfile: UserProfile = {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: customerAddress.trim(),
        savedAt: new Date().toISOString(),
      };
      setRegisteredUser(autoProfile);
      localStorage.setItem(
        "localmarket-registered-user",
        JSON.stringify(autoProfile)
      );
    }
  }

  const placeOrder = handleProceedToPayment;

  /*
   * CHECKOUT
   */
  if (showCheckout) {
    if (orderPlaced && confirmedOrder) {
      return (
        <main className="min-h-screen overflow-hidden bg-[#f3f7f1] text-gray-900">
          <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06150e]/95 text-white shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                  Local<span className="text-lime-400">Market</span>
                </h1>
                <p className="text-xs text-green-200">Order Confirmation & Receipt</p>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <RegistrationButton
                  user={registeredUser}
                  onClick={() => setShowRegistration(true)}
                />
                <div className="rounded-full border border-lime-300/20 bg-lime-400/10 px-4 py-2 text-sm font-black text-lime-300">
                  🔒 SECURE
                </div>
              </div>
            </div>
          </header>

          <RegistrationModal
            isOpen={showRegistration}
            onClose={() => setShowRegistration(false)}
            user={registeredUser}
            onSave={handleSaveRegistration}
            onClear={handleClearRegistration}
          />

          <div className="px-4 py-8 md:py-12">
            <OrderConfirmationView
              order={confirmedOrder}
              onContinueShopping={() => {
                setOrderPlaced(false);
                setConfirmedOrder(null);
                setCheckoutStep("details");
                setShowCheckout(false);
                setShowCart(false);
              }}
            />
          </div>
        </main>
      );
    }

    if (checkoutStep === "payment") {
      return (
        <main className="min-h-screen overflow-hidden bg-[#f3f7f1] text-gray-900">
          <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06150e]/95 text-white shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                  Local<span className="text-lime-400">Market</span>
                </h1>
                <p className="text-xs text-green-200">Secure Payment</p>
              </div>

              <div className="flex items-center gap-2 md:gap-3">
                <RegistrationButton
                  user={registeredUser}
                  onClick={() => setShowRegistration(true)}
                />
                <div className="rounded-full border border-lime-300/20 bg-lime-400/10 px-4 py-2 text-sm font-black text-lime-300">
                  🔒 SECURE
                </div>
              </div>
            </div>
          </header>

          <RegistrationModal
            isOpen={showRegistration}
            onClose={() => setShowRegistration(false)}
            user={registeredUser}
            onSave={handleSaveRegistration}
            onClear={handleClearRegistration}
          />

          <PaymentView
            cart={cart}
            cartSubtotal={cartSubtotal}
            cartDiscount={cartDiscount}
            cartTotal={cartTotal}
            customerName={customerName}
            customerPhone={customerPhone}
            customerAddress={customerAddress}
            onBackToDetails={() => {
              setCheckoutStep("details");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onConfirmOrder={handleConfirmOrderWithPayment}
          />
        </main>
      );
    }

    return (
      <main className="min-h-screen overflow-hidden bg-[#f3f7f1] text-gray-900">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06150e]/95 text-white shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                Local
                <span className="text-lime-400">
                  Market
                </span>
              </h1>

              <p className="text-xs text-green-200">
                Secure checkout • Step 1: Delivery Details
              </p>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <RegistrationButton
                user={registeredUser}
                onClick={() =>
                  setShowRegistration(true)
                }
              />

              <div className="rounded-full border border-lime-300/20 bg-lime-400/10 px-4 py-2 text-sm font-black text-lime-300">
                🔒 SECURE
              </div>
            </div>
          </div>
        </header>

        <RegistrationModal
          isOpen={showRegistration}
          onClose={() =>
            setShowRegistration(false)
          }
          user={registeredUser}
          onSave={handleSaveRegistration}
          onClear={handleClearRegistration}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-8 md:py-12">
          <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-lime-300/20 blur-3xl" />

          <div className="pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-green-300/20 blur-3xl" />

          <button
            onClick={() => {
              setShowCheckout(false);
              setCheckoutStep("details");
            }}
            className="mb-7 rounded-2xl border border-gray-200 bg-white px-5 py-3 font-black text-gray-700 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            ← Back to cart
          </button>

              <div className="mb-9">
                <p className="font-black uppercase tracking-[0.25em] text-green-600">
                  Final step
                </p>

                <h2 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">
                  Checkout
                </h2>

                <p className="mt-3 text-gray-500">
                  Just a few details and your
                  order is ready.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-[2rem] border border-white bg-white p-6 shadow-xl shadow-green-950/5 md:p-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-2xl">
                      👤
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-green-600">
                        Customer
                      </p>

                      <h3 className="text-2xl font-black">
                        Your Details
                      </h3>
                    </div>
                  </div>

                  {registeredUser ? (
                    <div className="mt-6 flex items-center justify-between rounded-2xl border border-lime-400/30 bg-lime-50 p-4 text-xs font-bold text-green-800">
                      <div className="flex items-center gap-2">
                        <span>✨</span>
                        <span>Pre-filled from registered profile ({registeredUser.name})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRegistration(true)}
                        className="rounded-xl bg-green-700 px-3 py-1.5 text-white transition hover:bg-green-800"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6 flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs font-bold text-gray-700">
                      <span>💡 Want faster checkout next time?</span>
                      <button
                        type="button"
                        onClick={() => setShowRegistration(true)}
                        className="rounded-xl bg-lime-400 px-3 py-1.5 font-black text-[#06150e] transition hover:bg-lime-300"
                      >
                        Register Now
                      </button>
                    </div>
                  )}

                  <div className="mt-8 space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-black text-gray-700">
                        Full Name
                      </label>

                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) =>
                          setCustomerName(
                            e.target.value
                          )
                        }
                        autoComplete="name"
                        placeholder="Enter your name"
                        spellCheck={false}
                        className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-4 text-base font-medium text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                        style={{
                          WebkitTextFillColor:
                            "#111827",
                        }}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-gray-700">
                        Phone Number
                      </label>

                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) =>
                          setCustomerPhone(
                            e.target.value
                          )
                        }
                        autoComplete="tel"
                        placeholder="Enter phone number"
                        inputMode="tel"
                        className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-4 text-base font-medium text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                        style={{
                          WebkitTextFillColor:
                            "#111827",
                        }}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-gray-700">
                        Delivery Address
                      </label>

                      <textarea
                        value={customerAddress}
                        onChange={(e) =>
                          setCustomerAddress(
                            e.target.value
                          )
                        }
                        autoComplete="street-address"
                        placeholder="Enter delivery address"
                        rows={4}
                        className="w-full resize-none rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-4 text-base font-medium text-gray-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                        style={{
                          WebkitTextFillColor:
                            "#111827",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="relative h-fit overflow-hidden rounded-[2rem] bg-[#06150e] p-6 text-white shadow-2xl md:p-8">
                  <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-lime-400/10 blur-3xl" />

                  <div className="relative">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400 text-2xl">
                        🛒
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-lime-300">
                          Your basket
                        </p>

                        <h3 className="text-2xl font-black">
                          Order Summary
                        </h3>
                      </div>
                    </div>

                    <div className="mt-7 space-y-3">
                      {cart.map((item) => {
                        const itemSubtotal =
                          item.price *
                          item.quantity;

                        const itemDiscount =
                          item.quantity >=
                          OFFER_QUANTITY
                            ? itemSubtotal *
                              OFFER_DISCOUNT
                            : 0;

                        return (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                          >
                            <div className="flex justify-between gap-4">
                              <div className="min-w-0">
                                <p className="font-black">
                                  {item.product}
                                </p>

                                <p className="mt-1 text-sm text-green-200">
                                  {item.shop}
                                </p>

                                {(item.brand ||
                                  item.unit) && (
                                  <p className="mt-1 text-xs text-green-300">
                                    {item.brand}

                                    {item.brand &&
                                    item.unit
                                      ? " • "
                                      : ""}

                                    {item.unit}
                                  </p>
                                )}

                                <p className="mt-2 text-xs text-green-100">
                                  Quantity:{" "}
                                  {item.quantity}
                                </p>

                                {item.quantity >=
                                  OFFER_QUANTITY && (
                                  <p className="mt-2 text-xs font-black text-lime-300">
                                    🎁 10% quantity
                                    offer
                                  </p>
                                )}
                              </div>

                              <div className="shrink-0 text-right">
                                {itemDiscount >
                                  0 && (
                                  <p className="text-xs text-green-300 line-through">
                                    ₹
                                    {itemSubtotal.toFixed(
                                      2
                                    )}
                                  </p>
                                )}

                                <p className="font-black">
                                  ₹
                                  {(
                                    itemSubtotal -
                                    itemDiscount
                                  ).toFixed(
                                    2
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-7 space-y-3 border-t border-white/10 pt-5">
                      <div className="flex justify-between text-green-200">
                        <span>Subtotal</span>

                        <span className="font-bold text-white">
                          ₹
                          {cartSubtotal.toFixed(
                            2
                          )}
                        </span>
                      </div>

                      {cartDiscount > 0 && (
                        <div className="flex justify-between font-bold text-lime-300">
                          <span>
                            Offer Discount
                          </span>

                          <span>
                            -₹
                            {cartDiscount.toFixed(
                              2
                            )}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between border-t border-white/10 pt-5 text-2xl font-black">
                        <span>Total</span>

                        <span className="text-lime-300">
                          ₹
                          {cartTotal.toFixed(
                            2
                          )}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleProceedToPayment}
                      className="mt-7 w-full rounded-2xl bg-lime-400 px-5 py-4 text-lg font-black text-[#06150e] shadow-[0_10px_30px_rgba(163,230,53,0.2)] transition duration-300 hover:-translate-y-1 hover:bg-lime-300"
                    >
                      Proceed to Payment 💳 →
                    </button>
                  </div>
                </div>
              </div>
            </div>
      </main>
    );
  }

  /*
   * CART
   */
  if (showCart) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#f3f7f1] text-gray-900">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06150e]/95 text-white shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                Local
                <span className="text-lime-400">
                  Market
                </span>
              </h1>

              <p className="text-xs text-green-200">
                Your shopping cart
              </p>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <RegistrationButton
                user={registeredUser}
                onClick={() =>
                  setShowRegistration(true)
                }
              />

              <div className="rounded-full bg-lime-400 px-4 py-2 text-sm font-black text-[#06150e] shadow-lg">
                🛒 {cartCount}
              </div>
            </div>
          </div>
        </header>

        <RegistrationModal
          isOpen={showRegistration}
          onClose={() =>
            setShowRegistration(false)
          }
          user={registeredUser}
          onSave={handleSaveRegistration}
          onClear={handleClearRegistration}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-8 md:py-12">
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-lime-300/20 blur-3xl" />

          <button
            onClick={() =>
              setShowCart(false)
            }
            className="relative mb-7 rounded-2xl border border-gray-200 bg-white px-5 py-3 font-black text-gray-700 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            ← Continue Shopping
          </button>

          <div className="relative mb-9">
            <p className="font-black uppercase tracking-[0.25em] text-green-600">
              Your basket
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">
              Cart
            </h2>

            <p className="mt-2 text-gray-500">
              {cartCount} item
              {cartCount !== 1
                ? "s"
                : ""} selected
            </p>
          </div>

          {cart.length === 0 ? (
            <div className="relative mx-auto max-w-3xl rounded-[2.5rem] border border-white bg-white p-12 text-center shadow-2xl md:p-16">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-green-100 text-6xl">
                🛒
              </div>

              <h3 className="mt-7 text-3xl font-black">
                Your cart is empty
              </h3>

              <p className="mt-3 text-gray-500">
                Add something awesome from
                Justice Market.
              </p>

              <button
                onClick={() =>
                  setShowCart(false)
                }
                className="mt-7 rounded-2xl bg-green-600 px-7 py-4 font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-green-700"
              >
                Start Shopping →
              </button>
            </div>
          ) : (
            <div className="relative grid gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {cart.map((item) => {
                  const itemSubtotal =
                    item.price *
                    item.quantity;

                  const itemDiscount =
                    item.quantity >=
                    OFFER_QUANTITY
                      ? itemSubtotal *
                        OFFER_DISCOUNT
                      : 0;

                  return (
                    <div
                      key={item.id}
                      className="rounded-[2rem] border border-white bg-white p-5 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-4">
                          <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-3xl sm:flex">
                            {getCategoryIcon(
                              "Grocery"
                            )}
                          </div>

                          <div>
                            <p className="text-xs font-black uppercase tracking-wider text-green-600">
                              {item.shop}
                            </p>

                            <h3 className="mt-1 text-xl font-black">
                              {item.product}
                            </h3>

                            {(item.brand ||
                              item.unit) && (
                              <p className="mt-1 text-sm text-gray-500">
                                {item.brand}

                                {item.brand &&
                                item.unit
                                  ? " • "
                                  : ""}

                                {item.unit}
                              </p>
                            )}

                            {item.quantity >=
                              OFFER_QUANTITY && (
                              <div className="mt-3 inline-flex rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-green-700">
                                🎁 10% OFF applied
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              decreaseQuantity(
                                item.id
                              )
                            }
                            className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-gray-200 text-xl font-black transition hover:border-green-500 hover:bg-green-50"
                          >
                            −
                          </button>

                          <span className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-gray-100 px-3 font-black">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              increaseQuantity(
                                item.id
                              )
                            }
                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-xl font-black text-white transition hover:bg-green-700"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 flex items-end justify-between border-t border-gray-100 pt-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            ₹{item.price} each
                          </p>

                          {itemDiscount >
                            0 && (
                            <p className="mt-1 text-sm font-bold text-green-600">
                              You save ₹
                              {itemDiscount.toFixed(
                                2
                              )}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          {itemDiscount >
                            0 && (
                            <p className="text-sm text-gray-400 line-through">
                              ₹
                              {itemSubtotal.toFixed(
                                2
                              )}
                            </p>
                          )}

                          <p className="text-2xl font-black">
                            ₹
                            {(
                              itemSubtotal -
                              itemDiscount
                            ).toFixed(2)}
                          </p>

                          <button
                            onClick={() =>
                              removeFromCart(
                                item.id
                              )
                            }
                            className="mt-1 text-xs font-bold text-red-500 hover:text-red-700 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="h-fit rounded-[2rem] bg-[#06150e] p-7 text-white shadow-2xl lg:sticky lg:top-24">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-400 text-2xl">
                    💳
                  </div>

                  <h3 className="text-xl font-black">
                    Bill Details
                  </h3>
                </div>

                <div className="mt-7 space-y-4">
                  <div className="flex justify-between text-green-200">
                    <span>Subtotal</span>

                    <span className="font-bold text-white">
                      ₹
                      {cartSubtotal.toFixed(
                        2
                      )}
                    </span>
                  </div>

                  {cartDiscount > 0 && (
                    <div className="flex justify-between font-bold text-lime-300">
                      <span>
                        Offer Discount
                      </span>

                      <span>
                        -₹
                        {cartDiscount.toFixed(
                          2
                        )}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-white/10 pt-5">
                    <div className="flex justify-between text-2xl font-black">
                      <span>Total</span>

                      <span className="text-lime-300">
                        ₹
                        {cartTotal.toFixed(
                          2
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {cartDiscount > 0 && (
                  <div className="mt-6 rounded-2xl border border-lime-300/10 bg-lime-400/10 p-4 text-sm font-bold text-lime-300">
                    🎉 You saved ₹
                    {cartDiscount.toFixed(
                      2
                    )}{" "}
                    with quantity offers!
                  </div>
                )}

                <button
                  onClick={() => {
                    setCheckoutStep("details");
                    setShowCheckout(true);
                  }}
                  className="mt-6 w-full rounded-2xl bg-lime-400 px-5 py-4 text-lg font-black text-[#06150e] shadow-xl transition hover:-translate-y-1 hover:bg-lime-300"
                >
                  Proceed to Checkout →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  /*
   * SHOP DETAILS
   */
  if (selectedShop) {
    const shop =
      databaseShops.find(
        (item) =>
          item.name === selectedShop
      );

    if (!shop) {
      return (
        <main className="min-h-screen bg-[#f3f7f1]">
          <header className="bg-[#06150e] text-white shadow-xl">
            <div className="mx-auto max-w-7xl px-4 py-5">
              <h1 className="text-2xl font-black">
                Local
                <span className="text-lime-400">
                  Market
                </span>
              </h1>

              <p className="text-sm text-green-200">
                Find products in your local
                market
              </p>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-4 py-8">
            <button
              onClick={() =>
                setSelectedShop(null)
              }
              className="mb-6 rounded-2xl bg-white px-5 py-3 font-black shadow-sm"
            >
              ← Back to products
            </button>

            <div className="rounded-[2rem] bg-white p-10 text-center shadow-xl">
              <div className="text-6xl">
                🏪
              </div>

              <h2 className="mt-5 text-3xl font-black">
                Shop information not found
              </h2>

              <p className="mt-2 text-gray-500">
                This shop could not be loaded
                from the database.
              </p>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen overflow-hidden bg-[#f3f7f1]">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06150e]/95 text-white shadow-xl backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <div>
              <h1 className="text-2xl font-black">
                Local
                <span className="text-lime-400">
                  Market
                </span>
              </h1>

              <p className="text-xs text-green-200">
                Justice Market
              </p>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <RegistrationButton
                user={registeredUser}
                onClick={() =>
                  setShowRegistration(true)
                }
              />

              <button
                onClick={() =>
                  setShowCart(true)
                }
                className="rounded-2xl bg-lime-400 px-4 py-2 font-black text-[#06150e] shadow-lg transition hover:scale-105"
              >
                🛒 Cart ({cartCount})
              </button>
            </div>
          </div>
        </header>

        <RegistrationModal
          isOpen={showRegistration}
          onClose={() =>
            setShowRegistration(false)
          }
          user={registeredUser}
          onSave={handleSaveRegistration}
          onClear={handleClearRegistration}
        />

        <div className="mx-auto max-w-7xl px-4 py-8">
          <button
            onClick={() =>
              setSelectedShop(null)
            }
            className="mb-6 rounded-2xl border border-gray-200 bg-white px-5 py-3 font-black text-gray-700 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            ← Back to products
          </button>

          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#06150e] p-7 text-white shadow-2xl md:p-10">
            <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-lime-400/20 blur-3xl" />

            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-green-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-5 inline-flex rounded-full bg-lime-400 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#06150e]">
                  🏪 Local Shop
                </div>

                <h2 className="text-4xl font-black tracking-tight md:text-6xl">
                  {shop.name}
                </h2>

                <div className="mt-6 space-y-3 text-green-100">
                  <p>
                    📍 {shop.address}
                  </p>

                  <p>
                    🕐 {shop.hours}
                  </p>

                  <p>
                    ⭐ {shop.rating} rating
                  </p>

                  <p>
                    📞 {shop.phone}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:min-w-[230px]">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${shop.name}, ${shop.address}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl bg-lime-400 px-6 py-4 text-center font-black text-[#06150e] shadow-xl transition hover:-translate-y-1 hover:bg-lime-300"
                >
                  📍 Get Directions
                </a>

                <button
                  onClick={
                    testSupabase
                  }
                  className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Test Database
                </button>
              </div>
            </div>
          </div>

          <section className="mt-10">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-black uppercase tracking-[0.2em] text-green-600">
                  Shop collection
                </p>

                <h3 className="mt-1 text-3xl font-black">
                  Products at this shop
                </h3>
              </div>

              <button
                onClick={() =>
                  setAvailableOnly(
                    !availableOnly
                  )
                }
                className={`rounded-2xl px-5 py-3 text-sm font-black transition ${
                  availableOnly
                    ? "bg-green-600 text-white shadow-lg"
                    : "bg-white text-gray-700 shadow-sm"
                }`}
              >
                {availableOnly
                  ? "✓ Available only"
                  : "Show available only"}
              </button>
            </div>

            {selectedShopProducts.length ===
            0 ? (
              <div className="rounded-[2rem] bg-white p-10 text-center shadow-lg">
                <div className="text-5xl">
                  🛍️
                </div>

                <p className="mt-4 font-semibold text-gray-600">
                  {availableOnly
                    ? "No available products found at this shop."
                    : "No products found at this shop."}
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {selectedShopProducts.map(
                  (item) => (
                    <Product
                      key={item.id}
                      item={item}
                      bestPrice={isBestPrice(
                        item
                      )}
                      onAddToCart={() =>
                        addToCart(item)
                      }
                      justAdded={
                        addedProductId ===
                        item.id
                      }
                      onSelectShop={(shop) =>
                        setSelectedShop(shop)
                      }
                    />
                  )
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  /*
   * MAIN HOME PAGE
   */
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f3f7f1] text-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06150e]/95 text-white shadow-2xl backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex min-h-[76px] items-center justify-between gap-4">
            <div className="shrink-0">
              <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                Local
                <span className="text-lime-400">
                  Market
                </span>
              </h1>

              <p className="hidden text-xs text-green-200 sm:block">
                Your neighbourhood
                marketplace
              </p>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold backdrop-blur sm:block">
                📍 Justice Market
              </div>

              <RegistrationButton
                user={registeredUser}
                onClick={() =>
                  setShowRegistration(true)
                }
              />

              <button
                onClick={() =>
                  setShowCart(true)
                }
                className="relative rounded-2xl bg-lime-400 px-4 py-2.5 font-black text-[#06150e] shadow-lg transition hover:scale-105 hover:bg-lime-300"
              >
                🛒

                <span className="hidden sm:inline">
                  {" "}
                  Cart
                </span>

                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-6 min-w-6 animate-pulse items-center justify-center rounded-full bg-white px-1 text-xs font-black text-green-700 shadow">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <RegistrationModal
        isOpen={showRegistration}
        onClose={() =>
          setShowRegistration(false)
        }
        user={registeredUser}
        onSave={handleSaveRegistration}
        onClear={handleClearRegistration}
      />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#06150e] text-white">
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-lime-400/20 blur-3xl" />

        <div className="absolute -right-32 top-0 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="absolute bottom-[-180px] left-[35%] h-[400px] w-[400px] rounded-full bg-green-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 md:pb-24 md:pt-20">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-400/10 px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-lime-300 shadow-lg">
              <span className="animate-pulse">
                ⚡
              </span>

              Shop local. Shop smarter.
            </div>

            <h2 className="text-5xl font-black leading-[0.95] tracking-[-0.04em] md:text-7xl lg:text-8xl">
              Find it.
              <br />

              <span className="text-lime-400">
                Compare it.
              </span>

              <br />

              Get it nearby.
            </h2>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-green-100 md:text-lg">
              Discover products, prices and
              availability from shops around
              Justice Market — all in one
              place.
            </p>

            {/* SEARCH */}
            <div className="mx-auto mt-9 max-w-4xl">
              <div className="rounded-[1.7rem] bg-gradient-to-r from-lime-400 via-green-300 to-emerald-400 p-[2px] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <div className="rounded-[1.6rem] bg-white p-2">
                  <div className="flex items-center">
                    <span className="pl-4 text-2xl">
                      🔎
                    </span>

                    <input
                      type="text"
                      value={search}
                      onChange={(e) =>
                        setSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search milk, rice, diapers, medicine..."
                      spellCheck={false}
                      className="min-w-0 flex-1 bg-transparent px-4 py-4 text-base font-semibold text-gray-900 outline-none placeholder:text-gray-400 md:text-lg"
                    />

                    {search && (
                      <button
                        onClick={() =>
                          setSearch("")
                        }
                        className="mr-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-bold text-gray-500 transition hover:bg-gray-200"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK BENEFITS */}
            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left backdrop-blur">
                <div className="text-2xl">
                  🏪
                </div>

                <p className="mt-2 font-black">
                  Local shops
                </p>

                <p className="text-xs text-green-200">
                  Discover stores nearby
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left backdrop-blur">
                <div className="text-2xl">
                  💰
                </div>

                <p className="mt-2 font-black">
                  Compare prices
                </p>

                <p className="text-xs text-green-200">
                  Find the best local deal
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left backdrop-blur">
                <div className="text-2xl">
                  ⚡
                </div>

                <p className="mt-2 font-black">
                  Live availability
                </p>

                <p className="text-xs text-green-200">
                  Know what&apos;s in stock
                </p>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-3 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
            <div className="p-5 text-center">
              <p className="text-3xl font-black text-lime-400 md:text-4xl">
                {databaseProducts.length ||
                  "500+"}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-green-200">
                Products
              </p>
            </div>

            <div className="border-x border-white/10 p-5 text-center">
              <p className="text-3xl font-black text-lime-400 md:text-4xl">
                {databaseShops.length ||
                  "12"}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-green-200">
                Local Shops
              </p>
            </div>

            <div className="p-5 text-center">
              <p className="text-3xl font-black text-lime-400 md:text-4xl">
                24/7
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-green-200">
                Search
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-9">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="font-black uppercase tracking-[0.2em] text-green-600">
              Explore
            </p>

            <h3 className="mt-1 text-2xl font-black md:text-3xl">
              Shop by category
            </h3>
          </div>

          <span className="hidden rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-500 shadow-sm sm:block">
            {categories.length - 1}{" "}
            categories
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-3">
          {categories.map(
            (category) => (
              <Category
                key={category.name}
                icon={category.icon}
                name={category.name}
                selected={
                  selectedCategory ===
                  category.name
                }
                onClick={() =>
                  setSelectedCategory(
                    category.name
                  )
                }
              />
            )
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <button
            onClick={() =>
              setAvailableOnly(
                !availableOnly
              )
            }
            className={`rounded-full px-5 py-3 font-black transition duration-300 ${
              availableOnly
                ? "bg-green-600 text-white shadow-lg shadow-green-200"
                : "bg-white text-gray-700 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
            }`}
          >
            {availableOnly
              ? "✓ Available products only"
              : "✓ Show available only"}
          </button>

          {(search ||
            selectedCategory !==
              "All" ||
            availableOnly) && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory(
                  "All"
                );
                setAvailableOnly(false);
              }}
              className="rounded-full bg-gray-200 px-5 py-3 font-bold text-gray-600 transition hover:bg-gray-300"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-black uppercase tracking-[0.2em] text-green-600">
              LocalMarket picks
            </p>

            <h3 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
              {search
                ? `Results for "${search}"`
                : selectedCategory ===
                  "All"
                ? "Everything nearby"
                : selectedCategory}
            </h3>
          </div>

          <span className="font-semibold text-gray-500">
            {loading
              ? "Loading products..."
              : `${filteredProducts.length} products found`}
          </span>
        </div>

        {databaseError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-black text-red-700">
              Could not load products from
              Supabase
            </p>

            <p className="mt-1 text-sm text-red-600">
              {databaseError}
            </p>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {[
              1, 2, 3, 4, 5,
              6, 7, 8, 9, 10,
            ].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-[1.75rem] bg-white p-4 shadow-sm"
              >
                <div className="h-48 animate-pulse rounded-2xl bg-gray-200" />

                <div className="mt-4 space-y-3">
                  <div className="h-3 animate-pulse rounded bg-gray-200" />

                  <div className="h-6 animate-pulse rounded bg-gray-200" />

                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />

                  <div className="h-10 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NO PRODUCTS */}
        {!loading &&
          !databaseError &&
          databaseProducts.length ===
            0 && (
            <div className="rounded-[2rem] bg-white p-12 text-center shadow-xl">
              <div className="text-6xl">
                🛍️
              </div>

              <h4 className="mt-5 text-2xl font-black">
                No products available
              </h4>

              <p className="mt-2 text-gray-500">
                There are currently no products
                listed in the database.
              </p>
            </div>
          )}

        {/* NO SEARCH RESULTS */}
        {!loading &&
          !databaseError &&
          databaseProducts.length >
            0 &&
          filteredProducts.length ===
            0 && (
            <div className="rounded-[2rem] bg-white p-12 text-center shadow-xl">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-4xl">
                🔎
              </div>

              <h4 className="mt-5 text-2xl font-black">
                Nothing found
              </h4>

              <p className="mt-2 text-gray-500">
                Try another product, brand,
                category or filter.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory(
                    "All"
                  );
                  setAvailableOnly(false);
                }}
                className="mt-6 rounded-2xl bg-green-600 px-6 py-3 font-black text-white shadow-lg transition hover:-translate-y-1 hover:bg-green-700"
              >
                Clear everything
              </button>
            </div>
          )}

        {/* PRODUCT GRID */}
        {!loading &&
          !databaseError &&
          filteredProducts.length >
            0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {filteredProducts.map(
                (item) => (
                  <Product
                    key={item.id}
                    item={item}
                    bestPrice={isBestPrice(
                      item
                    )}
                    onAddToCart={() =>
                      addToCart(item)
                    }
                    justAdded={
                      addedProductId ===
                      item.id
                    }
                    onSelectShop={(shop) =>
                      setSelectedShop(shop)
                    }
                  />
                )
              )}
            </div>
          )}
      </section>

      {/* MOBILE CART + ADD CONFIRMATION */}
      {cartCount > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-4 right-4 z-[60] flex items-center gap-3 rounded-2xl bg-[#06150e] px-5 py-3.5 text-sm font-black text-white shadow-[0_15px_40px_rgba(6,21,14,0.35)] ring-1 ring-lime-300/20 transition duration-300 hover:scale-105 active:scale-95 sm:hidden"
          aria-label={`Open cart with ${cartCount} item${
            cartCount !== 1 ? "s" : ""
          }`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-400 text-lg text-[#06150e]">
            🛒
          </span>

          <span>
            Cart{" "}
            <span className="text-lime-300">
              ({cartCount})
            </span>
          </span>
        </button>
      )}

      {showAddToast && (
        <div className="pointer-events-none fixed bottom-20 left-4 right-4 z-[70] sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-white px-4 py-3.5 text-gray-900 shadow-[0_18px_50px_rgba(6,21,14,0.2)] ring-1 ring-green-100">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600 text-xl text-white shadow-lg">
              ✓
            </div>

            <div className="min-w-0">
              <p className="text-sm font-black text-green-700">
                Added to cart
              </p>

              <p className="truncate text-xs font-semibold text-gray-500">
                {lastAddedProduct}
              </p>
            </div>

            <button
              onClick={() => {
                setShowAddToast(false);
                setAddedProductId(null);
              }}
              className="pointer-events-auto ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-500 transition hover:bg-gray-200"
              aria-label="Close confirmation"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="relative overflow-hidden bg-[#06150e] text-white">
        <div className="absolute -left-20 bottom-0 h-60 w-60 rounded-full bg-lime-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-12">
          <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-3xl font-black">
                Local
                <span className="text-lime-400">
                  Market
                </span>
              </h3>

              <p className="mt-2 text-sm text-green-200">
                Making local shopping smarter.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-green-200">
              📍 Justice Market
            </div>
          </div>

          <div className="mt-9 border-t border-white/10 pt-6 text-center text-xs text-green-300">
            © 2026 LocalMarket — Justice
            Market
          </div>
        </div>
      </footer>
    </main>
  );
}

/*
 * CATEGORY BUTTON
 */
function Category({
  icon,
  name,
  selected,
  onClick,
}: {
  icon: string;
  name: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group min-w-[125px] rounded-[1.5rem] p-3 text-center transition duration-300 ${
        selected
          ? "scale-[1.03] bg-[#06150e] text-white shadow-xl shadow-green-950/20"
          : "border border-white bg-white text-gray-700 shadow-sm hover:-translate-y-1 hover:shadow-xl"
      }`}
    >
      <div
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-[1.25rem] text-3xl transition duration-300 ${
          selected
            ? "bg-lime-400 shadow-lg"
            : "bg-gray-100 group-hover:bg-green-100"
        }`}
      >
        {icon}
      </div>

      <div className="mt-3 whitespace-nowrap text-sm font-black">
        {name}
      </div>
    </button>
  );
}

/*
 * PRODUCT CARD
 */
function Product({
  item,
  bestPrice,
  onAddToCart,
  justAdded,
  onSelectShop,
}: {
  item: ProductItem;
  bestPrice: boolean;
  onAddToCart: () => void;
  justAdded: boolean;
  onSelectShop?: (shopName: string) => void;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[1.75rem] bg-white shadow-sm transition duration-500 hover:-translate-y-2 hover:shadow-2xl ${
        bestPrice
          ? "ring-2 ring-yellow-400"
          : "border border-white"
      }`}
    >
      {/* PRODUCT STATUS */}
      <div className="flex items-center justify-between gap-2 px-5 pt-5">
        <div className="rounded-full border border-green-100 bg-green-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-green-700">
          {item.category}
        </div>

        <div className="flex items-center gap-2">
          {bestPrice && (
            <div className="rounded-full bg-yellow-400 px-3 py-1.5 text-[10px] font-black text-yellow-950 shadow-lg">
              🏷️ BEST PRICE
            </div>
          )}

          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black ${
              item.available
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-600"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                item.available
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />

            {item.available
              ? "IN STOCK"
              : "OUT"}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5">
        {/* PRODUCT NAME */}
        <h4 className="min-h-[48px] pr-2 text-lg font-black leading-6 text-gray-900">
          {item.product}
        </h4>

        {/* BRAND + UNIT */}
        {(item.brand ||
          item.unit) && (
          <p className="mt-1 min-h-[20px] truncate text-sm font-medium text-gray-500">
            {item.brand}

            {item.brand &&
            item.unit
              ? " • "
              : ""}

            {item.unit}
          </p>
        )}

        {/* SHOP */}
        <button
          onClick={() => {
            if (onSelectShop) {
              onSelectShop(item.shop);
            }
          }}
          className="mt-4 flex w-full items-center gap-2 text-left transition hover:opacity-80"
          title={`View all products from ${item.shop}`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-sm transition group-hover:bg-green-100">
            🏪
          </span>

          <div className="min-w-0">
            <p className="truncate text-xs font-black text-gray-700">
              {item.shop}
            </p>

            <p className="text-[10px] text-gray-400">
              Local seller
            </p>
          </div>
        </button>

        {/* PRICE */}
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-black tracking-tight text-gray-900">
              ₹{item.price}
            </p>

            <p className="mt-1 text-xs font-semibold text-gray-400">
              📍 {item.distance}
            </p>
          </div>

          {/* ADD BUTTON */}
          <button
            onClick={onAddToCart}
            disabled={!item.available}
            className={`rounded-xl px-5 py-2.5 text-sm font-black transition duration-300 active:scale-95 ${
              !item.available
                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                : justAdded
                  ? "bg-green-600 text-white shadow-lg shadow-green-200 ring-2 ring-green-200"
                  : "border-2 border-green-600 bg-white text-green-700 hover:-translate-y-0.5 hover:bg-green-600 hover:text-white hover:shadow-lg"
            }`}
          >
            {!item.available
              ? "OUT"
              : justAdded
                ? "✓ ADDED"
                : "ADD"}
          </button>
        </div>

        {/* AVAILABILITY */}
        <div
          className={`mt-4 rounded-xl px-3 py-2 text-center text-xs font-black ${
            item.available
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {item.available
            ? "✓ Available nearby"
            : "✕ Currently unavailable"}
        </div>
      </div>
    </div>
  );
}

/*
 * REGISTRATION / ACCOUNT BUTTON
 */
function RegistrationButton({
  user,
  onClick,
}: {
  user: UserProfile | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 rounded-2xl border border-lime-400/30 bg-white/10 px-3.5 py-2.5 text-sm font-black text-white shadow-md backdrop-blur transition hover:border-lime-400 hover:bg-white/20 active:scale-95"
      title={user ? `Profile: ${user.name}` : "Click to Register"}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-400 text-xs font-black text-[#06150e]">
        {user ? getInitials(user.name) : "👤"}
      </span>

      <span className="hidden sm:inline">
        {user ? user.name.split(" ")[0] : "Register"}
      </span>

      {user && (
        <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
      )}
    </button>
  );
}
