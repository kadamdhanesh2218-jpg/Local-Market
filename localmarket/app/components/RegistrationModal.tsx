"use client";

import { useState, useEffect } from "react";

export type UserProfile = {
  name: string;
  phone: string;
  address: string;
  savedAt?: string;
};

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSave: (user: UserProfile) => Promise<boolean | void> | boolean | void;
  onClear: () => void;
}

export function RegistrationModal({
  isOpen,
  onClose,
  user,
  onSave,
  onClear,
}: RegistrationModalProps) {
  if (!isOpen) return null;

  return (
    <RegistrationModalDialog
      key={user ? `user-${user.phone || user.name}` : "new-guest"}
      onClose={onClose}
      user={user}
      onSave={onSave}
      onClear={onClear}
    />
  );
}

function RegistrationModalDialog({
  onClose,
  user,
  onSave,
  onClear,
}: Omit<RegistrationModalProps, "isOpen">) {
  const [isEditing, setIsEditing] = useState(!user);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName) {
      setError("Please enter your name.");
      return;
    }

    if (!trimmedPhone) {
      setError("Please enter your phone number.");
      return;
    }

    if (trimmedPhone.length < 7) {
      setError("Please enter a valid phone number (at least 7 digits).");
      return;
    }

    if (!trimmedAddress) {
      setError("Please enter your delivery address.");
      return;
    }

    setSaving(true);
    try {
      const profile: UserProfile = {
        name: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress,
        savedAt: new Date().toISOString(),
      };

      await onSave(profile);
      setSuccessMessage("Your information has been saved successfully!");
      setIsEditing(false);
      setTimeout(() => {
        setSuccessMessage("");
      }, 3500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save information.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    if (confirm("Are you sure you want to clear your saved registration details?")) {
      onClear();
      setName("");
      setPhone("");
      setAddress("");
      setIsEditing(true);
      setSuccessMessage("Information cleared.");
      setTimeout(() => setSuccessMessage(""), 2500);
    }
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "👤";

  return (
    <>
      {/* Click-outside backdrop */}
      <div
        className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Pop-up positioned at top right near cart with viewport height limits */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="User Registration"
        className="fixed top-16 sm:top-20 right-3 sm:right-6 md:right-8 z-[100] flex max-h-[calc(100dvh-4.5rem)] sm:max-h-[calc(100dvh-5.5rem)] w-[calc(100vw-24px)] max-w-md flex-col animate-in fade-in slide-in-from-top-4 duration-300"
      >
        <div className="relative flex max-h-full min-h-0 w-full flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-[#06150e] text-white shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          {/* Ambient lighting glows */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-lime-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-green-500/15 blur-3xl" />

          {/* Header - Always visible at top */}
          <div className="relative shrink-0 flex items-center justify-between border-b border-white/10 p-5 md:px-7 md:py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime-400 text-lg font-black text-[#06150e] shadow-[0_0_20px_rgba(163,230,53,0.3)]">
                {user && !isEditing ? initials : "👤"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-lime-400">
                    {user && !isEditing ? "Customer Profile" : "Quick Registration"}
                  </span>
                  {user && !isEditing && (
                    <span className="rounded-full bg-lime-400/20 px-2 py-0.5 text-[9px] font-bold text-lime-300">
                      ✓ Active
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  {user && !isEditing ? user.name : "Register with Us"}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl font-bold text-gray-300 transition hover:bg-white/20 hover:text-white"
              aria-label="Close registration popup"
            >
              ×
            </button>
          </div>

          {/* View Details Mode */}
          {user && !isEditing ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-5 md:px-7 space-y-3.5 overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(163,230,53,0.3)_transparent]">
                {/* Feedback Messages */}
                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/15 p-3 text-xs font-semibold text-red-200">
                    ⚠️ {error}
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-xl border border-lime-400/30 bg-lime-400/15 p-3 text-xs font-bold text-lime-300">
                    🎉 {successMessage}
                  </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-[11px] font-black uppercase tracking-wider text-green-300">
                    Full Name
                  </p>
                  <p className="mt-1 text-base font-bold text-white">{user.name}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-[11px] font-black uppercase tracking-wider text-green-300">
                    Phone Number
                  </p>
                  <p className="mt-1 text-base font-bold text-white">{user.phone}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-[11px] font-black uppercase tracking-wider text-green-300">
                    Delivery Address
                  </p>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-gray-200 whitespace-pre-wrap">
                    {user.address}
                  </p>
                </div>

                <div className="rounded-xl border border-lime-400/20 bg-lime-400/10 px-3.5 py-2.5 text-xs text-lime-200">
                  ⚡ These details automatically fill during checkout so you never have to re-type them!
                </div>
              </div>

              {/* View mode action buttons pinned at bottom */}
              <div className="shrink-0 border-t border-white/10 bg-[#06150e]/95 p-4 sm:p-5 md:px-7 backdrop-blur">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex-1 rounded-2xl bg-lime-400 py-3 text-center text-sm font-black text-[#06150e] shadow-lg transition hover:bg-lime-300 active:scale-95"
                  >
                    ✏️ Edit Details
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Registration / Edit Form with scrollable fields and pinned save button */
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-5 md:px-7 space-y-3.5 overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(163,230,53,0.3)_transparent]">
                {/* Feedback Messages */}
                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/15 p-3 text-xs font-semibold text-red-200">
                    ⚠️ {error}
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-xl border border-lime-400/30 bg-lime-400/15 p-3 text-xs font-bold text-lime-300">
                    🎉 {successMessage}
                  </div>
                )}

                <p className="text-xs text-green-200">
                  Enter your details once. We will remember your address for all current and future orders.
                </p>

                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-green-200">
                    <span>👤</span> Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    className="w-full rounded-2xl border-2 border-white/10 bg-white px-4 py-2.5 sm:py-3 text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400 focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20"
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-green-200">
                    <span>📞</span> Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    autoComplete="tel"
                    inputMode="tel"
                    className="w-full rounded-2xl border-2 border-white/10 bg-white px-4 py-2.5 sm:py-3 text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400 focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20"
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-green-200">
                    <span>📍</span> Delivery Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Flat/House number, building, street, Justice Market..."
                    autoComplete="street-address"
                    rows={2}
                    className="w-full resize-none rounded-2xl border-2 border-white/10 bg-white px-4 py-2.5 sm:py-3 text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400 focus:border-lime-400 focus:ring-4 focus:ring-lime-400/20"
                  />
                </div>
              </div>

              {/* Pinned Bottom Action Footer - ALWAYS VISIBLE AT ALL SCREEN SIZES */}
              <div className="shrink-0 border-t border-white/10 bg-[#06150e]/95 p-4 sm:p-5 md:px-7 backdrop-blur space-y-2">
                <div className="flex items-center gap-3">
                  {user && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setError("");
                      }}
                      className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-black text-white transition hover:bg-white/20"
                    >
                      Cancel
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-2xl bg-lime-400 py-3 sm:py-3.5 text-center text-sm font-black text-[#06150e] shadow-[0_10px_25px_rgba(163,230,53,0.3)] transition duration-200 hover:-translate-y-0.5 hover:bg-lime-300 active:scale-95 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : user ? "Update Information ✓" : "Save & Register 🎉"}
                  </button>
                </div>

                <p className="text-center text-[10px] text-green-300/80">
                  🔒 Data is saved securely for quick checkout.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
