import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const products = [
  {
    name: "Classic Black Hoodie",
    description: "A premium black hoodie designed for comfort, warmth, and everyday streetwear style.",
    image: "/products/hoodie.jpg",
    price: 49.0,
    compareAtPrice: 69.0,
    stock: 10,
    sku: "VB-HD-001",
    barcode: "1000000001",
    trackInventory: true,
    sellOutOfStock: false,
    weight: 0.5,
    weightUnit: "kg",
    featured: true,
    variants: [
      { size: "S", stock: 3, price: 49.0 },
      { size: "M", stock: 5, price: 49.0 },
      { size: "L", stock: 2, price: 49.0 },
      { size: "XL", stock: 0, price: 54.0 },
    ],
    images: [
      { color: "Black", url: "/products/hoodie-black-1.jpg" },
      { color: "Black", url: "/products/hoodie-black-2.jpg" },
      { color: "Gray", url: "/products/hoodie-gray-1.jpg" },
      { color: "Gray", url: "/products/hoodie-gray-2.jpg" },
    ],
  },
  {
    name: "Minimal White Tee",
    description: "Clean, minimal white t-shirt made from soft cotton for daily wear.",
    image: "/products/tshirt.jpg",
    price: 29.0,
    compareAtPrice: null,
    stock: 20,
    sku: "VB-TS-001",
    barcode: "1000000002",
    trackInventory: true,
    sellOutOfStock: false,
    weight: 0.2,
    weightUnit: "kg",
    featured: true,
    variants: [
      { size: "S", stock: 5, price: 29.0 },
      { size: "M", stock: 8, price: 29.0 },
      { size: "L", stock: 5, price: 29.0 },
      { size: "XL", stock: 2, price: 32.0 },
    ],
    images: [
      { color: "White", url: "/products/tshirt-white-1.jpg" },
      { color: "Black", url: "/products/tshirt-black-1.jpg" },
    ],
  },
  {
    name: "Urban Street Jacket",
    description: "A bold street-style jacket built for modern urban fashion.",
    image: "/products/jacket.jpg",
    price: 89.0,
    compareAtPrice: 120.0,
    stock: 5,
    sku: "VB-JK-001",
    barcode: "1000000003",
    trackInventory: true,
    sellOutOfStock: false,
    weight: 0.8,
    weightUnit: "kg",
    featured: true,
    variants: [
      { size: "M", stock: 2, price: 89.0 },
      { size: "L", stock: 2, price: 89.0 },
      { size: "XL", stock: 1, price: 95.0 },
    ],
    images: [
      { color: "Black", url: "/products/jacket-black-1.jpg" },
      { color: "Olive", url: "/products/jacket-olive-1.jpg" },
    ],
  },
  {
    name: "Slim Fit Jeans",
    description: "Modern slim-fit jeans with a comfortable stretch fabric.",
    image: "/products/jeans.jpg",
    price: 59.0,
    compareAtPrice: 79.0,
    stock: 15,
    sku: "VB-JN-001",
    barcode: "1000000004",
    trackInventory: true,
    sellOutOfStock: false,
    weight: 0.6,
    weightUnit: "kg",
    featured: false,
    variants: [
      { size: "30", stock: 4, price: 59.0 },
      { size: "32", stock: 6, price: 59.0 },
      { size: "34", stock: 3, price: 59.0 },
      { size: "36", stock: 2, price: 64.0 },
    ],
    images: [
      { color: "Indigo", url: "/products/jeans-indigo-1.jpg" },
      { color: "Black", url: "/products/jeans-black-1.jpg" },
    ],
  },
  {
    name: "Wool Beanie",
    description: "Classic knitted wool beanie to keep you warm in style.",
    image: "/products/beanie.jpg",
    price: 19.0,
    compareAtPrice: null,
    stock: 30,
    sku: "VB-BN-001",
    barcode: "1000000005",
    trackInventory: true,
    sellOutOfStock: false,
    weight: 0.1,
    weightUnit: "kg",
    featured: false,
    variants: [
      { size: "One Size", stock: 30, price: 19.0 },
    ],
    images: [
      { color: "Black", url: "/products/beanie-black-1.jpg" },
      { color: "Gray", url: "/products/beanie-gray-1.jpg" },
    ],
  },
  {
    name: "Leather Crossbody Bag",
    description: "Sleek genuine leather crossbody bag for everyday carry.",
    image: "/products/bag.jpg",
    price: 79.0,
    compareAtPrice: 99.0,
    stock: 8,
    sku: "VB-BG-001",
    barcode: "1000000006",
    trackInventory: true,
    sellOutOfStock: false,
    weight: 0.4,
    weightUnit: "kg",
    featured: true,
    variants: [
      { size: "One Size", stock: 8, price: 79.0 },
    ],
    images: [
      { color: "Black", url: "/products/bag-black-1.jpg" },
      { color: "Brown", url: "/products/bag-brown-1.jpg" },
    ],
  },
];

