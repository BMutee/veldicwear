import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

// Only three product photos ship in public/products (hoodie.jpg, tshirt.jpg,
// jacket.jpg). Products without a dedicated photo (jeans, beanie, bag) reuse a
// real, existing photo as a placeholder so /_next/image never 404s/400s — and
// the mapping spreads them across the three files so a product grid doesn't
// show triplicates. Gallery rows likewise reuse each product's main photo.
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
      { color: "Black", url: "/products/hoodie.jpg" },
      { color: "Black", url: "/products/hoodie.jpg" },
      { color: "Gray", url: "/products/hoodie.jpg" },
      { color: "Gray", url: "/products/hoodie.jpg" },
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
      { color: "White", url: "/products/tshirt.jpg" },
      { color: "Black", url: "/products/tshirt.jpg" },
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
      { color: "Black", url: "/products/jacket.jpg" },
      { color: "Olive", url: "/products/jacket.jpg" },
    ],
  },
  {
    name: "Slim Fit Jeans",
    description: "Modern slim-fit jeans with a comfortable stretch fabric.",
    image: "/products/tshirt.jpg",
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
      { color: "Indigo", url: "/products/tshirt.jpg" },
      { color: "Black", url: "/products/tshirt.jpg" },
    ],
  },
  {
    name: "Wool Beanie",
    description: "Classic knitted wool beanie to keep you warm in style.",
    image: "/products/hoodie.jpg",
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
      { color: "Black", url: "/products/hoodie.jpg" },
      { color: "Gray", url: "/products/hoodie.jpg" },
    ],
  },
  {
    name: "Leather Crossbody Bag",
    description: "Sleek genuine leather crossbody bag for everyday carry.",
    image: "/products/jacket.jpg",
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
      { color: "Black", url: "/products/jacket.jpg" },
      { color: "Brown", url: "/products/jacket.jpg" },
    ],
  },
];

