export type ProductStatus = "active" | "draft" | "sold-out";
export type ProductOfferType = "sale-price" | "percentage" | "fixed";

export type ProductColorVariant = {
  name: string;
  value: string;
  image?: string;
  images?: string[];
  stock?: number;
  sizeStocks?: Record<string, number>;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  wholesaleSlug?: string;
  category: string;
  price: number;
  costPrice?: number;
  compareAtPrice?: number;
  offerEnabled?: boolean;
  offerType?: ProductOfferType;
  offerValue?: number;
  offerLabel?: string;
  offerBadge?: string;
  offerStartsAt?: string;
  offerEndsAt?: string;
  offerCountdown?: boolean;
  saleEndsAt?: string;
  saleLabel?: string;
  description: string;
  sizes: string[];
  colors: string[];
  colorVariants?: ProductColorVariant[];
  stock: number;
  wholesaleEnabled?: boolean;
  wholesalePrice?: number;
  wholesaleMinOrder?: number;
  featured: boolean;
  featuredSortOrder?: number;
  featuredAnimationEnabled?: boolean;
  animationSortOrder?: number;
  spotlight?: boolean;
  featuredImage?: string;
  showcaseBackgroundImage?: string;
  status: ProductStatus;
  image?: string;
  sortOrder?: number;
};

