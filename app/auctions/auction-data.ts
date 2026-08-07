export type PickupWindow = {
  day: string;
  date: string;
  hours: string;
};

export type Auction = {
  id: string;
  title: string;
  subtitle: string;
  auctionUrl: string;
  imageUrl?: string;
  closesAt: string;
  pickupText?: string;
  pickupWindows?: PickupWindow[];
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
    pickupText: "Pickup is during our regular shopping hours after the auction closes.",
    pickupWindows: [
      {
        day: "Thursday",
        date: "8/20",
        hours: "1 PM - 7 PM",
      },
      {
        day: "Friday",
        date: "8/21",
        hours: "1 PM - 7 PM",
      },
      {
        day: "Saturday",
        date: "Aug 22",
        hours: "11 AM - 3 PM",
      },
    ],
    location: "510 McCormick Drive Suite B Glen Burnie, MD 21061",
    notes: "18% buyer’s premium applies through Rasmus. All items are overstock/open-box items.",
  },
];
