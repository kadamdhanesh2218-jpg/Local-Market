"use client";

import { CartItemSummary } from "./PaymentView";

export interface ConfirmedOrderInfo {
  orderId: string;
  transactionId: string;
  paymentMethod: string;
  paidAt: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItemSummary[];
  subtotal: number;
  discount: number;
  total: number;
}

interface OrderConfirmationViewProps {
  order: ConfirmedOrderInfo;
  onContinueShopping: () => void;
}

export function OrderConfirmationView({
  order,
  onContinueShopping,
}: OrderConfirmationViewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#06150e] p-6 text-white shadow-2xl md:p-12">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-lime-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-green-400/20 blur-3xl" />

        <div className="relative">
          {/* Header celebration */}
          <div className="text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-lime-400 text-5xl shadow-[0_0_60px_rgba(163,230,53,0.35)]">
              🎉
            </div>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.3em] text-lime-300">
              Payment & Order Confirmed
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
              You&apos;re all set!
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm text-green-100">
              Your order has been placed with local merchants in Justice Market. We&apos;ve sent confirmation to{" "}
              <strong className="text-white">{order.customerPhone}</strong>.
            </p>
          </div>

          {/* Order Details Banner */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-wider text-green-300">
                Order Reference
              </p>
              <p className="mt-1 font-mono text-base font-black text-lime-300">
                {order.orderId}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-wider text-green-300">
                Payment Status
              </p>
              <p className="mt-1 text-sm font-black text-white">
                {order.paymentMethod.includes("Cash on Delivery")
                  ? "Pay on Delivery (COD)"
                  : "✓ Paid Online"}
              </p>
              <p className="text-[10px] text-gray-400 truncate mt-0.5">
                {order.paymentMethod}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-wider text-green-300">
                Estimated Delivery
              </p>
              <p className="mt-1 text-sm font-black text-lime-300">
                ⚡ 25 - 35 mins
              </p>
              <p className="text-[10px] text-gray-400">Local Express</p>
            </div>
          </div>

          {/* Delivery Tracker Steps */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h4 className="text-xs font-black uppercase tracking-wider text-lime-300">
              Live Order Status
            </h4>

            <div className="mt-6 grid grid-cols-4 gap-2 text-center">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400 text-base font-bold text-[#06150e] shadow-lg shadow-lime-400/30">
                  ✓
                </div>
                <p className="mt-2 text-xs font-bold text-white">Confirmed</p>
                <p className="text-[10px] text-lime-300">Just now</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400 text-base font-bold text-[#06150e] shadow-lg shadow-lime-400/30">
                  🏪
                </div>
                <p className="mt-2 text-xs font-bold text-white">Packing</p>
                <p className="text-[10px] text-lime-300">In progress</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-base font-bold text-gray-400">
                  🛵
                </div>
                <p className="mt-2 text-xs font-bold text-gray-400">On the way</p>
                <p className="text-[10px] text-gray-500">~15 mins</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-base font-bold text-gray-400">
                  📍
                </div>
                <p className="mt-2 text-xs font-bold text-gray-400">Delivered</p>
                <p className="text-[10px] text-gray-500">~30 mins</p>
              </div>
            </div>
          </div>

          {/* Order Summary & Receipt Breakdown */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h4 className="text-sm font-black text-white">
                  Delivery & Item Details
                </h4>
                <p className="text-xs text-gray-300">
                  Delivering to: {order.customerName} ({order.customerPhone})
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{order.customerAddress}</p>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 print:hidden"
              >
                🖨️ Print Receipt
              </button>
            </div>

            <div className="mt-4 divide-y divide-white/5">
              {order.items.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{item.product}</span>
                    <span className="text-gray-400 ml-2">×{item.quantity}</span>
                    <p className="text-[10px] text-green-300">{item.shop}</p>
                  </div>
                  <span className="font-mono font-bold text-white">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-white/10 pt-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-lime-300 font-bold">
                  <span>Offer Savings</span>
                  <span>-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-300">
                <span>Delivery Fee</span>
                <span className="text-lime-300">FREE</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 text-base font-black">
                <span>Total Paid</span>
                <span className="text-lime-300">₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onContinueShopping}
              className="w-full sm:w-auto rounded-2xl bg-lime-400 px-8 py-4 font-black text-[#06150e] shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-lime-300"
            >
              Continue Shopping →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
