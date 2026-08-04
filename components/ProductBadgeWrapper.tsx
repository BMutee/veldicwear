type ProductBadgeWrapperProps = {
  product: {
    featured?: boolean;
    stock: number;
    price: number;
    compareAtPrice?: number | null;
    variants?: { stock: number }[];
  };
};

export default function ProductBadgeWrapper({ product }: ProductBadgeWrapperProps) {
  const badges = [];

  if (product.featured) {
    badges.push({
      label: "Featured",
      className: "bg-moss text-white",
    });
  }

  if (product.compareAtPrice && product.compareAtPrice > product.price) {
    const discountPercent = Math.round(
      ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
    );
    badges.push({
      label: `-${discountPercent}%`,
      className: "badge-clay",
    });
  }

  const totalVariantStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) ?? product.stock;
  const effectiveStock = Math.max(product.stock, totalVariantStock);
  if (effectiveStock === 0) {
    badges.push({
      label: "Out of stock",
      className: "bg-stone text-white",
    });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span
          key={badge.label}
          className={`${badge.className} font-mono text-xs px-3 py-1`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}