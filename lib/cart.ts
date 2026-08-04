export type Product = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  stock: number;
};

export type CartItem = Product & {
  size: string;
  color?: string;
  quantity: number;
  variantStock: number;
};

export function getCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const cart = localStorage.getItem("cart");
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
}

export function addToCart(
  product: Product,
  size: string,
  variantStock: number,
  quantity: number = 1,
  color?: string,
) {
  const cart = getCart();

  const existingItem = cart.find(
    (item) =>
      item.id === product.id &&
      item.size === size &&
      (item.color ?? null) === (color ?? null),
  );

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (newQty > existingItem.variantStock) {
      return {
        success: false,
        message: `Only ${existingItem.variantStock} items available for size ${size}.`,
      };
    }
    existingItem.quantity = newQty;
  } else {
    if (quantity > variantStock) {
      return {
        success: false,
        message: `Only ${variantStock} items available for size ${size}.`,
      };
    }
    cart.push({
      ...product,
      size,
      color,
      quantity,
      variantStock,
    });
  }

  saveCart(cart);

  return {
    success: true,
    message: "Added to cart",
  };
}

export function updateQuantity(id: string, size: string, quantity: number, color?: string) {
  const cart = getCart();
  const item = cart.find(
    (item) =>
      item.id === id &&
      item.size === size &&
      (item.color ?? null) === (color ?? null),
  );
  if (!item) return;

  if (quantity <= 0) {
    removeFromCart(id, size, color);
    return;
  }

  if (quantity > item.variantStock) {
    return;
  }

  item.quantity = quantity;
  saveCart(cart);
}

export function removeFromCart(id: string, size: string, color?: string) {
  const cart = getCart();
  const updatedCart = cart.filter(
    (item) =>
      !(
        item.id === id &&
        item.size === size &&
        (item.color ?? null) === (color ?? null)
      ),
  );
  saveCart(updatedCart);
}

export function clearCart() {
  saveCart([]);
}