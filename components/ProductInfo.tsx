import SizeSelector from "./SizeSelector";
import { Product } from "@/lib/products";
import AddToCartButton from "./AddToCartButton";


type Props = {
  product: Product;
};

export default function ProductInfo({
  product,
}: Props) {
  return (
    <div>
      <h1 className="text-3xl font-bold">
        {product.name}
      </h1>

      <p className="mt-3 text-xl text-yellow-400">
        {product.price}
      </p>

      <p className="mt-6 leading-7 text-white/70">
  {product.description}
</p>

<SizeSelector sizes={product.sizes} />

<AddToCartButton product={product} />

      
    </div>
  );
}