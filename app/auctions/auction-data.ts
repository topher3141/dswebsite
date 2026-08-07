export type Auction = {
  id: string;
  title: string;
  subtitle: string;
  auctionUrl: string;
  imageUrl?: string;
  closesAt: string;
  pickupText: string;
  location: string;
  notes?: string;
};

export const auctions: Auction[] = [
  {
    id: "rasmus-r260551",
    title: "Overstock Outdoor Living, Appliances & Home Goods",
    subtitle: "Brand new, open-box, and overstock finds through our auction partner Rasmus.",
    auctionUrl: "https://www.rasmus.com/auctions/bH7jaBXmN8qTLbHskz2x/a/auction",
    imageUrl: "https://storage.googleapis.com/auction-engine-temp/bH7jaBXmN8qTLbHskz2x/auction-0.jpg",
    closesAt: "2026-08-18T11:07:00-04:00",
    pickupText: "Pickup is during our regular shopping hours, Thursday through Saturday after the auction closes. Please follow the pickup window listed for this auction.",
    location: "510 McCormick Drive Suite B Glen Burnie, MD 21061",
    notes: "18% buyer’s premium applies through Rasmus. All items are overstock/open-box items.",
  },
];
