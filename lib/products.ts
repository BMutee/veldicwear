export type Product = {
  id: string;
  name: string;
  price: string;
  description: string;
};

export const products: Product[] = [
  {
    id: "1",
    name: "Classic Black Hoodie",
    price: "$49",
    description:
      "A premium black hoodie designed for comfort, warmth, and everyday streetwear style.",
  },
  {
    id: "2",
    name: "Minimal White Tee",
    price: "$29",
    description:
      "Clean, minimal white t-shirt made from soft cotton for daily wear.",
  },
  {
    id: "3",
    name: "Urban Street Jacket",
    price: "$89",
    description:
      "A bold street-style jacket built for modern urban fashion.",
  },
];