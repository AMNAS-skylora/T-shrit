import type { StoreSettings } from "@/types/commerce";
import { publicEnv } from "@/lib/public-env";

export const localStoreSettings: StoreSettings = {
  homeHeroLayout: "original",
  homeCatalogLayout: "grid",
  homeFeaturedLayout: "motion",
  whatsappNumber: publicEnv.whatsappNumber,
  phoneNumber: publicEnv.phoneNumber,
  instagramUrl: publicEnv.instagramUrl,
  facebookUrl: publicEnv.facebookUrl,
  supportEmail: publicEnv.supportEmail,
  footerTagline: "Essentials without noise. Unisex clothing for everyday rotation.",
  homeProductHeroEnabled: true,
  homeProductSelectorEnabled: false,
  homeCustomOffersEnabled: true,
  homeFeaturedEnabled: true,
  homeAboutEnabled: true,
  homeAboutEyebrow: "",
  homeAboutTitle: "",
  homeAboutBody: "",
  homeAboutImages: [],
  homeAboutQualityPoints: [],
  homeCatalogEnabled: true,
  homeDealersEnabled: true,
  homeSpotlightEnabled: true,
  homeAnimationBarsEnabled: true,
  footerEnabled: true,
  announcementEnabled: false,
  announcementText: "",
  announcementButtonLabel: "SHOP NOW",
  announcementButtonHref: "/products",
  homeDefaultHeroEnabled: false,
  homeDefaultHeroLabel: "KLEID.IN / DAILY",
  homeDefaultHeroBrand: "KLEID.IN",
  homeDefaultHeroTitle: "EVERYDAY.\nON REPEAT.",
  homeDefaultHeroSubtitle:
    "Clean everyday pieces made for repeat wear.",
  homeDefaultHeroButtonLabel: "SHOP DAILY",
  homeDefaultHeroButtonHref: "/products",
  homeDefaultHeroImageUrl: "",
  homeDefaultHeroImagePlacement: { desktop: { scale: 100 }, mobile: { scale: 100 } },
  homeDefaultHeroImagePosition: "right",
  homeCatalogEyebrow: "CATALOG",
  homeCatalogTitle: "Products",
  homeBrandEyebrow: "KLEID.IN",
  homeBrandTitle: "ONE WARDROBE.\nNO LABELS.",
  homeAboutButtonLabel: "About us",
  homeDealersEyebrow: "DEALERS",
  homeDealersTitle: "Stock KLEID.IN.",
  homeDealersBody:
    "For retailers, resellers and independent stores. Ask for current availability, minimum quantities and dealer ordering.",
  homeDealersButtonLabel: "Explore dealers",
  homeDealerTags: ["Retailers", "Resellers", "Repeat orders"],
  homeSpotlightBadge: "Most loved",
  homeShowcaseProductUrls: [],
  aboutHeroEyebrow: "KLEID.IN / ABOUT",
  aboutHeroTitle: "Clothes for real rotation.",
  aboutHeroLead:
    "KLEID.IN is built around one simple idea: everyday clothes should be easier to choose, easier to combine and worth wearing again.",
  aboutHeroBody:
    "We focus on clean silhouettes, dependable fabrics and useful colours instead of unnecessary detail. The result is a wardrobe that feels calm, practical and personal.",
  aboutMissionEyebrow: "OUR MISSION",
  aboutMissionTitle:
    "Our mission is to build a tighter everyday wardrobe: fewer pieces that work harder across work, weekends and ordinary days.",
  aboutMissionBody:
    "We do not want to fill a wardrobe with noise. We want each piece to feel useful, easy to repeat and simple to combine with what someone already owns.",
  aboutPhilosophyEyebrow: "PRODUCT PHILOSOPHY",
  aboutPhilosophyTitle:
    "Every piece starts with how it will actually be worn.",
  aboutPhilosophyBody:
    "Shape, fabric, colour and comfort all need to make sense before anything decorative gets added.",
  aboutPrinciples: [
    {
      title: "Proportion",
      copy: "Relaxed where it helps and structured where it matters. Fits are designed to sit cleanly without feeling overworked.",
    },
    {
      title: "Fabric",
      copy: "Materials are chosen for comfort, repeat wear and a dependable everyday feel rather than short-lived novelty.",
    },
    {
      title: "Rotation",
      copy: "Colours and silhouettes are built to work together, so each piece can move easily through more than one look.",
    },
  ],
  aboutBuiltEyebrow: "BUILT FOR EVERYDAY",
  aboutBuiltTitle:
    "A KLEID.IN piece should feel useful after the first wear, the tenth wear and the fiftieth.",
  aboutBuiltBody:
    "Repeat wear is the standard. That means straightforward fits, useful colours and products designed to stay in rotation instead of being replaced by the next trend.",
  aboutFutureEyebrow: "WHERE WE ARE GOING",
  aboutFutureTitle:
    "We are building KLEID.IN as a focused everyday clothing brand.",
  aboutFutureBody:
    "The direction is simple: stronger core products, better fit choices and a cleaner way to shop directly with us.",
  aboutShopButtonLabel: "Shop the collection",
  aboutWhatsappButtonLabel: "Order on WhatsApp",
};
