"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CartItem, getCart, saveCart } from "@/lib/cart";
import { normalizeImageSrc } from "@/lib/image";
import CouponInput from "@/components/CouponInput";
import DeliveryEstimate from "@/components/DeliveryEstimate";
import { useViewerCurrency } from "@/lib/use-viewer-currency";
import { variantLineKey } from "@/lib/variant-selection";

function Icon({ name, className = "h-5 w-5" }: { name: "minus" | "plus" | "trash" | "bag" | "arrow"; className?: string }) {
  const common = { className, fill: "none", stroke: "currentColor", strokeWidth: 1.8, viewBox: "0 0 24 24", "aria-hidden": true };
  if (name === "minus") return <svg {...common}><path strokeLinecap="round" d="M5 12h14" /></svg>;
  if (name === "plus") return <svg {...common}><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>;
  if (name === "trash") return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9 14.4 18m-4.8 0L9.26 9M18.88 5.79c.34.05.68.1 1.02.16M18.88 5.79 17.82 19.5A2.25 2.25 0 0 1 15.58 21H8.42a2.25 2.25 0 0 1-2.24-1.5L5.12 5.79m13.76 0A48.1 48.1 0 0 0 12 5.25c-2.34 0-4.64.17-6.88.54m0 0L4.1 5.95m1.02-.16L6.18 19.5M9.75 5.25V4.5A1.5 1.5 0 0 1 11.25 3h1.5a1.5 1.5 0 0 1 1.5 1.5v.75" /></svg>;
  if (name === "bag") return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a4.5 4.5 0 0 0-9 0v2.25M4.5 8.25h15l-1.05 11.2a1.5 1.5 0 0 1-1.49 1.3H7.04a1.5 1.5 0 0 1-1.49-1.3L4.5 8.25Z" /></svg>;
  return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" /></svg>;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>(() => getCart());
  const [, setSyncing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  // Viewer-currency display conversion (USD cart values -> browsing currency).
  // Uses the same convertPrice()/whole-unit rounding as checkout, so the
  // displayed total matches what will actually be charged.
  const vc = useViewerCurrency();
  const money = { format: (usd: number) => vc.fmt(vc.toDisplay(usd)) };

  const cartGeneration = useRef(0);

  const refreshCart = useCallback(async () => {
    const genAtStart = cartGeneration.current;
    const localCart = getCart();
    if (localCart.length === 0) {
      setCart([]);
      return;
    }

    setCart(localCart);
    setSyncing(true);

    try {
      const res = await fetch("/api/cart/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Color must travel with the line: two colorways of the same size are
          // different variants with their own price and stock.
          items: localCart.map((item) => ({
            id: item.id,
            size: item.size,
            color: item.color ?? null,
          })),
        }),
      });

      if (genAtStart !== cartGeneration.current) return;

      const data = await res.json();
      const serverPrices: Record<string, { price: number; variantStock: number }> = data.prices ?? {};

      const currentCart = getCart();
      const syncedCart = currentCart.map((item) => {
        const key = variantLineKey(item.id, item.size, item.color);
        const server = serverPrices[key];
        if (server) {
          return { ...item, price: server.price, variantStock: server.variantStock };
        }
        return item;
      });

      if (genAtStart !== cartGeneration.current) return;

      saveCart(syncedCart);
      setCart(syncedCart);
    } catch {
      if (genAtStart !== cartGeneration.current) return;
      setCart(getCart());
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(refreshCart, 0);
    window.addEventListener("cartUpdated", refreshCart);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("cartUpdated", refreshCart);
    };
  }, [refreshCart]);

  const subtotal = useMemo(() => cart.reduce((total, item) => total + item.price * item.quantity, 0), [cart]);
  const shipping = 0;
  const maxQuantity = (item: CartItem) => Math.min(Math.max(item.variantStock, 0), 10);

  const setQuantity = (id: string, size: string, quantity: number, color?: string) => {
    const updatedCart = cart.map((item) =>
      item.id === id && item.size === size && (item.color ?? null) === (color ?? null)
        ? maxQuantity(item) > 0
          ? { ...item, quantity: Math.min(Math.max(quantity, 1), maxQuantity(item)) }
          : item
        : item,
    );
    cartGeneration.current++;
    saveCart(updatedCart);
  };

  const removeItem = (id: string, size: string, color?: string) => {
    cartGeneration.current++;
    saveCart(cart.filter((item) => !(item.id === id && item.size === size && (item.color ?? null) === (color ?? null))));
  };

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-white px-4 py-12 text-ink sm:px-6 lg:px-8">
        <section className="mx-auto flex min-h-[58vh] max-w-xl flex-col items-center justify-center border border-stone/10 bg-white px-6 py-14 shadow-card rounded-lg text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-moss/30 bg-moss/10 text-moss"><Icon name="bag" className="h-7 w-7" /></div>
          <p className="mt-6 font-display text-3xl font-semibold text-ink">Your bag is empty</p>
          <p className="mt-3 max-w-sm text-sm leading-6 text-stone">Find gear that moves with you, built for the journey.</p>
          <Link href="/shop" className="btn-primary mt-8 cursor-pointer">Continue shopping <Icon name="arrow" className="h-4 w-4" /></Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-ink sm:px-6 sm:py-12 lg:px-8">
      <div className="section-grounded">
        <div className="flex items-end justify-between gap-4 border-b border-stone/10 pb-6">
          <div>
            <p className="eyebrow">Your selection</p>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Shopping bag</h1>
          </div>
          <p className="pb-1 font-sans text-sm text-stone">{cart.reduce((count, item) => count + item.quantity, 0)} items</p>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section aria-label="Cart items" className="divide-y divide-stone/20 border-y border-stone/10">
            {cart.map((item) => {
              const limit = maxQuantity(item);
              const canDecrease = item.quantity > 1;
              const canIncrease = item.quantity < limit;
              return (
                <article key={`${item.id}-${item.size}-${item.color ?? "nc"}`} className="grid gap-5 p-4 sm:grid-cols-[132px_minmax(0,1fr)_auto] sm:p-6">
                  <div className="relative aspect-square overflow-hidden bg-stone/5">
                    <Image src={normalizeImageSrc(item.image)} alt={item.name} fill sizes="(max-width: 640px) 132px, 132px" className="object-cover" />
                  </div>
                  <div className="min-w-0 self-center">
                    <h2 className="font-sans text-2xl font-medium leading-none tracking-tight text-ink">{item.name}</h2>
                    <p className="mt-3 text-sm text-stone">
                      {item.color && (
                        <>
                          Color <span className="ml-1 font-semibold text-ink">{item.color}</span>
                          <span className="mx-2 text-stone/60">·</span>
                        </>
                      )}
                      Size <span className="ml-1 font-semibold text-ink">{item.size}</span>
                    </p>
                    <p className="mt-1 font-mono text-lg text-ink">{money.format(item.price)}</p>
                    {limit === 0 ? <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-clay">Out of stock</p> : limit <= 3 ? <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-moss">Only {limit} left</p> : null}
                    <div className="mt-5 flex items-center gap-4">
                      <div className="flex h-10 items-center border border-stone/20" aria-label={`Quantity for ${item.name}`}>
                        <button type="button" aria-label={`Decrease quantity for ${item.name}`} disabled={!canDecrease} onClick={() => setQuantity(item.id, item.size, item.quantity - 1, item.color)} className="grid h-full w-10 place-items-center border-r border-stone/20 text-ink transition-colors duration-150 hover:bg-ink hover:text-white focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer"><Icon name="minus" className="h-4 w-4" /></button>
                        <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                        <button type="button" aria-label={`Increase quantity for ${item.name}`} disabled={!canIncrease} onClick={() => setQuantity(item.id, item.size, item.quantity + 1, item.color)} className="grid h-full w-10 place-items-center border-l border-stone/20 text-ink transition-colors duration-150 hover:bg-ink hover:text-white focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer"><Icon name="plus" className="h-4 w-4" /></button>
                      </div>
                      <button type="button" onClick={() => removeItem(item.id, item.size, item.color)} className="inline-flex items-center gap-1.5 font-sans text-xs font-medium uppercase tracking-wide text-stone transition-colors duration-150 hover:text-clay focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moss cursor-pointer"><Icon name="trash" className="h-4 w-4" /> Remove</button>
                    </div>
                  </div>
                  <p className="self-start text-right font-mono text-xl text-ink sm:self-center">{money.format(item.price * item.quantity)}</p>
                </article>
              );
            })}
          </section>

          <aside className="border border-stone/10 bg-white p-6 lg:sticky shadow-card rounded-lg lg:top-24">
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Order summary</h2>
            <div className="mt-6 space-y-3 border-y border-stone/10 py-5 text-sm">
              <div className="flex justify-between"><span className="text-stone">Subtotal</span><span className="text-ink">{money.format(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-stone">Shipping</span><span className="text-ink">{shipping === 0 ? "Free" : money.format(shipping)}</span></div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-moss">
                  <span>Discount ({couponCode})</span>
                  <span>-{money.format(discountAmount)}</span>
                </div>
              )}
              {subtotal < 100 && <p className="pt-1 text-xs text-stone">Add {money.format(100 - subtotal)} for free shipping.</p>}
            </div>
            <CouponInput
              subtotal={subtotal}
              appliedCode={couponCode}
              discountAmount={discountAmount}
              onApply={(amount, code) => { setDiscountAmount(amount); setCouponCode(code); }}
              onRemove={() => { setDiscountAmount(0); setCouponCode(""); }}
            />
            <div className="mt-5 flex items-baseline justify-between">
              <span className="font-display text-lg font-semibold text-ink">Total</span>
              <span className="font-mono text-2xl text-ink">{money.format(subtotal - discountAmount)}</span>
            </div>
            <div className="mt-5">
              <DeliveryEstimate />
            </div>
            <Link href="/checkout" className="btn-primary mt-6 flex w-full items-center justify-center cursor-pointer">Checkout <Icon name="arrow" className="h-4 w-4" /></Link>
            <Link href="/shop" className="mt-4 block text-center text-xs font-medium uppercase tracking-wide text-ink underline decoration-moss decoration-2 underline-offset-4 transition-colors duration-150 hover:text-moss cursor-pointer">Continue shopping</Link>
          </aside>
        </div>
      </div>
    </main>
  );
}