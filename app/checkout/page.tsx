"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CartItem, getCart } from "@/lib/cart";
import OrderSummary from "@/components/OrderSummary";

const shippingSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  apartment: z.string().optional(),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [hasShippingProtection, setHasShippingProtection] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    setCart(getCart());

    const handleCartUpdate = () => setCart(getCart());
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );


  const onSubmit = async (form: ShippingFormData) => {
    if (loading) return;

    if (cart.length === 0) {
      setMessage("Your cart is empty. Add items before checkout.");
      return;
    }

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart, shipping: form, couponCode, hasShippingProtection }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.error || "Unable to create checkout session.",
        );
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error("Checkout URL was not returned.");
      }

      window.location.assign(data.url);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Checkout request failed.",
      );
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full border px-4 py-3 font-sans text-sm text-[#1C1917] outline-none transition-colors duration-200 bg-white placeholder:text-[#A8A29E] ${
      hasError
        ? "border-[#DC2626] focus:border-[#DC2626]"
        : "border-[#1C1917]/20 focus:border-[#CA8A04]"
    }`;

  const labelClass = "font-display text-xs font-bold tracking-[0.15em] uppercase text-[#1C1917]";

  return (
    <main className="bg-[#FAFAF9] min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Left: Shipping form */}
          <div className="lg:col-span-2">
            <div className="border border-[#1C1917]/10 bg-white p-8">
              <h1 className="font-display text-2xl font-black text-[#1C1917] sm:text-3xl">
                Checkout
              </h1>
              <p className="mt-2 font-sans text-sm text-[#78716C]">
                Enter your shipping and contact details to complete your order.
              </p>

              {message && (
                <div className="mt-6 border border-[#DC2626]/30 bg-[#DC2626]/5 p-4">
                  <p className="font-sans text-sm text-[#DC2626]">{message}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
                {/* Name row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input
                      {...register("firstName")}
                      placeholder="John"
                      className={`mt-2 ${inputClass(!!errors.firstName)}`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 font-sans text-xs text-[#DC2626]">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input
                      {...register("lastName")}
                      placeholder="Doe"
                      className={`mt-2 ${inputClass(!!errors.lastName)}`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 font-sans text-xs text-[#DC2626]">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="john@example.com"
                      className={`mt-2 ${inputClass(!!errors.email)}`}
                    />
                    {errors.email && (
                      <p className="mt-1 font-sans text-xs text-[#DC2626]">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input
                      {...register("phone")}
                      placeholder="+1 (555) 123-4567"
                      className={`mt-2 ${inputClass(!!errors.phone)}`}
                    />
                    {errors.phone && (
                      <p className="mt-1 font-sans text-xs text-[#DC2626]">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className={labelClass}>Address</label>
                  <input
                    {...register("address")}
                    placeholder="123 Main Street"
                    className={`mt-2 ${inputClass(!!errors.address)}`}
                  />
                  {errors.address && (
                    <p className="mt-1 font-sans text-xs text-[#DC2626]">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                {/* Apartment / Unit (optional) */}
                <div>
                  <label className={labelClass}>
                    Apartment, Unit{" "}
                    <span className="text-[#A8A29E] font-sans text-xs tracking-normal normal-case font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    {...register("apartment")}
                    placeholder="Apt 4B, Suite 100"
                    className={`mt-2 ${inputClass(!!errors.apartment)}`}
                  />
                  {errors.apartment && (
                    <p className="mt-1 font-sans text-xs text-[#DC2626]">
                      {errors.apartment.message}
                    </p>
                  )}
                </div>

                {/* City, Country, Postal Code */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className={labelClass}>City</label>
                    <input
                      {...register("city")}
                      placeholder="New York"
                      className={`mt-2 ${inputClass(!!errors.city)}`}
                    />
                    {errors.city && (
                      <p className="mt-1 font-sans text-xs text-[#DC2626]">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Country</label>
                    <input
                      {...register("country")}
                      placeholder="United States"
                      className={`mt-2 ${inputClass(!!errors.country)}`}
                    />
                    {errors.country && (
                      <p className="mt-1 font-sans text-xs text-[#DC2626]">
                        {errors.country.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Postal Code</label>
                    <input
                      {...register("postalCode")}
                      placeholder="10001"
                      className={`mt-2 ${inputClass(!!errors.postalCode)}`}
                    />
                    {errors.postalCode && (
                      <p className="mt-1 font-sans text-xs text-[#DC2626]">
                        {errors.postalCode.message}
                      </p>
                    )}
                  </div>
                </div>

                <p className="font-sans text-xs text-[#A8A29E]">
                  Your information is securely transmitted via Stripe. We never store your payment details.
                </p>

                {/* Mobile "Place Order" button (hidden on desktop where OrderSummary shows it) */}
                <button
                  type="submit"
                  disabled={loading || !isValid}
                  className={`w-full py-3.5 font-display text-sm font-bold tracking-[0.15em] uppercase transition-colors duration-200 cursor-pointer lg:hidden ${
                    loading || !isValid
                      ? "cursor-not-allowed bg-[#1C1917]/10 text-[#A8A29E]"
                      : "bg-[#1C1917] text-[#FAFAF9] hover:bg-[#CA8A04]"
                  }`}
                >
                  {loading ? "Processing..." : "Place Order"}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Order summary (sticky) */}
          <div>
            <OrderSummary
              cart={cart}
              subtotal={subtotal}
              onPlaceOrder={handleSubmit(onSubmit)}
              loading={loading}
              disabled={!isValid || cart.length === 0}
              couponCode={couponCode}
              discountAmount={discountAmount}
              onCouponApply={(amount, code) => { setDiscountAmount(amount); setCouponCode(code); }}
              onCouponRemove={() => { setDiscountAmount(0); setCouponCode(""); }}
              hasShippingProtection={hasShippingProtection}
              onShippingProtectionChange={setHasShippingProtection}
            />
          </div>
        </div>
      </div>
    </main>
  );
}