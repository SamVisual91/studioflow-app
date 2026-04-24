export type PublicWorkItem = {
  slug: string;
  title: string;
  subtitle: string;
  image: string;
  videoSrc?: string;
  youtubeEmbedSrc?: string;
  client: string;
  category: string;
  summary: string;
  description: string;
  deliverables: string[];
  services: string[];
};

export type PublicWorkSection = {
  heading: string;
  items: PublicWorkItem[];
};

export const publicWorkSections: PublicWorkSection[] = [
  {
    heading: "Attractions & Destination Campaigns",
    items: [
      {
        slug: "lake-hickory-haunts-2026-promo",
        title: "Lake Hickory Haunts",
        subtitle: "2026 Promotional Video",
        image: "/brand/lake-hickory-haunts-horror-entrance.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/gN7idroeheo?si=wIbRzniFSdZN8GVw",
        client: "Lake Hickory Haunts",
        category: "Attractions & Destination Campaigns",
        summary: "Launch campaign creative built to make the season feel cinematic, intense, and memorable before opening night.",
        description:
          "This piece was designed to position the haunt as a full experience rather than just a quick attraction. The visual treatment leaned hard into atmosphere, energy, and world-building to give the audience something immersive before they ever stepped on site.",
        deliverables: ["Hero campaign film", "Cutdowns for social", "Launch thumbnail suite"],
        services: ["Creative direction", "Video production", "Campaign editing"],
      },
      {
        slug: "lake-hickory-haunts-midway-tour",
        title: "MIDWAY TOUR",
        subtitle: "Behind-The-Scenes Tour",
        image: "/brand/lake-hickory-haunts-midway-tour.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/-pVgWT1a-wM?si=FfJHXC8kHXtSx1hK",
        client: "Lake Hickory Haunts",
        category: "Attractions & Destination Campaigns",
        summary: "A walkthrough-style piece that lets audiences feel the scale, energy, and progression of the haunt before arrival.",
        description:
          "We shaped this video like a guided preview, mixing personality-driven hosting with atmospheric visuals to make the attraction feel bigger, more layered, and easier to imagine as a full night out.",
        deliverables: ["Hosted feature video", "Promo thumbnail", "Social teasers"],
        services: ["Direction", "On-location filming", "Post-production"],
      },
      {
        slug: "nightmare-factory-unleashed",
        title: "NIGHTMARE FACTORY",
        subtitle: "Horror Promo Campaign",
        image: "/brand/nightmare-factory-unleashed.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/39eVwaK9NIg?si=p4hFLA9h2J6ZskSL",
        client: "Lake Hickory Haunts",
        category: "Attractions & Destination Campaigns",
        summary: "High-intensity concept artwork and campaign imagery built to feel raw, unsettling, and instantly clickable.",
        description:
          "The goal here was to make the concept hit fast. We leaned into horror iconography, dramatic contrast, and urgency so the final piece could stop the scroll and immediately communicate the mood of the event.",
        deliverables: ["Campaign key art", "Promo concept visual", "Digital launch asset"],
        services: ["Creative concepting", "Compositing", "Campaign design"],
      },
      {
        slug: "lake-hickory-haunts-new-driveway",
        title: "NEW DRIVEWAY",
        subtitle: "Construction Update Video",
        image: "/brand/lake-hickory-haunts-new-driveway.png",
        videoSrc: "/work-videos/lake-hickory-haunts-new-driveway.mov",
        client: "Lake Hickory Haunts",
        category: "Attractions & Destination Campaigns",
        summary: "A practical update film that still feels polished enough to fit the larger brand experience.",
        description:
          "Even operational updates should look intentional. This piece was built to communicate access improvements clearly while still reinforcing the world and personality of the attraction brand.",
        deliverables: ["Update video", "Thumbnail art", "Short announcement edits"],
        services: ["Field production", "Messaging", "Edit delivery"],
      },
      {
        slug: "dreams-become-reality",
        title: "DREAMS BECOME REALITY",
        subtitle: "Documentary Series",
        image: "/brand/lake-hickory-haunts-dreams-reality.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/gdV8Lztzo5U?si=8jhjPXsoJkjosrb-",
        client: "Lake Hickory Haunts",
        category: "Attractions & Destination Campaigns",
        summary: "An episodic documentary-style concept centered on the story, ambition, and build process behind the attraction.",
        description:
          "This series frame gives the brand more depth by showing the people, decisions, and progress behind the spectacle. It turns development into a story audiences can follow and buy into over time.",
        deliverables: ["Series episode cover", "Doc-style campaign frame", "Launch creative"],
        services: ["Series concepting", "Brand storytelling", "Editorial design"],
      },
      {
        slug: "jonas-ridge-snow-tubing",
        title: "JONAS RIDGE",
        subtitle: "Snow Tubing Campaign",
        image: "/brand/jonas-ridge-tubing-thumbnail.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/UHG0nDxC8_I?si=4W4-Vw7NlsqyFcLq",
        client: "Jonas Ridge Snow Tubing",
        category: "Attractions & Destination Campaigns",
        summary: "Family-friendly winter promotion designed to sell the experience, not just the location.",
        description:
          "This campaign focuses on motion, joy, and destination energy. The creative direction was built to make the tubing lanes feel fast, bright, and memorable for both tourists and local families.",
        deliverables: ["Seasonal promo asset", "Thumbnail creative", "Tourism-ready campaign visuals"],
        services: ["Campaign production", "Lifestyle direction", "Brand visuals"],
      },
    ],
  },
  {
    heading: "Brand Launches & Commercials",
    items: [
      {
        slug: "bulova-octava",
        title: "Bulova Octava",
        subtitle: "Promotional Video",
        image: "/brand/bulova-octava-thumbnail.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/X1pbk-OQUSY?si=TQComvKPEF2qSdD5",
        client: "Bulova",
        category: "Brand Launches & Commercials",
        summary: "Luxury product visuals focused on texture, light, precision, and elevated presentation.",
        description:
          "The Octava campaign was built around premium movement and material detail. Every frame needed to feel expensive, intentional, and highly polished without losing the product’s edge.",
        deliverables: ["Hero product video", "Still campaign frame", "Luxury promo edits"],
        services: ["Commercial direction", "Product cinematography", "High-end retouching"],
      },
      {
        slug: "truly-ad",
        title: "TRULY AD",
        subtitle: "Advertising Video",
        image: "/brand/truly-flavor-thumbnail.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/Vyl5gB2rRhs?si=3wVjcUajxQN-K3ls",
        client: "Truly",
        category: "Brand Launches & Commercials",
        summary: "Flavor-forward campaign imagery built around freshness, energy, and bold visual contrast.",
        description:
          "This concept leaned into color, splash, and motion so the product felt cold, bright, and instantly craveable. The goal was clean commercial impact with enough personality to stand out.",
        deliverables: ["Product campaign visual", "Ad-ready motion frame", "Launch thumbnail"],
        services: ["Ad creative", "Product styling", "Commercial post"],
      },
      {
        slug: "jack-daniels-product-spot",
        title: "JACK DANIEL'S",
        subtitle: "Whiskey Product Spot",
        image: "/brand/jack-daniels-whiskey-thumbnail.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/c0aQdhn-hdU?si=7uxDlB-_UUccstC2",
        client: "Jack Daniel's",
        category: "Brand Launches & Commercials",
        summary: "A moody product-driven whiskey piece built around rich light, smoke, and premium texture.",
        description:
          "This spot uses controlled atmosphere and bold contrast to make the bottle feel iconic. The visual direction emphasizes warmth, weight, and a premium after-dark tone.",
        deliverables: ["Product spot visual", "Commercial thumbnail", "Campaign-ready still"],
        services: ["Product direction", "Lighting design", "Commercial compositing"],
      },
      {
        slug: "renowned-deck-building-game",
        title: "RENOWNED",
        subtitle: "Deck Building Game",
        image: "/brand/renowned-thumbnail.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/UmN1dD0WuQo?si=73buxyM4xuxXg3JZ",
        client: "Renowned",
        category: "Brand Launches & Commercials",
        summary: "Stylized tabletop game campaign art that makes the product feel collectible and world-driven.",
        description:
          "The creative direction here focused on immersion. Instead of a flat product shot, the campaign presents the game like an experience with atmosphere, energy, and strong visual identity.",
        deliverables: ["Product hero visual", "Launch art", "Campaign display asset"],
        services: ["Launch creative", "Product styling", "Brand visual design"],
      },
    ],
  },
  {
    heading: "Sports, Events & Community",
    items: [
      {
        slug: "camp-enterprise",
        title: "CAMP ENTERPRISE",
        subtitle: "Youth Leadership Campaign",
        image: "/brand/camp-enterprise-thumbnail.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/2skWobUFUss?si=1WSOAObk4dxlLf0w",
        client: "Camp Enterprise",
        category: "Sports, Events & Community",
        summary: "A youth-focused campaign that makes leadership programming feel modern, optimistic, and human.",
        description:
          "This work was built to feel welcoming, forward-looking, and energetic. The final visuals center real connection and momentum so the program feels worth joining, not just worth reading about.",
        deliverables: ["Program campaign visual", "Community promo asset", "Recruitment creative"],
        services: ["Community storytelling", "Campaign production", "Portrait-led direction"],
      },
      {
        slug: "kamikaze-flag-football",
        title: "KAMIKAZE",
        subtitle: "Flag Football Promo",
        image: "/brand/kamikaze-thumbnail.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/nbn62cJIyks?si=fxa17gEdefvOnULk",
        client: "Kamikaze",
        category: "Sports, Events & Community",
        summary: "Action-forward sports creative focused on speed, intensity, and a clear competitive edge.",
        description:
          "The visual treatment here emphasizes motion and impact. The goal was to make the team identity feel aggressive, focused, and cinematic in a single instant.",
        deliverables: ["Team promo visual", "Action campaign frame", "Sports graphic thumbnail"],
        services: ["Sports coverage", "Action composition", "Promotional design"],
      },
      {
        slug: "edm-nights",
        title: "EDM NIGHTS",
        subtitle: "Festival Promo",
        image: "/brand/edm-nights-thumbnail.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/VP1jlU9fJUo?si=eVoR6n4gAueGm3vS",
        client: "EDM Nights",
        category: "Sports, Events & Community",
        summary: "A nightlife campaign built around crowd scale, energy, and the feeling of a live room at full volume.",
        description:
          "This piece sells atmosphere first. We leaned into beams, contrast, movement, and crowd emotion so the event feels alive before the audience even buys a ticket.",
        deliverables: ["Festival promo art", "Event campaign image", "Nightlife visual"],
        services: ["Event direction", "Crowd coverage", "Promo design"],
      },
      {
        slug: "k-pop-eras",
        title: "K-POP ERAS",
        subtitle: "Nightlife Event Promo",
        image: "/brand/kpop-eras-night-thumbnail.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/WDc6YZ7MCO0?si=3NLqRiaMG9zDSDg4",
        client: "K-Pop Eras Night",
        category: "Sports, Events & Community",
        summary: "A stylized event promo built to feel colorful, high-energy, and immediately social-friendly.",
        description:
          "The visual direction here is all about excitement and identity. It blends performance energy with a sharp promotional feel to make the event look vibrant and must-attend.",
        deliverables: ["Event key art", "Social-ready campaign creative", "Promo thumbnail"],
        services: ["Nightlife branding", "Event promotion", "Visual direction"],
      },
      {
        slug: "horsepower-park",
        title: "HORSEPOWER PARK",
        subtitle: "Motorsports Promo",
        image: "/brand/horsepower-park-thumbnail.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/sKOg3X_mQo4?si=YEXJCAd57H-H6CBi",
        client: "Horsepower Park",
        category: "Sports, Events & Community",
        summary: "A dirt-heavy motorsports promo designed to feel loud, fast, and packed with adrenaline.",
        description:
          "This campaign centers dust, scale, and machine energy. The visuals were built to communicate motion and excitement at a glance while still feeling brand-ready.",
        deliverables: ["Motorsports promo art", "Action showcase image", "Campaign thumbnail"],
        services: ["Action sports coverage", "Campaign visuals", "Commercial editing"],
      },
    ],
  },
  {
    heading: "Portraits, Editorial & Keepsakes",
    items: [
      {
        slug: "kelly-editorial-portrait",
        title: "KELLY",
        subtitle: "Editorial Portrait",
        image: "/brand/kelly-thumbnail.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/G4o1xL-p71w?si=WrzPanMrSmUUcTS-",
        client: "Kelly",
        category: "Portraits, Editorial & Keepsakes",
        summary: "A light, airy portrait built to feel fashion-led while still staying approachable and soft.",
        description:
          "This portrait direction focuses on movement, negative space, and a strong editorial silhouette. The result feels refined, minimal, and naturally premium.",
        deliverables: ["Portrait key image", "Editorial cover frame", "Personal brand visual"],
        services: ["Portrait direction", "Editorial styling", "Photo finishing"],
      },
      {
        slug: "emma-golden-hour-portrait",
        title: "EMMA",
        subtitle: "Golden Hour Portrait",
        image: "/brand/emma-portrait-thumbnail.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/mfGcM9NW61M?si=nQ1xpB97FwM-UBp5",
        client: "Emma",
        category: "Portraits, Editorial & Keepsakes",
        summary: "A warm portrait session built around golden-hour light, texture, and calm emotion.",
        description:
          "This work leans into natural light and subtle mood. It’s less about spectacle and more about presence, tone, and letting the environment support the subject beautifully.",
        deliverables: ["Portrait session cover", "Editorial still", "Golden-hour campaign image"],
        services: ["Portrait photography", "Natural light direction", "Editorial retouching"],
      },
      {
        slug: "megan-soft-glow-portrait",
        title: "MEGAN",
        subtitle: "Soft Glow Portrait",
        image: "/brand/megan-portrait-thumbnail.png",
        client: "Megan",
        category: "Portraits, Editorial & Keepsakes",
        summary: "A beauty-focused portrait with softer tones, intimate framing, and polished simplicity.",
        description:
          "The visual direction here stays close and intentional. Soft light and gentle composition give the final image a clean luxury feel without overcomplicating it.",
        deliverables: ["Beauty portrait", "Editorial still", "Personal brand image"],
        services: ["Beauty photography", "Close portrait direction", "Soft-light editing"],
      },
      {
        slug: "stacey-sunlit-drive",
        title: "STACEY",
        subtitle: "Sunlit Drive Portrait",
        image: "/brand/stacey-drive-thumbnail.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/OyJqiLaFLW8?si=-viLEw5OJyAbKqRo",
        client: "Stacey",
        category: "Portraits, Editorial & Keepsakes",
        summary: "A vintage-leaning portrait concept with warm light, personality, and a lived-in sense of style.",
        description:
          "This piece feels cinematic without becoming too staged. The car interior, warm tones, and framing all work together to make the portrait feel timeless and personal.",
        deliverables: ["Portrait concept image", "Lifestyle still", "Editorial hero frame"],
        services: ["Portrait concepting", "Lifestyle direction", "Photo finishing"],
      },
      {
        slug: "em-shoreline-portrait",
        title: "EM",
        subtitle: "Shoreline Portrait",
        image: "/brand/em-shore-thumbnail.png",
        youtubeEmbedSrc: "https://www.youtube.com/embed/GporCfDKFE4?si=DzuzaGM5q371Ei-5",
        client: "Em",
        category: "Portraits, Editorial & Keepsakes",
        summary: "A shoreline portrait built around glow, softness, and a highly polished editorial finish.",
        description:
          "The focus here is on elegant simplicity. Warm backlight and a tight composition give the portrait a clean, elevated look that still feels human.",
        deliverables: ["Portrait campaign image", "Editorial still", "Sunset cover frame"],
        services: ["Portrait photography", "Editorial direction", "Retouching"],
      },
      {
        slug: "motion-books",
        title: "MOTION BOOKS",
        subtitle: "Wedding Keepsake Film",
        image: "/brand/motion-books-thumbnail.png",
        videoSrc: "/work-videos/motion-books-ceremony-film.mov",
        client: "Wedding Motion Books",
        category: "Portraits, Editorial & Keepsakes",
        summary: "A premium wedding keepsake concept that turns a film into something tactile, lasting, and giftable.",
        description:
          "This project showcases the kind of thoughtful presentation that elevates delivery. It’s less about the device itself and more about the emotional value of how the story is handed back to the client.",
        deliverables: ["Keepsake product visual", "Wedding detail feature", "Luxury delivery concept"],
        services: ["Product styling", "Wedding brand visuals", "Detail photography"],
      },
    ],
  },
];

export const publicWorks = publicWorkSections.flatMap((section) => section.items);

export function findPublicWorkBySlug(slug: string) {
  return publicWorks.find((item) => item.slug === slug);
}
