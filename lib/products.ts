export type Product = {
  id: string;
  name: string;
  price: string;
  image: string;
  description: string;
  sizes: string[];
  stock: number;
};

export const products: Product[] = [
  {
    id: "1",
    name: "Classic Black Hoodie",
    price: "$49",
    image: "/products/hoodie.jpg",
    description:
      "A premium black hoodie designed for comfort, warmth, and everyday streetwear style.",
    sizes: ["S", "M", "L", "XL"],
    stock: 10,
  },
  {
    id: "2",
    name: "Minimal White Tee",
    price: "$29",
    image: "/products/tshirt.jpg",
    description:
      "Clean, minimal white t-shirt made from soft cotton for daily wear.",
    sizes: ["S", "M", "L", "XL"],
    stock: 20,
  },
  {
    id: "3",
    name: "Urban Street Jacket",
    price: "$89",
    image: "/products/jacket.jpg",
    description:
      "A bold street-style jacket built for modern urban fashion.",
    sizes: ["M", "L", "XL"],
    stock: 5,
  },
];