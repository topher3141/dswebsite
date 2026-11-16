"use client";
import { useEffect, useState } from "react";

export type ElectronicsProductItem = {
  id: string; variationId?: string | null; name: string; description?: string;
  image?: string | null; price: string; dealsPrice?: string;
  dealsAmount?: number | null; priceAmount?: number | null;
  retailAmount?: number | null; retailPrice?: string; stockCount?: number;
};
export type ElectronicsCartItem = { product: ElectronicsProductItem; quantity: number };
const KEY = "ds-electronics-cart-v1";

export function useElectronicsCart() {
  const [cartItems, setCartItems] = useState<ElectronicsCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [isCheckingOutCart, setIsCheckingOutCart] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(KEY) || "[]");
      if (Array.isArray(saved)) {
        setCartItems(saved.filter((item: any) =>
          item?.product?.id && item?.product?.variationId &&
          Number.isInteger(item.quantity) && item.quantity > 0
        ));
      }
    } catch { /* Ignore unavailable or invalid saved cart. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(cartItems)); } catch {}
  }, [cartItems, hydrated]);

  function addToCart(product: ElectronicsProductItem) {
    if (!product.variationId || !product.stockCount || product.stockCount <= 0) return;
    setCartItems(current => {
      const found = current.find(item => item.product.id === product.id);
      if (!found) return [...current, { product, quantity: 1 }];
      if (found.quantity >= product.stockCount!) return current;
      return current.map(item => item.product.id === product.id
        ? { product, quantity: item.quantity + 1 } : item);
    });
  }

  function decreaseCartQuantity(product: ElectronicsProductItem) {
    setCartItems(current => current.flatMap(item =>
      item.product.id !== product.id ? [item] :
      item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []
    ));
  }
  function removeFromCart(product: ElectronicsProductItem) {
    setCartItems(current => current.filter(item => item.product.id !== product.id));
  }

  async function checkoutCart() {
    if (!cartItems.length || isCheckingOutCart) return;
    const checkoutWindow = window.open("", "_blank");
    setCheckoutError("");
    setIsCheckingOutCart(true);
    try {
      const response = await fetch("/api/square/create-checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItems.map(({ product, quantity }) => ({
          variationId: product.variationId, itemName: product.name, quantity,
        })) }),
      });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl)
        throw new Error(data.error || "Unable to create checkout.");
      if (checkoutWindow) checkoutWindow.location.href = data.checkoutUrl;
      else window.location.href = data.checkoutUrl;
    } catch (error: any) {
      checkoutWindow?.close();
      setCheckoutError(error?.message || "Unable to start checkout.");
    } finally { setIsCheckingOutCart(false); }
  }

  return { cartItems, hydrated, addToCart, decreaseCartQuantity, removeFromCart,
    checkoutCart, checkoutError, isCheckingOutCart };
}