const defaultSections = [
  {
    key: "navbar",
    label: "Navbar",
    content: {
      navLinks: [
        { label: "Shop", href: "/shop" },
        { label: "Collections", href: "/collection" },
        { label: "About", href: "/about" },
      ],
      styles: {
        height: { mobile: 64, desktop: 64 },
        paddingX: { mobile: 24, desktop: 64 },
        backgroundColor: "#171512",
        textColor: "#FAFAF8",
        linkColor: "#CDCCCA",
        linkHoverColor: "#FAFAF8",
      },
    },
  },
  {
    key: "hero",
    label: "Hero",
    content: {
      heroTitle: "Wear the ground\nyou cover",
      heroSubtitle: "Premium lifestyle & activewear for every journey.",
      heroTagline: "First on the terrain",
      heroImage: "/products/jacket.jpg",
      heroButtonText: "Shop new arrivals",
      heroButtonLink: "/shop",
      trustProductCount: "200+",
      trustMemberCount: "50K+",
      trustRating: "4.9",
      styles: {
        paddingTop: { mobile: 64, desktop: 96 },
        paddingBottom: { mobile: 32, desktop: 48 },
        paddingX: { mobile: 24, desktop: 64 },
        backgroundColor: "#FAFAF8",
        textColor: "#171512",
        headlineFontSize: { mobile: 40, desktop: 96 },
      },
    },
  },
  {
    key: "banner",
    label: "Banner",
    content: {
      heading: "Free Shipping on Every Order",
      subtext: "No minimums, no surprises — always free.",
      cta: { label: "Shop Now", link: "/shop" },
      styles: {
        paddingTop: { mobile: 24, desktop: 40 },
        paddingBottom: { mobile: 24, desktop: 40 },
        paddingX: { mobile: 16, desktop: 24 },
        backgroundColor: "#171512",
        textColor: "#FAFAF8",
        headingFontSize: { mobile: 20, desktop: 28 },
        ctaBackgroundColor: "#CA8A04",
        ctaTextColor: "#FAFAF8",
      },
    },
  },
  {
    key: "brand-story",
    label: "Brand Story",
    content: {
      badge: "Our story",
      headline: "Built for the\nground you cover",
      headlineAccent: "ground you cover",
      paragraphs: [
        "Veldic Wear is rooted in the open terrain — the veld, the trail, the long way home. We design for the journey, not the image.",
        "Every piece is cut from premium fabrics, made to move with you and last beyond the season. Built for the ground, not the gym mirror.",
        "This is clothing for people who measure progress in miles and mornings, not hype."
      ],
      stats: [
        { value: "2018", label: "Founded" },
        { value: "40+", label: "Drops" },
        { value: "100%", label: "Ground-ready" }
      ],
      ctaText: "Read our story",
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
        { id: 1, title: "Low Ground", description: "Easy layers for everyday terrain", background: "bg-stone/10", accent: "bg-moss" },
        { id: 2, title: "Mid Ground", description: "Versatile pieces for shifting weather", background: "bg-stone/20", accent: "bg-moss" },
        { id: 3, title: "High Ground", description: "Technical kit for the long way up", background: "bg-stone/30", accent: "bg-moss" }
      ],
      ctaText: "View full lookbook",
      ctaLink: "/collection"
    }
  },
  {
    key: "newsletter",
    label: "Newsletter",
    content: {
      badge: "Stay connected",
      headline: "Never miss a drop",
      description: "Be the first to know about new collections, exclusive drops, and limited-edition releases.",
      placeholder: "Enter your email",
      buttonText: "Subscribe",
      successMessage: "You're in! Welcome to the Veldic community.",
      errorMessage: "Please enter a valid email address.",
      disclaimer: "No spam. Unsubscribe anytime."
    }
  },
  {
    key: "social-feed",
    label: "Social Feed",
    content: {
      badge: "Social",
      headline: "Follow the journey",
      description: "Tag us in your fits for a chance to be featured.",
      posts: [
        { id: 1, label: "@veldicwear", gradient: "from-orange-500/20 to-black" },
        { id: 2, label: "#VELDIC", gradient: "from-zinc-800 to-black" },
        { id: 3, label: "TRAIL READY", gradient: "from-ink to-moss/10" },
        { id: 4, label: "DROP 015", gradient: "from-stone/20 to-ink" },
        { id: 5, label: "COMMUNITY", gradient: "from-ink to-stone/30" },
        { id: 6, label: "EXCLUSIVE", gradient: "from-moss/10 to-stone/20" }
      ],
      ctaLabel: "@veldicwear",
      ctaLink: "https://instagram.com/veldicwear"
    }
  },
  {
    key: "featured-products",
    label: "Featured Products",
    content: {
      featuredSectionTitle: "New Arrivals",
      featuredSectionSubtitle: "Considered pieces, built to last.",
      styles: {
        paddingTop: { mobile: 48, desktop: 96 },
        paddingBottom: { mobile: 48, desktop: 96 },
        paddingX: { mobile: 24, desktop: 24 },
        backgroundColor: "#FAFAF8",
        textColor: "#171512",
        headingFontSize: { mobile: 32, desktop: 48 },
      },
    },
  },
  {
    key: "footer",
    label: "Footer",
    content: {
      brandDescription: "Premium lifestyle & activewear for every journey. Wear the ground you cover.",
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
      paymentMethods: ["Visa", "MC", "Amex", "PayPal", "Apple Pay"],
      styles: {
        paddingTop: { mobile: 40, desktop: 64 },
        paddingBottom: { mobile: 40, desktop: 64 },
        paddingX: { mobile: 24, desktop: 24 },
        backgroundColor: "#171512",
        textColor: "#FAFAF8",
        linkColor: "#A8A29E",
        linkHoverColor: "#FAFAF8",
      }
    }
  },
  {
    key: "categories-header",
    label: "Categories Section Header",
    content: {
      badge: "Collections",
      headline: "Shop by terrain",
      description: "From low ground to high ground — find your journey."
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

  // The Hero is a Block owned by SiteSection("hero") via `sectionKey`.
  // Mirror the one-time migration so fresh DBs get the block too.
  const heroSection = defaultSections.find((section) => section.key === "hero");
  if (heroSection) {
    const heroContent = heroSection.content as {
      heroTitle: string; heroSubtitle: string; heroTagline: string; heroImage: string;
      heroButtonText: string; heroButtonLink: string; trustProductCount: string;
      trustMemberCount: string; trustRating: string; styles: Record<string, unknown>;
    };
    const heroBlockContent = {
      heading: heroContent.heroTitle,
      subtext: heroContent.heroSubtitle,
      backgroundImage: { src: heroContent.heroImage, alt: "" },
      cta: { label: heroContent.heroButtonText, url: heroContent.heroButtonLink },
      tagline: heroContent.heroTagline,
      trustProductCount: heroContent.trustProductCount,
      trustMemberCount: heroContent.trustMemberCount,
      trustRating: heroContent.trustRating,
    };
    const existingHeroBlock = await prisma.block.findFirst({ where: { sectionKey: "hero", type: "HERO" }, orderBy: { order: "asc" } });
    const heroStyles = heroContent.styles as Prisma.InputJsonValue;
    if (existingHeroBlock) {
      await prisma.block.update({ where: { id: existingHeroBlock.id }, data: { content: heroBlockContent, styles: heroStyles } });
    } else {
      await prisma.block.create({ data: { section: { connect: { key: "hero" } }, type: "HERO", order: 0, content: heroBlockContent, styles: heroStyles } });
    }
    console.log("  Seeded hero block (sectionKey: hero)");
  }

  // The Banner is also a Block owned by SiteSection("banner") via `sectionKey`,
  // reusing the HERO type ("Banner = Hero without a mandatory background
  // image"). Mirror the one-time migration so fresh DBs get the block too.
  const bannerSection = defaultSections.find((section) => section.key === "banner");
  if (bannerSection) {
    const bannerContent = bannerSection.content as {
      heading: string; subtext: string; cta: { label: string; link: string };
      styles: Record<string, unknown>;
    };
    const styles = bannerContent.styles as Record<string, unknown>;
    const { ctaBackgroundColor, ctaTextColor, ...stylesWithoutCtaColors } = styles;
    const bannerBlockContent = {
      heading: bannerContent.heading,
      subtext: bannerContent.subtext,
      cta: {
        label: bannerContent.cta.label,
        url: bannerContent.cta.link,
        ...(typeof ctaBackgroundColor === "string" ? { ctaBackgroundColor } : {}),
        ...(typeof ctaTextColor === "string" ? { ctaTextColor } : {}),
      },
      // backgroundImage deliberately omitted — the banner never shows an image.
    };
    const existingBannerBlock = await prisma.block.findFirst({ where: { sectionKey: "banner", type: "HERO" }, orderBy: { order: "asc" } });
    const bannerStyles = stylesWithoutCtaColors as Prisma.InputJsonValue;
    if (existingBannerBlock) {
      await prisma.block.update({ where: { id: existingBannerBlock.id }, data: { content: bannerBlockContent, styles: bannerStyles } });
    } else {
      await prisma.block.create({ data: { section: { connect: { key: "banner" } }, type: "HERO", order: 0, content: bannerBlockContent, styles: bannerStyles } });
    }
    console.log("  Seeded banner block (sectionKey: banner)");
  }

  // FeaturedProducts is now a FEATURED_PRODUCTS block owned by
  // SiteSection("featured-products") — mirror the one-time migration so fresh
  // DBs get the block too, seeded from the currently-featured products in
  // display order.
  const featuredSection = defaultSections.find((section) => section.key === "featured-products");
  if (featuredSection) {
    const featuredContent = featuredSection.content as {
      featuredSectionTitle: string;
      featuredSectionSubtitle: string;
      styles: Record<string, unknown>;
    };
    const featuredRows = await prisma.product.findMany({ take: 8, where: { featured: true }, orderBy: { createdAt: "desc" }, select: { id: true } });
    const liveRows = featuredRows.length > 0 ? featuredRows : await prisma.product.findMany({ take: 8, orderBy: { createdAt: "desc" }, select: { id: true } });
    const featuredBlockContent = {
      productIds: liveRows.map((p) => p.id),
      featuredSectionTitle: featuredContent.featuredSectionTitle,
      featuredSectionSubtitle: featuredContent.featuredSectionSubtitle,
    };
    const featuredBlockStyles = featuredContent.styles as Prisma.InputJsonValue;
    const existingFeaturedBlock = await prisma.block.findFirst({ where: { sectionKey: "featured-products", type: "FEATURED_PRODUCTS" }, orderBy: { order: "asc" } });
    if (existingFeaturedBlock) {
      await prisma.block.update({ where: { id: existingFeaturedBlock.id }, data: { content: featuredBlockContent, styles: featuredBlockStyles } });
    } else {
      await prisma.block.create({ data: { section: { connect: { key: "featured-products" } }, type: "FEATURED_PRODUCTS", order: 0, content: featuredBlockContent, styles: featuredBlockStyles } });
    }
    console.log("  Seeded featured-products block (sectionKey: featured-products)");
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