"use client";

import { useState, useEffect } from "react";

export type PaymentMethod = "upi" | "card" | "cod" | "netbanking";

export interface CartItemSummary {
  id: number;
  product: string;
  shop: string;
  brand: string;
  unit: string;
  price: number;
  quantity: number;
}

interface PaymentViewProps {
  cart: CartItemSummary[];
  cartSubtotal: number;
  cartDiscount: number;
  cartTotal: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  onBackToDetails: () => void;
  onConfirmOrder: (paymentInfo: {
    method: string;
    transactionId: string;
    paidAt: string;
  }) => Promise<void> | void;
}

export function PaymentView({
  cart,
  cartSubtotal,
  cartDiscount,
  cartTotal,
  customerName,
  customerPhone,
  customerAddress,
  onBackToDetails,
  onConfirmOrder,
}: PaymentViewProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("upi");
  const [selectedUpiApp, setSelectedUpiApp] = useState("gpay");
  const [customUpiId, setCustomUpiId] = useState("");
  const [upiVerified, setUpiVerified] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState(customerName || "");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [saveCard, setSaveCard] = useState(true);

  // Net banking state
  const [selectedBank, setSelectedBank] = useState("hdfc");

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  // Countdown timer for UPI session
  const [secondsRemaining, setSecondsRemaining] = useState(599);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // Card number input formatter (spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = val.replace(/(\d{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  };

  // Expiry input formatter (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    setCardExpiry(val);
  };

  // Card brand detection
  const getCardBrand = () => {
    const clean = cardNumber.replace(/\s/g, "");
    if (clean.startsWith("4")) return "VISA";
    if (/^(5[1-5]|2[2-7])/.test(clean)) return "MASTERCARD";
    if (/^6(011|5)/.test(clean) || clean.startsWith("81") || clean.startsWith("82"))
      return "RUPAY";
    return "CARD";
  };

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedMethod === "card") {
      const cleanCard = cardNumber.replace(/\s/g, "");
      if (cleanCard.length < 15) {
        alert("Please enter a valid 16-digit card number.");
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        alert("Please enter a valid expiry date (MM/YY).");
        return;
      }
      if (cardCvv.length < 3) {
        alert("Please enter a valid 3 or 4-digit CVV.");
        return;
      }
    }

    if (selectedMethod === "upi" && customUpiId) {
      if (!customUpiId.includes("@")) {
        alert("Please enter a valid UPI ID (e.g. mobile@upi or name@okaxis).");
        return;
      }
    }

    setIsProcessing(true);
    setProcessingStep(1);

    // Simulate authentic payment processing stages
    setTimeout(() => {
      setProcessingStep(2);
    }, 800);

    setTimeout(() => {
      setProcessingStep(3);
    }, 1500);

    setTimeout(async () => {
      let methodLabel = "UPI";
      if (selectedMethod === "upi") {
        methodLabel = `UPI (${selectedUpiApp.toUpperCase()}${customUpiId ? `: ${customUpiId}` : ""})`;
      } else if (selectedMethod === "card") {
        methodLabel = `${getCardBrand()} Card (ending in ${cardNumber.slice(-4) || "••••"})`;
      } else if (selectedMethod === "cod") {
        methodLabel = "Cash on Delivery (Pay upon delivery)";
      } else if (selectedMethod === "netbanking") {
        methodLabel = `Net Banking (${selectedBank.toUpperCase()})`;
      }

      const txId = `TXN_${Date.now().toString().slice(-8)}`;

      try {
        await onConfirmOrder({
          method: methodLabel,
          transactionId: txId,
          paidAt: new Date().toISOString(),
        });
      } finally {
        setIsProcessing(false);
      }
    }, 2200);
  };

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8 md:py-12">
      {/* Background ambient accents */}
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-lime-300/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-green-300/20 blur-3xl" />

      {/* Progress navigation bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBackToDetails}
          disabled={isProcessing}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 font-black text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
        >
          <span>←</span> Back to Delivery Details
        </button>

        {/* Step Indicator */}
        <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-600 shadow-sm">
          <span className="flex items-center gap-1.5 text-green-700 font-black">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-[10px] text-green-800">
              ✓
            </span>
            1. Details
          </span>
          <span className="text-gray-300">───</span>
          <span className="flex items-center gap-1.5 text-lime-600 font-black">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime-400 text-[10px] text-[#06150e]">
              2
            </span>
            2. Payment & Confirmation
          </span>
          <span className="text-gray-300">───</span>
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px]">
              3
            </span>
            3. Order Placed
          </span>
        </div>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-lime-500/20 bg-lime-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-green-800">
          🔒 256-Bit SSL Encrypted
        </div>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-900 md:text-5xl">
          Choose Payment Method
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Select your preferred payment option to complete your order from LocalMarket.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left column: Payment Method selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Method selector tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
            <button
              type="button"
              onClick={() => setSelectedMethod("upi")}
              className={`flex flex-col items-center justify-center rounded-xl p-3 text-center transition ${
                selectedMethod === "upi"
                  ? "bg-[#06150e] text-white shadow-lg shadow-green-950/20"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-2xl">⚡</span>
              <span className="mt-1 text-xs font-black">UPI / QR</span>
              <span
                className={`text-[9px] font-bold ${
                  selectedMethod === "upi" ? "text-lime-300" : "text-green-600"
                }`}
              >
                Fastest
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod("cod")}
              className={`flex flex-col items-center justify-center rounded-xl p-3 text-center transition ${
                selectedMethod === "cod"
                  ? "bg-[#06150e] text-white shadow-lg shadow-green-950/20"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-2xl">💵</span>
              <span className="mt-1 text-xs font-black">Cash on Delivery</span>
              <span
                className={`text-[9px] font-bold ${
                  selectedMethod === "cod" ? "text-lime-300" : "text-gray-500"
                }`}
              >
                Pay at door
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod("card")}
              className={`flex flex-col items-center justify-center rounded-xl p-3 text-center transition ${
                selectedMethod === "card"
                  ? "bg-[#06150e] text-white shadow-lg shadow-green-950/20"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-2xl">💳</span>
              <span className="mt-1 text-xs font-black">Credit/Debit</span>
              <span
                className={`text-[9px] font-bold ${
                  selectedMethod === "card" ? "text-lime-300" : "text-gray-500"
                }`}
              >
                All Cards
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod("netbanking")}
              className={`flex flex-col items-center justify-center rounded-xl p-3 text-center transition ${
                selectedMethod === "netbanking"
                  ? "bg-[#06150e] text-white shadow-lg shadow-green-950/20"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-2xl">🏦</span>
              <span className="mt-1 text-xs font-black">Net Banking</span>
              <span
                className={`text-[9px] font-bold ${
                  selectedMethod === "netbanking" ? "text-lime-300" : "text-gray-500"
                }`}
              >
                All Indian Banks
              </span>
            </button>
          </div>

          {/* Active Payment Method Container */}
          <div className="overflow-hidden rounded-[2rem] border border-white bg-white p-6 shadow-xl shadow-green-950/5 md:p-8">
            {/* OPTION 1: UPI & QR CODE */}
            {selectedMethod === "upi" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-100 text-xl font-bold text-lime-800">
                      ⚡
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900">
                        Scan & Pay via UPI
                      </h3>
                      <p className="text-xs text-gray-500">
                        Zero transaction fees • Instant verification
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-500/20 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                    ⏱️ Session: {formatTimer(secondsRemaining)}
                  </div>
                </div>

                {/* Simulated QR Code Card */}
                <div className="flex flex-col sm:flex-row items-center gap-6 rounded-3xl border border-gray-100 bg-[#06150e] p-6 text-white shadow-lg">
                  <div className="relative flex flex-col items-center rounded-2xl bg-white p-4 shadow-inner">
                    {/* Dynamic QR code visualization */}
                    <div className="relative h-40 w-40 flex items-center justify-center rounded-xl bg-white border-2 border-dashed border-gray-300">
                      <svg
                        viewBox="0 0 160 160"
                        className="h-full w-full p-1"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {/* Position markers */}
                        <rect x="10" y="10" width="36" height="36" rx="4" fill="#06150e" />
                        <rect x="16" y="16" width="24" height="24" rx="2" fill="white" />
                        <rect x="22" y="22" width="12" height="12" rx="1" fill="#84cc16" />

                        <rect x="114" y="10" width="36" height="36" rx="4" fill="#06150e" />
                        <rect x="120" y="16" width="24" height="24" rx="2" fill="white" />
                        <rect x="126" y="22" width="12" height="12" rx="1" fill="#84cc16" />

                        <rect x="10" y="114" width="36" height="36" rx="4" fill="#06150e" />
                        <rect x="16" y="120" width="24" height="24" rx="2" fill="white" />
                        <rect x="22" y="126" width="12" height="12" rx="1" fill="#84cc16" />

                        {/* Pixel pattern simulation */}
                        <g fill="#06150e">
                          <rect x="54" y="14" width="8" height="8" />
                          <rect x="70" y="14" width="8" height="8" />
                          <rect x="86" y="14" width="8" height="8" />
                          <rect x="54" y="30" width="8" height="8" />
                          <rect x="78" y="30" width="8" height="8" />
                          <rect x="94" y="30" width="8" height="8" />
                          <rect x="54" y="46" width="8" height="8" />
                          <rect x="70" y="46" width="8" height="8" />
                          <rect x="14" y="58" width="8" height="8" />
                          <rect x="30" y="58" width="8" height="8" />
                          <rect x="46" y="58" width="8" height="8" />
                          <rect x="78" y="58" width="8" height="8" />
                          <rect x="94" y="58" width="8" height="8" />
                          <rect x="114" y="58" width="8" height="8" />
                          <rect x="134" y="58" width="8" height="8" />
                          <rect x="22" y="74" width="8" height="8" />
                          <rect x="38" y="74" width="8" height="8" />
                          <rect x="62" y="74" width="8" height="8" />
                          <rect x="86" y="74" width="8" height="8" />
                          <rect x="102" y="74" width="8" height="8" />
                          <rect x="126" y="74" width="8" height="8" />
                          <rect x="14" y="90" width="8" height="8" />
                          <rect x="46" y="90" width="8" height="8" />
                          <rect x="70" y="90" width="8" height="8" />
                          <rect x="94" y="90" width="8" height="8" />
                          <rect x="118" y="90" width="8" height="8" />
                          <rect x="54" y="106" width="8" height="8" />
                          <rect x="78" y="106" width="8" height="8" />
                          <rect x="102" y="106" width="8" height="8" />
                          <rect x="134" y="106" width="8" height="8" />
                          <rect x="54" y="122" width="8" height="8" />
                          <rect x="70" y="122" width="8" height="8" />
                          <rect x="94" y="122" width="8" height="8" />
                          <rect x="114" y="122" width="8" height="8" />
                          <rect x="62" y="138" width="8" height="8" />
                          <rect x="86" y="138" width="8" height="8" />
                          <rect x="126" y="138" width="8" height="8" />
                        </g>

                        {/* Center LocalMarket badge */}
                        <circle cx="80" cy="80" r="14" fill="#a3e635" />
                        <text
                          x="80"
                          y="84"
                          textAnchor="middle"
                          fill="#06150e"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          LM
                        </text>
                      </svg>
                    </div>
                    <span className="mt-2 text-[10px] font-black tracking-wider text-gray-700 uppercase">
                      LocalMarket Pay
                    </span>
                  </div>

                  <div className="space-y-2.5 text-center sm:text-left">
                    <span className="inline-block rounded-full bg-lime-400/20 px-3 py-1 text-[11px] font-bold text-lime-300">
                      Amount: ₹{cartTotal.toFixed(2)}
                    </span>
                    <h4 className="text-lg font-black text-white">
                      Scan with any UPI App
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed max-w-xs">
                      Open Google Pay, PhonePe, Paytm, or BHIM on your phone and point your camera to scan this QR.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                      <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white">
                        GPay
                      </span>
                      <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white">
                        PhonePe
                      </span>
                      <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white">
                        Paytm
                      </span>
                      <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white">
                        CRED
                      </span>
                    </div>
                  </div>
                </div>

                {/* Popular UPI Apps Quick Select */}
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-600">
                    Or select your UPI App
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: "gpay", name: "Google Pay", icon: "🟢" },
                      { id: "phonepe", name: "PhonePe", icon: "🟣" },
                      { id: "paytm", name: "Paytm", icon: "🔵" },
                      { id: "cred", name: "CRED UPI", icon: "⚫" },
                    ].map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedUpiApp(app.id)}
                        className={`flex items-center gap-2 rounded-2xl border-2 p-3 text-left transition ${
                          selectedUpiApp === app.id
                            ? "border-green-600 bg-green-50/50 shadow-sm"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <span className="text-xl">{app.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{app.name}</p>
                          <p className="text-[10px] text-gray-400">Direct App</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual UPI ID input */}
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-gray-600">
                    Or enter UPI ID (VPA)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customUpiId}
                      onChange={(e) => {
                        setCustomUpiId(e.target.value);
                        setUpiVerified(false);
                      }}
                      placeholder="e.g. 9876543210@paytm or user@okaxis"
                      className="flex-1 rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-green-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customUpiId.includes("@")) {
                          setUpiVerified(true);
                        } else {
                          alert("Please enter a valid UPI ID (e.g. yourname@upi).");
                        }
                      }}
                      className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-xs font-black text-gray-800 shadow-sm transition hover:bg-gray-50"
                    >
                      {upiVerified ? "✓ Verified" : "Verify"}
                    </button>
                  </div>
                  {upiVerified && (
                    <p className="mt-1.5 text-xs font-bold text-green-700">
                      ✓ UPI ID verified for instant payment request.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* OPTION 2: CASH ON DELIVERY (COD) */}
            {selectedMethod === "cod" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-xl font-bold text-amber-800">
                    💵
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">
                      Cash on Delivery (Pay at Doorstep)
                    </h3>
                    <p className="text-xs text-gray-500">
                      No advance payment needed • Pay with Cash or UPI upon arrival
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-lime-400/30 bg-[#06150e] p-6 text-white shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-400 text-2xl font-bold text-[#06150e]">
                      🛵
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-lime-300">
                        Zero Advance Payment
                      </p>
                      <h4 className="text-xl font-black">
                        Pay ₹{cartTotal.toFixed(2)} when package arrives
                      </h4>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur">
                      <p className="text-xs font-black text-lime-300">✓ Pay by Cash or UPI</p>
                      <p className="mt-1 text-[11px] text-gray-300">
                        Delivery agents carry change and personal UPI QR codes.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur">
                      <p className="text-xs font-black text-lime-300">✓ Inspect before Paying</p>
                      <p className="mt-1 text-[11px] text-gray-300">
                        Check fresh groceries and products from Justice Market shops first.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-600 space-y-1.5">
                  <p className="font-bold text-gray-800">📌 Delivery Notice:</p>
                  <p>
                    Your order will be prepared immediately by the shops in Justice Market. Please ensure you or someone is present at <strong>{customerAddress}</strong> with ₹{cartTotal.toFixed(2)} ready.
                  </p>
                </div>
              </div>
            )}

            {/* OPTION 3: CREDIT / DEBIT CARD */}
            {selectedMethod === "card" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-800">
                      💳
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900">
                        Credit / Debit / ATM Card
                      </h3>
                      <p className="text-xs text-gray-500">
                        Visa, MasterCard, RuPay, Maestro accepted
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                    {getCardBrand()}
                  </span>
                </div>

                {/* Animated Virtual Card Preview */}
                <div className="relative mx-auto max-w-sm rounded-[1.75rem] border border-white/20 bg-gradient-to-tr from-[#06150e] via-[#0d2a1d] to-[#1a4a35] p-6 text-white shadow-2xl">
                  <div className="flex items-center justify-between">
                    {/* Chip */}
                    <div className="h-9 w-12 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-md" />
                    <span className="text-xs font-black tracking-widest text-lime-300">
                      {getCardBrand()}
                    </span>
                  </div>

                  <div className="mt-7 font-mono text-lg font-bold tracking-widest">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-green-300/80">
                        Cardholder
                      </p>
                      <p className="text-xs font-bold uppercase tracking-wide">
                        {cardName || "YOUR NAME"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-green-300/80">
                        Expires
                      </p>
                      <p className="text-xs font-mono font-bold">
                        {cardExpiry || "MM/YY"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card input form */}
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-700">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3 font-mono text-sm font-semibold text-gray-900 outline-none focus:border-green-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-700">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Name as printed on card"
                      className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-green-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-700">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3 font-mono text-sm font-semibold text-gray-900 outline-none focus:border-green-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 flex items-center justify-between text-xs font-black uppercase tracking-wider text-gray-700">
                        <span>CVV / CVC</span>
                        <span className="text-[10px] text-gray-400">3-4 digits</span>
                      </label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) =>
                          setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                        placeholder="•••"
                        maxLength={4}
                        className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3 font-mono text-sm font-semibold text-gray-900 outline-none focus:border-green-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={(e) => setSaveCard(e.target.checked)}
                      className="h-4 w-4 rounded text-green-600 focus:ring-green-500"
                    />
                    Save card securely as per RBI guidelines for future quick checkout
                  </label>
                </div>
              </div>
            )}

            {/* OPTION 4: NET BANKING */}
            {selectedMethod === "netbanking" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-xl font-bold text-purple-800">
                    🏦
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">
                      Net Banking
                    </h3>
                    <p className="text-xs text-gray-500">
                      Transfer directly from your authorized bank account
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-2.5 block text-xs font-black uppercase tracking-wider text-gray-700">
                    Popular Banks
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: "hdfc", name: "HDFC Bank", logo: "🏦" },
                      { id: "sbi", name: "State Bank of India", logo: "🏛️" },
                      { id: "icici", name: "ICICI Bank", logo: "🏦" },
                      { id: "axis", name: "Axis Bank", logo: "🏛️" },
                    ].map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedBank(bank.id)}
                        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition ${
                          selectedBank === bank.id
                            ? "border-green-600 bg-green-50/50 shadow-sm"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <span className="text-2xl">{bank.logo}</span>
                        <span className="mt-1 text-xs font-bold text-gray-900">
                          {bank.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-wider text-gray-700">
                    Or select another bank
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3.5 text-sm font-semibold text-gray-900 outline-none focus:border-green-500 focus:bg-white"
                  >
                    <option value="hdfc">HDFC Bank</option>
                    <option value="sbi">State Bank of India (SBI)</option>
                    <option value="icici">ICICI Bank</option>
                    <option value="axis">Axis Bank</option>
                    <option value="kotak">Kotak Mahindra Bank</option>
                    <option value="pnb">Punjab National Bank (PNB)</option>
                    <option value="bob">Bank of Baroda</option>
                    <option value="canara">Canara Bank</option>
                    <option value="union">Union Bank of India</option>
                    <option value="indusind">IndusInd Bank</option>
                    <option value="yes">YES Bank</option>
                    <option value="federal">Federal Bank</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Order & Delivery Summary Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#06150e] p-6 text-white shadow-2xl md:p-8">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-lime-400/10 blur-3xl" />

            <div className="relative space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-400 text-2xl font-bold text-[#06150e]">
                    📦
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-lime-300">
                      Summary
                    </p>
                    <h3 className="text-xl font-black">Order & Payment</h3>
                  </div>
                </div>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-gray-300">
                  {cart.length} item{cart.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Delivery Details Recap */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-green-300">
                    📍 Delivering To
                  </span>
                  <button
                    type="button"
                    onClick={onBackToDetails}
                    className="text-xs font-bold text-lime-400 hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="mt-1.5 text-sm font-bold text-white">
                  {customerName} • {customerPhone}
                </p>
                <p className="mt-0.5 text-xs text-gray-300 line-clamp-2">
                  {customerAddress}
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-lime-300 font-bold">
                  <span>⚡</span>
                  <span>Estimated Delivery: 25 - 35 mins</span>
                </div>
              </div>

              {/* Items scrollable list */}
              <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(163,230,53,0.3)_transparent]">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 px-3.5 py-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{item.product}</p>
                      <p className="text-[10px] text-green-300">{item.shop}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-gray-400">×{item.quantity}</span>
                      <span className="ml-2 font-bold text-white">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation breakdown */}
              <div className="space-y-2.5 border-t border-white/10 pt-4 text-xs">
                <div className="flex justify-between text-green-200">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-white">
                    ₹{cartSubtotal.toFixed(2)}
                  </span>
                </div>

                {cartDiscount > 0 && (
                  <div className="flex justify-between font-bold text-lime-300">
                    <span>🎁 Offer Savings</span>
                    <span>-₹{cartDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-green-200">
                  <span>Delivery Charges</span>
                  <span className="font-bold text-lime-300">FREE</span>
                </div>

                <div className="flex justify-between text-green-200">
                  <span>Platform & Packaging</span>
                  <span className="font-bold text-lime-300">FREE</span>
                </div>

                <div className="flex items-baseline justify-between border-t border-white/10 pt-4">
                  <div>
                    <p className="text-sm font-bold text-gray-300">Total Payable</p>
                    <p className="text-[10px] text-green-400">Inclusive of all taxes</p>
                  </div>
                  <span className="text-3xl font-black text-lime-300">
                    ₹{cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Pay Now Button */}
              <button
                type="button"
                onClick={handlePayNow}
                disabled={isProcessing}
                className="w-full rounded-2xl bg-lime-400 py-4 text-center text-lg font-black text-[#06150e] shadow-[0_10px_30px_rgba(163,230,53,0.3)] transition duration-200 hover:-translate-y-0.5 hover:bg-lime-300 active:scale-95 disabled:opacity-50"
              >
                {selectedMethod === "cod"
                  ? "Confirm Cash on Delivery Order 🛵"
                  : `Pay ₹${cartTotal.toFixed(2)} & Confirm Order 🔒`}
              </button>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>100% Quality Assurance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>🔒</span>
                  <span>End-to-End Encryption</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Processing Modal Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/20 bg-[#06150e] p-8 text-center text-white shadow-2xl">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-lime-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-green-500/20 blur-3xl" />

            <div className="relative">
              {/* Spinner */}
              <div className="relative mx-auto h-20 w-20">
                <div className="h-20 w-20 rounded-full border-4 border-white/10" />
                <div className="absolute inset-0 h-20 w-20 animate-spin rounded-full border-4 border-lime-400 border-t-transparent" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                  {selectedMethod === "cod" ? "🛵" : "💳"}
                </div>
              </div>

              <h3 className="mt-6 text-2xl font-black">
                {selectedMethod === "cod"
                  ? "Confirming Local Order..."
                  : "Processing Payment..."}
              </h3>

              <div className="mt-4 space-y-2 text-xs font-semibold text-gray-300">
                <p className={processingStep >= 1 ? "text-lime-300" : "text-gray-500"}>
                  {processingStep >= 1 ? "✓ " : "• "} Connecting to secure gateway
                </p>
                <p className={processingStep >= 2 ? "text-lime-300" : "text-gray-500"}>
                  {processingStep >= 2 ? "✓ " : "• "} Authorizing ₹{cartTotal.toFixed(2)} via{" "}
                  {selectedMethod.toUpperCase()}
                </p>
                <p className={processingStep >= 3 ? "text-lime-300" : "text-gray-500"}>
                  {processingStep >= 3 ? "✓ " : "• "} Generating order with Justice Market merchants
                </p>
              </div>

              <p className="mt-6 text-[10px] text-gray-400">
                Please do not close this window or press back.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
