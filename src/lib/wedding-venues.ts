export type WeddingVenueGroup = {
  description: string;
  title: string;
  venues: Array<{
    city: string;
    name: string;
  }>;
};

export const weddingVenueGroups: WeddingVenueGroup[] = [
  {
    title: "Foothills and Hickory-area venues",
    description:
      "These venues help reinforce Sam Visual's presence around Hickory, Cleveland, Morganton, Granite Falls, Maiden, and nearby foothills wedding markets.",
    venues: [
      { name: "Fields at Skycrest", city: "Cleveland, North Carolina" },
      { name: "Hidden Hill", city: "Morganton, North Carolina" },
      { name: "The Lumen House", city: "Cleveland, North Carolina" },
      { name: "The Barn at Blue Sky Farm", city: "Dallas, North Carolina" },
      { name: "Providence Cotton Mill", city: "Maiden, North Carolina" },
      { name: "Red Cedar Farm", city: "Granite Falls, North Carolina" },
    ],
  },
  {
    title: "Charlotte, Piedmont, and Triangle venues",
    description:
      "This group supports venue-related wedding searches tied to Charlotte, Cary, Mount Pleasant, and surrounding North Carolina markets.",
    venues: [
      { name: "Alexander Homestead", city: "Charlotte, North Carolina" },
      { name: "The Duke Mansion", city: "Charlotte, North Carolina" },
      { name: "The Upchurch", city: "Cary, North Carolina" },
      { name: "The Farmstead", city: "Mt Pleasant, North Carolina" },
    ],
  },
  {
    title: "Mountain, vineyard, and destination venues",
    description:
      "These venues add range across destination-style weddings, mountain venues, vineyards, estates, and coastal celebrations throughout North Carolina.",
    venues: [
      { name: "The Rumbling Bald", city: "Lake Lure, North Carolina" },
      { name: "The Fussel Estate", city: "Wilbar, North Carolina" },
      { name: "Wrightsville Manor", city: "Wilmington, North Carolina" },
      { name: "Serre Vineyard", city: "Mt Airy, North Carolina" },
      { name: "The White Crow Barn", city: "Banner Elk, North Carolina" },
    ],
  },
];