const defaultSections = [
  {
    key: "brand-story",
    label: "Brand Story",
    content: {
      badge: "Our Story",
      headline: "BUILT FOR THE\nUNDERGROUND",
      headlineAccent: "UNDERGROUND",
      paragraphs: [
        "Veldic Wear was born from the intersection of street culture, music, and raw self-expression. We don't follow trends — we set them.",
        "Every piece is crafted with premium materials, meticulous attention to detail, and a deep respect for the culture that shaped us. From the block to the stage, our gear is made to move, to stand out, and to last.",
        "This isn't just clothing. It's a statement. It's an identity. It's the uniform of those who dare to be different."
      ],
      stats: [
        { value: "2018", label: "Founded" },
        { value: "15+", label: "Drops" },
        { value: "100%", label: "Authentic" }
      ],
      ctaText: "Read Our Story",
      ctaLink: "/about",
      gradientFrom: "from-orange-400",
      gradientTo: "to-orange-600",
      accentColor: "orange"
    }
  },
  {
    key: "lookbook",
    label: "Lookbook",
    content: {
      badge: "Lookbook",
      headline: "CURATED LOOKS",
      description: "Pre-styled outfits designed to inspire your next fit.",
      looks: [
        { title: "Urban Edge", description: "Oversized silhouettes meet sharp tailoring", gradient: "from-orange-500/20 via-black to-zinc-900", accent: "bg-orange-500" },
        { title: "Midnight Luxe", description: "Dark tones elevated with premium textures", gradient: "from-zinc-900 via-black to-zinc-800", accent: "bg-zinc-400" },
        { title: "Street Minimal", description: "Clean lines, bold statements, zero compromise", gradient: "from-black via-zinc-900 to-orange-500/10", accent: "bg-orange-500" }
      ],
      ctaText: "View Full Lookbook",
      ctaLink: "/collection"
    }
  },
  {
    key: "newsletter",
    label: "Newsletter",
    content: {
      badge: "Stay Connected",
      headline: "NEVER MISS A DROP",
      description: "Be the first to know about new collections, exclusive drops, and limited-edition releases.",
      placeholder: "Enter your email",
      buttonText: "Subscribe",
      successMessage: "✓ You're in! Welcome to the Veldic community.",
      errorMessage: "Please enter a valid email address.",
      disclaimer: "No spam. Unsubscribe anytime. We respect your inbox."
    }
  },
  {
    key: "social-feed",
    label: "Social Feed",
    content: {
      badge: "Social",
      headline: "FOLLOW THE MOVEMENT",
      description: "Tag us in your fits for a chance to be featured.",
      posts: [
        { id: 1, label: "@veldicwear", gradient: "from-orange-500/20 to-black" },
        { id: 2, label: "#VELDIC", gradient: "from-zinc-800 to-black" },
        { id: 3, label: "STREET STYLE", gradient: "from-black to-orange-500/10" },
        { id: 4, label: "DROP 015", gradient: "from-zinc-900 to-black" },
        { id: 5, label: "COMMUNITY", gradient: "from-black to-zinc-800" },
        { id: 6, label: "EXCLUSIVE", gradient: "from-orange-500/10 to-zinc-900" }
      ],
      ctaLabel: "@veldicwear",
      ctaLink: "https://instagram.com/veldicwear"
    }
  },
  {
    key: "footer",
    label: "Footer",
    content: {
      brandName: "VELDIC WEAR",
      brandDescription: "Performance-driven apparel engineered for the relentless. Train. Dominate. Repeat.",
      shopLinks: [
        { label: "All Products", href: "/shop" },
        { label: "Collections", href: "/collection" },
        { label: "New Arrivals", href: "/shop?category=new-arrivals" },
        { label: "Limited Edition", href: "/shop?category=limited" }
      ],
      supportLinks: [
        { label: "Contact", href: "/contact" },
        { label: "FAQ", href: "/faq" },
        { label: "Shipping & Returns", href: "/shipping" },
        { label: "Size Guide", href: "/size-guide" }
      ],
      companyLinks: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Press", href: "/press" }
      ],
      socialLinks: [
        { platform: "Instagram", href: "https://instagram.com/veldicwear", ariaLabel: "Instagram" },
        { platform: "Twitter", href: "https://twitter.com/veldicwear", ariaLabel: "Twitter / X" },
        { platform: "TikTok", href: "https://tiktok.com/@veldicwear", ariaLabel: "TikTok" },
        { platform: "YouTube", href: "https://youtube.com/@veldicwear", ariaLabel: "YouTube" }
      ],
      paymentMethods: ["Visa", "MC", "Amex", "PayPal", "Apple Pay"],
      bottomLinks: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" }
      ]
    }
  },
  {
    key: "categories-header",
    label: "Categories Section Header",
    content: {
      badge: "Collections",
      headline: "SHOP BY COLLECTION",
      description: "From statement outerwear to everyday essentials — find your look."
    }
  }
];

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Create products with variants and images
  for (const productData of products) {
    const { variants, images, ...productFields } = productData;
    const product = await prisma.product.create({
      data: {
        ...productFields,
        variants: {
          create: variants,
        },
        images: {
          create: images,
        },
      },
    });
    console.log(`  Created product: ${product.name} (${product.id})`);
  }

  // Seed default site sections
  for (const section of defaultSections) {
    await prisma.siteSection.upsert({
      where: { key: section.key },
      update: {
        label: section.label,
        content: JSON.stringify(section.content),
        published: true,
      },
      create: {
        key: section.key,
        label: section.label,
        content: JSON.stringify(section.content),
        published: true,
      },
    });
    console.log(`  Seeded section: ${section.label} (${section.key})`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });