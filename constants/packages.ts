// Shared package definitions for BookingPortal and PricingSection

export interface PackageDefinition {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice: number;
  badge?: string;
  description: string;
  paymentPlan: string;
  features: string[];
  cta: string;
  bonus: string;
}

// Helper function to calculate deposit based on price
export const calculateDeposit = (price: number): number => {
  return price >= 5000 ? price * 0.3 : price * 0.5;
};

// Helper to get deposit percentage
export const getDepositPercentage = (price: number): number => {
  return price >= 5000 ? 30 : 50;
};

export const packages: PackageDefinition[] = [
  {
    id: "pilot",
    name: "Pilot Episode",
    tagline: "Test the Format",
    price: 2500,
    originalPrice: 4000,
    description: "Test the reality-style format",
    paymentPlan: "50% deposit | Balance before editing",
    features: [
      "Choose: YouTube-style series OR short-form ads",
      "1 brand story piece (reality-style documentary)",
      "Strategy session included",
      "Social media cuts",
      "Cinematic lighting + motion",
      "Vision session + scripting",
      "1 filming day",
      "One revision round",
    ],
    cta: "Launch Pilot",
    bonus: "Perfect for testing reality-style content",
  },
  {
    id: "mini-series",
    name: "Mini-Series",
    tagline: "Build Momentum",
    badge: "MOST POPULAR",
    price: 5500,
    originalPrice: 9000,
    description: "Build momentum with episodic content",
    paymentPlan: "40% deposit | Balance before editing",
    features: [
      "Choose: YouTube-style series OR short-form ads",
      "3-Episode reality-style campaign",
      "Weekly content rollout strategy",
      "Behind-the-scenes reels",
      "Multi-camera documentary setup",
      "Story framework + scripting",
      "Platform-specific formats",
      "Paid ad versions included",
      "Thumbnail + title strategy",
      "Multiple filming days",
      "Two revision rounds",
    ],
    cta: "Start Mini-Series",
    bonus: "Build a following with episodic content",
  },
  {
    id: "legacy",
    name: "Legacy Season",
    tagline: "Full Brand Show",
    badge: "FULL PRODUCTION",
    price: 10500,
    originalPrice: 18000,
    description: "Full brand show - turn your brand into a series",
    paymentPlan: "30% deposit | Balance before editing",
    features: [
      "Choose: YouTube-style series OR short-form ads",
      "6+ Episodes across multiple shoots",
      "Full creative direction + positioning",
      "Episodic story arc rollout",
      "Team + customer journey stories",
      "Multi-location production",
      "AI captions + reels formatting",
      "Podcast-ready companion clips",
      "Dedicated project manager",
      "Multiple filming days",
      "Unlimited revisions",
      "Raw footage + project files",
      "Quarterly strategy sessions",
    ],
    cta: "Build Your Season",
    bonus: "Turn your brand into a show people follow",
  },
];

// Custom package definition for BookingPortal
export const customPackage = {
  id: "custom",
  name: "Custom Package",
  price: 0,
  description: "Tailored to your specific needs",
  features: [
    "Custom duration",
    "Premium editing",
    "Custom deliverables",
    "Unlimited revisions",
    "Full creative control",
    "Priority support"
  ]
};

// Time slots for scheduling
export const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
];
