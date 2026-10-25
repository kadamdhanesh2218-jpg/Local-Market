"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/* ─────────────────── TYPES ─────────────────── */
type Order = {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  total: number;
  created_at: string;
};

type Product = {
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

type Shop = {
  id: number;
  name: string;
  address: string | null;
  hours: string | null;
  rating: number | null;
  phone: string | null;
};

type Registration = {
  id: number;
  name: string;
  phone: string;
  address: string;
  created_at: string;
};

type Tab = "overview" | "orders" | "products" | "shops" | "customers";

/* ─────────────────── MAIN COMPONENT ─────────────────── */
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* search / filter state */
  const [orderSearch, setOrderSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [shopSearch, setShopSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("All");

  /* product editing modal */
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editAvailable, setEditAvailable] = useState(true);
  const [editSaving, setEditSaving] = useState(false);

  /* ─── DATA LOADING ─── */
  const loadData = useCallback(async () => {
    setLoading(true);
    const [ordersRes, productsRes, shopsRes, regRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("id", { ascending: true }).range(0, 9999),
      supabase.from("shops").select("*").order("id", { ascending: true }),
      supabase.from("registrations").select("*").order("created_at", { ascending: false }),
    ]);

    if (ordersRes.data) setOrders(ordersRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    if (shopsRes.data) setShops(shopsRes.data);
    if (regRes.data) setRegistrations(regRes.data);

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ─── DERIVED DATA ─── */
  const shopMap = useMemo(() => {
    const m = new Map<number, string>();
    shops.forEach((s) => m.set(s.id, s.name));
    return m;
  }, [shops]);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + (o.total || 0), 0),
    [orders]
  );

  const todayOrders = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return orders.filter((o) => o.created_at.slice(0, 10) === today);
  }, [orders]);

  const todayRevenue = useMemo(
    () => todayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    [todayOrders]
  );

  const availableProducts = useMemo(
    () => products.filter((p) => p.available !== false),
    [products]
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  /* recent 7 days revenue for sparkline */
  const last7DaysRevenue = useMemo(() => {
    const days: { label: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short" });
      const amount = orders
        .filter((o) => o.created_at.slice(0, 10) === key)
        .reduce((s, o) => s + (o.total || 0), 0);
      days.push({ label: dayLabel, amount });
    }
    return days;
  }, [orders]);

  const maxDayRevenue = Math.max(...last7DaysRevenue.map((d) => d.amount), 1);

  /* filtered lists */
  const filteredOrders = useMemo(() => {
    const q = orderSearch.toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        String(o.id).includes(q)
    );
  }, [orders, orderSearch]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (productCategoryFilter !== "All") {
      list = list.filter((p) => p.category === productCategoryFilter);
    }
    const q = productSearch.toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand || "").toLowerCase().includes(q) ||
          (shopMap.get(p.shop_id) || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, productSearch, productCategoryFilter, shopMap]);

  const filteredShops = useMemo(() => {
    const q = shopSearch.toLowerCase();
    if (!q) return shops;
    return shops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.address || "").toLowerCase().includes(q) ||
        (s.phone || "").includes(q)
    );
  }, [shops, shopSearch]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase();
    if (!q) return registrations;
    return registrations.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.address.toLowerCase().includes(q)
    );
  }, [registrations, customerSearch]);

  /* ─── PRODUCT EDIT HANDLERS ─── */
  function openEditProduct(p: Product) {
    setEditProduct(p);
    setEditName(p.name);
    setEditPrice(String(p.price));
    setEditCategory(p.category);
    setEditBrand(p.brand || "");
    setEditUnit(p.unit || "");
    setEditAvailable(p.available !== false);
  }

  async function handleSaveProduct() {
    if (!editProduct) return;
    setEditSaving(true);
    const { error } = await supabase
      .from("products")
      .update({
        name: editName.trim(),
        price: Number(editPrice),
        category: editCategory.trim(),
        brand: editBrand.trim() || null,
        unit: editUnit.trim() || null,
        available: editAvailable,
      })
      .eq("id", editProduct.id);

    if (error) {
      alert(`Failed to update product: ${error.message}`);
    } else {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editProduct.id
            ? {
                ...p,
                name: editName.trim(),
                price: Number(editPrice),
                category: editCategory.trim(),
                brand: editBrand.trim() || null,
                unit: editUnit.trim() || null,
                available: editAvailable,
              }
            : p
        )
      );
      setEditProduct(null);
    }
    setEditSaving(false);
  }

  async function handleToggleAvailability(p: Product) {
    const newVal = p.available === false ? true : false;
    const { error } = await supabase
      .from("products")
      .update({ available: newVal })
      .eq("id", p.id);

    if (!error) {
      setProducts((prev) =>
        prev.map((pr) => (pr.id === p.id ? { ...pr, available: newVal } : pr))
      );
    }
  }

  async function handleDeleteOrder(id: number) {
    if (!confirm(`Delete order #${id}? This cannot be undone.`)) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } else {
      alert(`Could not delete: ${error.message}`);
    }
  }

  /* ─── HELPERS ─── */
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatCurrency(n: number) {
    return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /* ─── NAV ITEMS ─── */
  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Dashboard", icon: "📊" },
    { id: "orders", label: "Orders", icon: "📦" },
    { id: "products", label: "Products", icon: "🏷️" },
    { id: "shops", label: "Shops", icon: "🏪" },
    { id: "customers", label: "Customers", icon: "👥" },
  ];

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div className="flex h-screen overflow-hidden bg-[#0b1a12] text-white">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#06150e] transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h1 className="text-xl font-black tracking-tight">
              Local<span className="text-lime-400">Market</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-lime-400/80">
              Admin Panel
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                activeTab === item.id
                  ? "bg-lime-400/15 text-lime-300 shadow-lg shadow-lime-400/5"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "orders" && orders.length > 0 && (
                <span className="ml-auto rounded-full bg-lime-400/20 px-2 py-0.5 text-[10px] font-black text-lime-300">
                  {orders.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-white/10 px-4 py-4">
          <a
            href="/"
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-xs font-bold text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            <span>🌐</span>
            <span>View Storefront</span>
          </a>
          <button
            onClick={loadData}
            className="mt-2 flex w-full items-center gap-2 rounded-xl bg-lime-400/10 px-4 py-3 text-xs font-bold text-lime-300 transition hover:bg-lime-400/20"
          >
            <span>🔄</span>
            <span>Refresh All Data</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#06150e]/80 px-4 py-3 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm lg:hidden"
            >
              ☰
            </button>
            <div>
              <h2 className="text-lg font-black capitalize tracking-tight">
                {activeTab === "overview" ? "Dashboard" : activeTab}
              </h2>
              <p className="text-[11px] text-gray-500">
                {loading
                  ? "Loading data..."
                  : `${orders.length} orders • ${products.length} products • ${shops.length} shops`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full bg-lime-400/10 px-3 py-1.5 text-[10px] font-black text-lime-300 sm:flex">
              <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
              LIVE
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400 text-sm font-black text-[#06150e]">
              A
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 [scrollbar-width:thin] [scrollbar-color:rgba(163,230,53,0.2)_transparent]">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-lime-400 border-t-transparent" />
                <p className="mt-4 text-sm font-bold text-gray-400">
                  Loading dashboard data...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ───── OVERVIEW TAB ───── */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Stat Cards */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      label="Total Revenue"
                      value={formatCurrency(totalRevenue)}
                      icon="💰"
                      sub={`${orders.length} total orders`}
                      accent="lime"
                    />
                    <StatCard
                      label="Today's Revenue"
                      value={formatCurrency(todayRevenue)}
                      icon="📈"
                      sub={`${todayOrders.length} orders today`}
                      accent="emerald"
                    />
                    <StatCard
                      label="Products"
                      value={String(products.length)}
                      icon="🏷️"
                      sub={`${availableProducts.length} in stock`}
                      accent="cyan"
                    />
                    <StatCard
                      label="Active Shops"
                      value={String(shops.length)}
                      icon="🏪"
                      sub="Justice Market"
                      accent="amber"
                    />
                  </div>

                  {/* Charts row */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Revenue chart */}
                    <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-black text-white">Revenue (Last 7 Days)</h3>
                          <p className="text-xs text-gray-500">Daily order revenue breakdown</p>
                        </div>
                        <span className="rounded-full bg-lime-400/10 px-3 py-1 text-xs font-bold text-lime-300">
                          Weekly
                        </span>
                      </div>
                      <div className="flex h-44 items-end gap-2">
                        {last7DaysRevenue.map((day, i) => (
                          <div key={i} className="flex flex-1 flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-gray-400">
                              {day.amount > 0 ? `₹${Math.round(day.amount)}` : "—"}
                            </span>
                            <div
                              className="w-full rounded-t-lg bg-gradient-to-t from-lime-500/40 to-lime-400/80 transition-all duration-500"
                              style={{
                                height: `${Math.max((day.amount / maxDayRevenue) * 100, 4)}%`,
                              }}
                            />
                            <span className="text-[10px] font-bold text-gray-500">
                              {day.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <h3 className="mb-4 text-sm font-black text-white">Quick Stats</h3>
                      <div className="space-y-3">
                        <QuickStat
                          label="Avg Order Value"
                          value={
                            orders.length > 0
                              ? formatCurrency(totalRevenue / orders.length)
                              : "₹0"
                          }
                        />
                        <QuickStat
                          label="Categories"
                          value={String(categories.length - 1)}
                        />
                        <QuickStat
                          label="Out of Stock"
                          value={String(products.length - availableProducts.length)}
                        />
                        <QuickStat
                          label="Registered Users"
                          value={String(registrations.length)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-black text-white">Recent Orders</h3>
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="text-xs font-bold text-lime-400 hover:underline"
                      >
                        View All →
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-500">
                            <th className="pb-3 pr-4">ID</th>
                            <th className="pb-3 pr-4">Customer</th>
                            <th className="pb-3 pr-4">Phone</th>
                            <th className="pb-3 pr-4">Total</th>
                            <th className="pb-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {orders.slice(0, 5).map((o) => (
                            <tr key={o.id} className="text-gray-300">
                              <td className="py-3 pr-4 font-mono text-xs font-bold text-lime-300">
                                #{o.id}
                              </td>
                              <td className="py-3 pr-4 font-bold text-white">
                                {o.customer_name}
                              </td>
                              <td className="py-3 pr-4 text-xs">{o.phone}</td>
                              <td className="py-3 pr-4 font-bold text-lime-300">
                                {formatCurrency(o.total)}
                              </td>
                              <td className="py-3 text-xs text-gray-500">
                                {formatDate(o.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {orders.length === 0 && (
                      <p className="py-8 text-center text-sm text-gray-500">
                        No orders yet.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ───── ORDERS TAB ───── */}
              {activeTab === "orders" && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                      type="text"
                      placeholder="Search by name, phone, or ID..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-lime-400/50 sm:max-w-xs"
                    />
                    <span className="text-xs font-bold text-gray-500">
                      {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-500">
                          <th className="px-5 py-3">ID</th>
                          <th className="px-5 py-3">Customer</th>
                          <th className="px-5 py-3">Phone</th>
                          <th className="px-5 py-3">Address</th>
                          <th className="px-5 py-3">Total</th>
                          <th className="px-5 py-3">Date</th>
                          <th className="px-5 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredOrders.map((o) => (
                          <tr key={o.id} className="text-gray-300 hover:bg-white/[0.02]">
                            <td className="px-5 py-3 font-mono text-xs font-bold text-lime-300">
                              #{o.id}
                            </td>
                            <td className="px-5 py-3 font-bold text-white">{o.customer_name}</td>
                            <td className="px-5 py-3 text-xs">{o.phone}</td>
                            <td className="max-w-[200px] truncate px-5 py-3 text-xs text-gray-400">
                              {o.address}
                            </td>
                            <td className="px-5 py-3 font-bold text-lime-300">
                              {formatCurrency(o.total)}
                            </td>
                            <td className="px-5 py-3 text-xs text-gray-500">
                              {formatDate(o.created_at)}
                            </td>
                            <td className="px-5 py-3">
                              <button
                                onClick={() => handleDeleteOrder(o.id)}
                                className="rounded-lg bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-400 transition hover:bg-red-500/20"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredOrders.length === 0 && (
                      <p className="py-12 text-center text-sm text-gray-500">
                        {orderSearch ? "No orders match your search." : "No orders yet."}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ───── PRODUCTS TAB ───── */}
              {activeTab === "products" && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      placeholder="Search products, brands, shops..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-lime-400/50 sm:max-w-xs"
                    />
                    <select
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-lime-400/50"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c} className="bg-[#06150e]">
                          {c}
                        </option>
                      ))}
                    </select>
                    <span className="ml-auto text-xs font-bold text-gray-500">
                      {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-500">
                          <th className="px-5 py-3">ID</th>
                          <th className="px-5 py-3">Product</th>
                          <th className="px-5 py-3">Category</th>
                          <th className="px-5 py-3">Brand</th>
                          <th className="px-5 py-3">Unit</th>
                          <th className="px-5 py-3">Price</th>
                          <th className="px-5 py-3">Shop</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredProducts.map((p) => (
                          <tr
                            key={p.id}
                            className={`hover:bg-white/[0.02] ${
                              p.available === false ? "opacity-50" : ""
                            }`}
                          >
                            <td className="px-5 py-3 font-mono text-xs text-gray-500">
                              {p.id}
                            </td>
                            <td className="px-5 py-3 font-bold text-white">{p.name}</td>
                            <td className="px-5 py-3 text-xs text-gray-400">{p.category}</td>
                            <td className="px-5 py-3 text-xs text-gray-400">{p.brand || "—"}</td>
                            <td className="px-5 py-3 text-xs text-gray-400">{p.unit || "—"}</td>
                            <td className="px-5 py-3 font-bold text-lime-300">
                              ₹{p.price}
                            </td>
                            <td className="px-5 py-3 text-xs text-gray-400">
                              {shopMap.get(p.shop_id) || `Shop #${p.shop_id}`}
                            </td>
                            <td className="px-5 py-3">
                              <button
                                onClick={() => handleToggleAvailability(p)}
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black transition ${
                                  p.available !== false
                                    ? "bg-lime-400/20 text-lime-300 hover:bg-lime-400/30"
                                    : "bg-red-400/20 text-red-400 hover:bg-red-400/30"
                                }`}
                              >
                                {p.available !== false ? "In Stock" : "Out of Stock"}
                              </button>
                            </td>
                            <td className="px-5 py-3">
                              <button
                                onClick={() => openEditProduct(p)}
                                className="rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-white/20"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredProducts.length === 0 && (
                      <p className="py-12 text-center text-sm text-gray-500">
                        No products found.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ───── SHOPS TAB ───── */}
              {activeTab === "shops" && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                      type="text"
                      placeholder="Search shops..."
                      value={shopSearch}
                      onChange={(e) => setShopSearch(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-lime-400/50 sm:max-w-xs"
                    />
                    <span className="text-xs font-bold text-gray-500">
                      {filteredShops.length} shop{filteredShops.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredShops.map((s) => {
                      const shopProducts = products.filter((p) => p.shop_id === s.id);
                      const shopAvailable = shopProducts.filter((p) => p.available !== false);
                      return (
                        <div
                          key={s.id}
                          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-lime-400/30"
                        >
                          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-lime-400/5 blur-2xl transition group-hover:bg-lime-400/10" />
                          <div className="relative">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-400/15 text-xl font-bold">
                                🏪
                              </div>
                              <div className="min-w-0">
                                <h4 className="truncate font-black text-white">{s.name}</h4>
                                <p className="truncate text-xs text-gray-500">
                                  {s.address || "Justice Market"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <div className="rounded-xl bg-white/5 p-2.5 text-center">
                                <p className="text-lg font-black text-lime-300">
                                  {shopProducts.length}
                                </p>
                                <p className="text-[10px] font-bold text-gray-500">Products</p>
                              </div>
                              <div className="rounded-xl bg-white/5 p-2.5 text-center">
                                <p className="text-lg font-black text-lime-300">
                                  {shopAvailable.length}
                                </p>
                                <p className="text-[10px] font-bold text-gray-500">In Stock</p>
                              </div>
                            </div>

                            <div className="mt-4 space-y-1.5 text-xs text-gray-400">
                              {s.phone && (
                                <p className="flex items-center gap-1.5">
                                  <span>📞</span> {s.phone}
                                </p>
                              )}
                              {s.hours && (
                                <p className="flex items-center gap-1.5">
                                  <span>🕐</span> {s.hours}
                                </p>
                              )}
                              {s.rating !== null && (
                                <p className="flex items-center gap-1.5">
                                  <span>⭐</span> {s.rating} / 5
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {filteredShops.length === 0 && (
                    <p className="py-12 text-center text-sm text-gray-500">No shops found.</p>
                  )}
                </div>
              )}

              {/* ───── CUSTOMERS TAB ───── */}
              {activeTab === "customers" && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-lime-400/50 sm:max-w-xs"
                    />
                    <span className="text-xs font-bold text-gray-500">
                      {filteredCustomers.length} customer
                      {filteredCustomers.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {registrations.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-16 text-center">
                      <p className="text-3xl">👥</p>
                      <p className="mt-3 text-sm font-bold text-gray-400">
                        No registered customers yet.
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        Customers who register on the storefront will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-500">
                            <th className="px-5 py-3">ID</th>
                            <th className="px-5 py-3">Name</th>
                            <th className="px-5 py-3">Phone</th>
                            <th className="px-5 py-3">Address</th>
                            <th className="px-5 py-3">Registered</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredCustomers.map((r) => (
                            <tr key={r.id} className="text-gray-300 hover:bg-white/[0.02]">
                              <td className="px-5 py-3 font-mono text-xs text-gray-500">
                                {r.id}
                              </td>
                              <td className="px-5 py-3 font-bold text-white">{r.name}</td>
                              <td className="px-5 py-3 text-xs">{r.phone}</td>
                              <td className="max-w-[250px] truncate px-5 py-3 text-xs text-gray-400">
                                {r.address}
                              </td>
                              <td className="px-5 py-3 text-xs text-gray-500">
                                {formatDate(r.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ───── PRODUCT EDIT MODAL ───── */}
      {editProduct && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={() => setEditProduct(null)}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-[#06150e] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-black text-white">
                  Edit Product #{editProduct.id}
                </h3>
                <button
                  onClick={() => setEditProduct(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-lime-400/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-lime-400/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
                      Category
                    </label>
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-lime-400/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={editBrand}
                      onChange={(e) => setEditBrand(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-lime-400/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-400">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-lime-400/50"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 text-sm font-bold text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editAvailable}
                    onChange={(e) => setEditAvailable(e.target.checked)}
                    className="h-4 w-4 rounded text-lime-400"
                  />
                  Available (In Stock)
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  onClick={() => setEditProduct(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-gray-300 transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProduct}
                  disabled={editSaving}
                  className="rounded-xl bg-lime-400 px-5 py-2.5 text-xs font-black text-[#06150e] transition hover:bg-lime-300 disabled:opacity-50"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────── SUB-COMPONENTS ─────────────────── */

function StatCard({
  label,
  value,
  icon,
  sub,
  accent,
}: {
  label: string;
  value: string;
  icon: string;
  sub: string;
  accent: "lime" | "emerald" | "cyan" | "amber";
}) {
  const accentColors = {
    lime: "from-lime-400/20 to-lime-400/5 border-lime-400/20",
    emerald: "from-emerald-400/20 to-emerald-400/5 border-emerald-400/20",
    cyan: "from-cyan-400/20 to-cyan-400/5 border-cyan-400/20",
    amber: "from-amber-400/20 to-amber-400/5 border-amber-400/20",
  };
  const textColors = {
    lime: "text-lime-300",
    emerald: "text-emerald-300",
    cyan: "text-cyan-300",
    amber: "text-amber-300",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${accentColors[accent]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
          <p className={`mt-1 text-2xl font-black ${textColors[accent]}`}>{value}</p>
          <p className="mt-1 text-[11px] text-gray-500">{sub}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
      <span className="text-xs font-bold text-gray-400">{label}</span>
      <span className="text-sm font-black text-lime-300">{value}</span>
    </div>
  );
}
