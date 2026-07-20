export type WeddingTestimonial = {
  author: string;
  featured?: boolean;
  quote: string;
  rating: 5;
  source: "Facebook" | "WeddingWire";
};

export const weddingTestimonials: WeddingTestimonial[] = [
  {
    author: "Tricia Buckingham",
    featured: true,
    quote:
      "Sam was extremely communicative, professional, and made sure to catch both the important moments and the fun, silly moments that made our wedding day feel so special.",
    rating: 5,
    source: "Facebook",
  },
  {
    author: "Pa Cua V. Moua",
    quote:
      "Sam and his team were absolutely wonderful to work with and extremely professional. We left everything in Sam's hands and he definitely delivered.",
    rating: 5,
    source: "Facebook",
  },
  {
    author: "Sequoyah Entertainment",
    quote: "Wonderful to work with. Super friendly and very professional. Highly recommended for weddings.",
    rating: 5,
    source: "Facebook",
  },
  {
    author: "Jessica Sola",
    featured: true,
    quote:
      "Sam was very personable and wanted to get to know us so our wedding video would feel different from others. He brings out all of the details from the wedding day that made it our best day ever.",
    rating: 5,
    source: "Facebook",
  },
  {
    author: "Alea Castelucci Thomas",
    featured: true,
    quote:
      "Sam was organized, responsive, and made us feel confident and comfortable in front of the camera. Our video is breathtaking and tells the story of our wedding day perfectly.",
    rating: 5,
    source: "Facebook",
  },
  {
    author: "Holly McManus",
    quote:
      "Sam and his team are amazing. Their work speaks for itself, and we could not wait to see our wedding video after working with them.",
    rating: 5,
    source: "Facebook",
  },
  {
    author: "Lauren Burns Benson",
    quote:
      "Sam and his team were an absolute joy to work with. They captured our wedding day perfectly and were so flexible while we had to replan our day.",
    rating: 5,
    source: "Facebook",
  },
  {
    author: "Mikayla Millard",
    featured: true,
    quote:
      "We had an excellent experience with Sam Visual. Communication was great every step of the way, and everyone who has seen our wedding video has been blown away.",
    rating: 5,
    source: "Facebook",
  },
  {
    author: "Mao True Yang",
    quote: "Awesome person inside and out, with great professional work.",
    rating: 5,
    source: "Facebook",
  },
  {
    author: "Maokiee Lauj",
    quote:
      "I could not be happier recommending Sam as a videographer. He was easy to work with, full of ideas, hilarious, and went above and beyond with his videography skills.",
    rating: 5,
    source: "Facebook",
  },
  {
    author: "Lena Ly",
    quote:
      "Sam is very detailed, wants the best shot possible, and is genuinely a great person to be around. I highly recommend Sam.",
    rating: 5,
    source: "Facebook",
  },
  {
    author: "Samuel G. Wall",
    quote: "Great company. Great people.",
    rating: 5,
    source: "Facebook",
  },
  {
    author: "Vaj Nkauj Ntsum",
    quote:
      "Sam is so talented, easy to work with, very professional, and sweet. I would highly recommend him.",
    rating: 5,
    source: "Facebook",
  },
  {
    author: "Lindsey",
    featured: true,
    quote:
      "Our favorite vendor. Sam and his team were worth every penny, captured our wedding beautifully, and were the best people to have by our side on such a special day.",
    rating: 5,
    source: "WeddingWire",
  },
  {
    author: "Chong Lor",
    featured: true,
    quote:
      "Each video is more breathtaking than the last. Sam captures precious moments in ways I never could imagine and tells love stories through the production of the wedding day like no one else.",
    rating: 5,
    source: "WeddingWire",
  },
];

export const featuredWeddingTestimonials = weddingTestimonials.filter((item) => item.featured);
