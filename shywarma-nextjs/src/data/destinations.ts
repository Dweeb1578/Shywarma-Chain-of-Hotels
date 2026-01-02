export interface Hotel {
    name: string;
    description: string;
    image: string;
    stars: number;
}

export interface Room {
    name: string;
    price: number;
    image: string;
    features: string[];
}

export interface Review {
    name: string;
    city: string;
    rating: number;
    text: string;
    date: string;
}

export interface TravelPackage {
    name: string;
    duration: string;
    price: number;
    description: string;
    inclusions: string[];
    image: string;
}

export interface Room {
    name: string;
    price: number;
    image: string;
    features: string[];
}

export interface Hotel {
    slug: string;
    name: string;
    description: string;
    image: string;
    stars: number;
    rooms: Room[];
    amenities: string[];
    reviews: Review[];
}

export interface Destination {
    slug: string;
    name: string;
    tagline: string;
    description: string;
    heroImage: string;
    hotels: Hotel[];
    // Keeping top-level rooms/amenities/reviews for destination page overview if needed, 
    // but ideally we should derive them or keep them for the "general" destination vibe.
    // For this refactor, we populate hotels fully.
    rooms: Room[];
    amenities: string[];
    reviews: Review[];
    packages: TravelPackage[];
}

export const destinations: Destination[] = [
    {
        slug: "maldives",
        name: "Maldives",
        tagline: "Paradise on Earth",
        description: "Experience the ultimate tropical escape in the Maldives, where crystal-clear turquoise waters meet pristine white sand beaches. Our exclusive resorts offer unparalleled luxury with overwater villas, world-class diving, and breathtaking sunsets that will leave you speechless.",
        heroImage: "/images/destinations/maldives.png",
        hotels: [
            {
                slug: "azure-lagoon",
                name: "Azure Lagoon Resort & Spa",
                description: "An iconic overwater retreat featuring 86 luxurious villas suspended above the pristine lagoon.",
                image: "/images/hotels/maldives-resort.png",
                stars: 5,
                rooms: [
                    { name: "Overwater Villa", price: 49999, image: "/images/rooms/ocean-suite.png", features: ["Private infinity pool", "Glass floor panels", "Direct lagoon access"] },
                    { name: "Sunset Ocean Suite", price: 79999, image: "/images/rooms/penthouse.png", features: ["Sunset view", "Large sundeck", "Jacuzzi", "Butler service"] }
                ],
                amenities: ["Underwater Restaurant", "Luxury Spa", "Diving Center", "Water Sports"],
                reviews: [
                    { name: "Rajesh Krishnamurthy", city: "Bengaluru", rating: 5, text: "Waking up to see fish swimming beneath our glass floor was magical.", date: "December 2025" },
                    { name: "Priya Sharma", city: "Mumbai", rating: 5, text: "The underwater restaurant experience was once-in-a-lifetime.", date: "November 2025" }
                ]
            },
            {
                slug: "coral-haven",
                name: "Coral Haven Private Island",
                description: "An exclusive private island experience with only 12 ultra-luxury villas for absolute privacy.",
                image: "/images/hotels/maldives-private.png",
                stars: 5,
                rooms: [
                    { name: "Beach Pool Residence", price: 99999, image: "/images/rooms/garden-villa.png", features: ["Private beach section", "Large pool", "Outdoor dining", "2 bedrooms"] },
                    { name: "Royal Island Villa", price: 199999, image: "/images/rooms/penthouse.png", features: ["3 bedrooms", "Private spa", "Private gym", "Chef on call"] }
                ],
                amenities: ["Private Cinema", "Yacht Charter", "Personal Chefs", "Helipad"],
                reviews: [
                    { name: "Amit Patel", city: "Ahmedabad", rating: 5, text: "Ultimate privacy. The service was telepathic - they knew what we wanted before we asked.", date: "October 2025" }
                ]
            }
        ],
        // General destination content (kept for Destination Page)
        rooms: [
            { name: "Overwater Villa", price: 49999, image: "/images/rooms/ocean-suite.png", features: ["Private infinity pool", "Glass floor panels", "Outdoor shower", "Direct lagoon access"] },
            { name: "Beach Pool Suite", price: 74999, image: "/images/rooms/penthouse.png", features: ["Private beach", "Plunge pool", "Outdoor dining pavilion", "Personal butler"] },
            { name: "Presidential Water Villa", price: 149999, image: "/images/rooms/garden-villa.png", features: ["2 bedrooms", "Private spa room", "Wine cellar", "Helicopter transfer"] }
        ],
        amenities: ["Infinity Pool", "Private Beach", "Underwater Restaurant", "Luxury Spa", "Water Sports Center", "Sunset Cruises", "Diving Center", "Private Cinema"],
        reviews: [
            { name: "Rajesh Krishnamurthy", city: "Bengaluru", rating: 5, text: "What an incredible experience! The overwater villa was beyond our expectations. Waking up to see fish swimming beneath our glass floor was magical. The staff remembered our anniversary and surprised us with a candlelit dinner on the beach. Truly unforgettable!", date: "December 2025" },
            { name: "Priya Sharma", city: "Mumbai", rating: 5, text: "We spent 5 nights here for our honeymoon and it was absolutely perfect. The underwater restaurant experience was once-in-a-lifetime. The sunset views from our villa made me cry happy tears. Already planning our next visit!", date: "November 2025" },
            { name: "Amit Patel", city: "Ahmedabad", rating: 4, text: "Fantastic resort with world-class amenities. The diving experience was excellent - saw manta rays and sea turtles! Only minor issue was WiFi being slow sometimes, but honestly, who needs internet when you have this view?", date: "October 2025" }
        ],
        packages: [
            {
                name: "Romantic Atolls Escape",
                duration: "5 Days / 4 Nights",
                price: 299999,
                description: "The ultimate honeymoon package. Includes a private sunset cruise, a candlelit dinner on a sandbank, and a couple's spa treatment.",
                inclusions: ["Overwater Villa Stay", "Seaplane Transfers", "Private Sunset Cruise", "Sandbank Dinner", "Couple's Spa"],
                image: "/images/destinations/maldives.png"
            },
            {
                name: "Deep Blue Adventure",
                duration: "7 Days / 6 Nights",
                price: 329999,
                description: "Dive into the wonders of the Indian Ocean. Includes guided diving excursions to protected reefs and a marine biology workshop.",
                inclusions: ["Beach Villa Stay", "All Meals", "5 Guided Dives", "Marine Biology Tour", "Night Fishing"],
                image: "/images/hotels/maldives-resort.png"
            }
        ]
    },
    {
        slug: "santorini",
        name: "Santorini",
        tagline: "Where Dreams Touch the Aegean",
        description: "Discover the magic of Santorini, where whitewashed buildings cascade down volcanic cliffs into the deep blue Aegean Sea.",
        heroImage: "/images/destinations/santorini.png",
        hotels: [
            {
                slug: "caldera-view",
                name: "Caldera View Suites",
                description: "Perched on the iconic cliffs of Oia, offering uninterrupted views of the famous Santorini sunset.",
                image: "/images/hotels/santorini-villa.png",
                stars: 5,
                rooms: [
                    { name: "Cave Suite", price: 34999, image: "/images/rooms/ocean-suite.png", features: ["Traditional cave design", "Caldera view", "Private terrace"] },
                    { name: "Infinity Suite", price: 54999, image: "/images/rooms/penthouse.png", features: ["Private infinity plunge pool", "Sunset view", "King bed"] }
                ],
                amenities: ["Sunset Terrace", "Cave Spa", "Wine Bar"],
                reviews: [
                    { name: "Sneha Reddy", city: "Hyderabad", rating: 5, text: "The sunset from our private terrace was the most beautiful thing I've ever seen.", date: "September 2025" }
                ]
            },
            {
                slug: "aegean-pearl",
                name: "Aegean Pearl Resort",
                description: "A stunning cliffside property in Fira with infinity pools that seem to merge with the sea.",
                image: "/images/hotels/santorini-resort.png",
                stars: 5,
                rooms: [
                    { name: "Pearl Suite", price: 44999, image: "/images/rooms/garden-villa.png", features: ["Sea view", "Jacuzzi", "Modern decor"] },
                    { name: "Honeymoon Loft", price: 64999, image: "/images/rooms/ocean-suite.png", features: ["2 floors", "Private balcony", "Champagne service"] }
                ],
                amenities: ["Michelin Restaurant", "Main Infinity Pool", "Concierge"],
                reviews: [
                    { name: "Vikram Singh", city: "Delhi", rating: 5, text: "Proposed to my girlfriend here. The staff made it perfect.", date: "August 2025" }
                ]
            }
        ],
        rooms: [
            { name: "Cave Suite", price: 34999, image: "/images/rooms/ocean-suite.png", features: ["Traditional cave design", "Private terrace", "Caldera view", "Jacuzzi"] },
            { name: "Honeymoon Villa", price: 54999, image: "/images/rooms/penthouse.png", features: ["Private plunge pool", "Sunset terrace", "Champagne on arrival", "Couples spa"] },
            { name: "Captain's House", price: 94999, image: "/images/rooms/garden-villa.png", features: ["2 floors", "Private infinity pool", "Panoramic views", "Personal concierge"] }
        ],
        amenities: ["Infinity Pool", "Cliffside Restaurant", "Wine Tasting", "Spa & Wellness", "Yacht Charters", "Sunset Lounge", "Art Gallery", "Cooking Classes"],
        reviews: [
            { name: "Sneha Reddy", city: "Hyderabad", rating: 5, text: "The Santorini sunset from our private terrace was the most beautiful thing I've ever seen. We spent 4 nights here and every moment felt like a dream. The Greek food was amazing - we still think about that lamb dish!", date: "September 2025" },
            { name: "Vikram Singh", city: "Delhi", rating: 5, text: "Proposed to my girlfriend here and she said yes! The hotel staff helped me arrange everything perfectly - rose petals, champagne, photographer hiding nearby. This place is pure romance. Worth every rupee!", date: "August 2025" },
            { name: "Ananya Nair", city: "Kochi", rating: 5, text: "As a solo female traveler, I felt completely safe and pampered here. The cave suite was unique and Instagram-worthy. The wine tasting tour with hotel guests was a great way to meet people. Highly recommend!", date: "October 2025" }
        ],
        packages: [
            {
                name: "Cycladic Romance",
                duration: "6 Days / 5 Nights",
                price: 219999,
                description: "Experience the romance of Santorini. Includes sunset wine tasting, a private catamaran cruise, and a photography tour of Oia.",
                inclusions: ["Cave Suite Stay", "Daily Breakfast", "Catamaran Cruise", "Wine Tasting Tour", "Airport Transfers"],
                image: "/images/hotels/santorini-villa.png"
            },
            {
                name: "Ancient History & Luxury",
                duration: "5 Days / 4 Nights",
                price: 179999,
                description: "Explore the ancient ruins of Akrotiri and relax in luxury. Includes guided historical tours and a culinary class.",
                inclusions: ["Luxury Resort Stay", "Akrotiri Tour", "Greek Cooking Class", "Car Rental", "Spa Voucher"],
                image: "/images/destinations/santorini.png"
            }
        ]
    },
    {
        slug: "dubai",
        name: "Dubai",
        tagline: "Where Luxury Knows No Limits",
        description: "Welcome to Dubai, a city that transforms impossible dreams into glittering reality.",
        heroImage: "/images/destinations/dubai.png",
        hotels: [
            {
                slug: "royal-palm",
                name: "The Royal Palm Tower",
                description: "A stunning 60-floor tower on Palm Jumeirah with sweeping views of the Arabian Gulf.",
                image: "/images/hotels/dubai-tower.png",
                stars: 5,
                rooms: [
                    { name: "Palm View Room", price: 39999, image: "/images/rooms/ocean-suite.png", features: ["Balcony", "Sea view", "Interactive TV"] },
                    { name: "Royal Suite", price: 89999, image: "/images/rooms/penthouse.png", features: ["Living room", "Butler", "Lounge access"] }
                ],
                amenities: ["Private Beach", "3 Pools", "Kids Club"],
                reviews: [
                    { name: "Karthik Iyer", city: "Chennai", rating: 5, text: "The view of Burj Khalifa from the lounge was spectacular.", date: "December 2025" }
                ]
            },
            {
                slug: "desert-oasis",
                name: "Desert Oasis Resort",
                description: "Escape to the serene Dubai desert in this ultra-luxury resort.",
                image: "/images/hotels/dubai-desert.png",
                stars: 5,
                rooms: [
                    { name: "Dune Villa", price: 49999, image: "/images/rooms/garden-villa.png", features: ["Private pool", "Desert view", "Fire pit"] },
                    { name: "Royal Tent", price: 114999, image: "/images/rooms/penthouse.png", features: ["Canvas canopy", "Antique furniture", "Private dining"] }
                ],
                amenities: ["Camel Rides", "Falconry", "Desert Spa"],
                reviews: [
                    { name: "Neha Kapoor", city: "Chandigarh", rating: 5, text: "The spa hammam experience was heavenly.", date: "November 2025" }
                ]
            }
        ],
        rooms: [
            { name: "Skyline Suite", price: 39999, image: "/images/rooms/ocean-suite.png", features: ["Floor-to-ceiling windows", "Burj Khalifa view", "Smart room controls", "Premium minibar"] },
            { name: "Palm View Penthouse", price: 89999, image: "/images/rooms/penthouse.png", features: ["Private terrace", "Piano lounge", "Personal chef available", "Limousine service"] },
            { name: "Royal Desert Villa", price: 179999, image: "/images/rooms/garden-villa.png", features: ["Private pool", "Desert views", "Camel stable", "24-hour butler"] }
        ],
        amenities: ["Rooftop Infinity Pool", "Private Beach", "Helipad", "Spa & Hammam", "Desert Safari", "Shopping Concierge", "Kids Club", "Business Center"],
        reviews: [
            { name: "Karthik Iyer", city: "Chennai", rating: 5, text: "Dubai never disappoints and this hotel took it to the next level! The view of Burj Khalifa from our room was spectacular. We did the desert safari through the hotel and it was the highlight of our trip. Kids loved the pool!", date: "December 2025" },
            { name: "Neha Kapoor", city: "Chandigarh", rating: 5, text: "This was my third time in Dubai but first time at this hotel. The service was impeccable - they upgraded us for our anniversary without us even asking! The spa hammam experience was heavenly. Will definitely return.", date: "November 2025" },
            { name: "Arjun Malhotra", city: "Jaipur", rating: 4, text: "Great hotel with amazing views. The breakfast buffet was extensive with lots of Indian options which we appreciated. Location is perfect for Dubai Mall. Slightly expensive but you get what you pay for!", date: "October 2025" }
        ],
        packages: [
            {
                name: "City & Sand",
                duration: "5 Days / 4 Nights",
                price: 199999,
                description: "The best of both worlds. Spend 2 nights in the city center and 2 nights in a luxury desert resort.",
                inclusions: ["City Hotel Stay", "Desert Resort Stay", "Burj Khalifa Tickets", "Desert Safari", "Private Transfers"],
                image: "/images/hotels/dubai-desert.png"
            },
            {
                name: "Ultimate Shopping spree",
                duration: "4 Days / 3 Nights",
                price: 149999,
                description: "A package designed for shopaholics. Includes a personal shopper, VIP access to malls, and spa treatments to relax after a long day.",
                inclusions: ["Downtown Hotel Stay", "Personal Shopper", "Mall Transfers", "Foot Massage", "High Tea"],
                image: "/images/destinations/dubai.png"
            }
        ]
    },
    {
        slug: "bali",
        name: "Bali",
        tagline: "Island of the Gods",
        description: "Immerse yourself in the mystical beauty of Bali, where ancient temples rise from emerald rice terraces.",
        heroImage: "/images/destinations/bali.png",
        hotels: [
            {
                slug: "ubud-rainforest",
                name: "Ubud Rainforest Retreat",
                description: "Nestled in the heart of Ubud's sacred monkey forest, this eco-luxury resort offers private villas.",
                image: "/images/hotels/bali-retreat.png",
                stars: 5,
                rooms: [
                    { name: "Jungle Villa", price: 24999, image: "/images/rooms/ocean-suite.png", features: ["Valley view", "Plunge pool", "Outdoor bath"] },
                    { name: "Treehouse Suite", price: 39999, image: "/images/rooms/penthouse.png", features: ["Elevated views", "Bamboo design", "Hammock"] }
                ],
                amenities: ["Yoga Shala", "River Pool", "Organic Garden"],
                reviews: [
                    { name: "Deepika Krishnan", city: "Coimbatore", rating: 5, text: "Morning yoga with jungle views was transformative.", date: "November 2025" }
                ]
            },
            {
                slug: "seminyak-palace",
                name: "Seminyak Beach Palace",
                description: "A beachfront paradise on Seminyak's golden sands.",
                image: "/images/hotels/bali-beach.png",
                stars: 5,
                rooms: [
                    { name: "Ocean Suite", price: 34999, image: "/images/rooms/garden-villa.png", features: ["Ocean front", "Large balcony", "Direct beach access"] },
                    { name: "Pool Villa", price: 49999, image: "/images/rooms/penthouse.png", features: ["Private pool", "Walled garden", "Gazebo"] }
                ],
                amenities: ["Beach Club", "Surfing Lessons", "Sunset Bar"],
                reviews: [
                    { name: "Rohit Gupta", city: "Lucknow", rating: 5, text: "The sunset from our villa was unreal.", date: "October 2025" }
                ]
            }
        ],
        rooms: [
            { name: "Jungle Pool Villa", price: 24999, image: "/images/rooms/ocean-suite.png", features: ["Private infinity pool", "Rainforest view", "Outdoor bathtub", "Yoga deck"] },
            { name: "Rice Terrace Suite", price: 39999, image: "/images/rooms/penthouse.png", features: ["Panoramic terrace", "Traditional decor", "Private garden", "Meditation room"] },
            { name: "Cliff Edge Villa", price: 79999, image: "/images/rooms/garden-villa.png", features: ["Ocean views", "Private beach access", "In-villa spa", "Personal chef"] }
        ],
        amenities: ["Yoga Pavilion", "Infinity Pool", "Traditional Spa", "Rice Terrace Tours", "Surf School", "Cooking Classes", "Temple Visits", "Organic Restaurant"],
        reviews: [
            { name: "Sanjay Mehta", city: "Pune", rating: 5, text: "Bali was our first international trip as a family and this hotel made it magical! The kids loved the pool and we loved the spa. The staff taught us about Balinese culture - we even attended a temple ceremony. Beautiful experience.", date: "December 2025" },
            { name: "Deepika Krishnan", city: "Coimbatore", rating: 5, text: "Came here for a yoga retreat and left as a changed person. The morning yoga sessions with jungle views were transformative. The food was incredible - fresh, healthy, and so flavorful. Already planning to come back!", date: "November 2025" },
            { name: "Rohit Gupta", city: "Lucknow", rating: 5, text: "The sunset from our villa was unreal. We did a cooking class and learned to make authentic Balinese dishes. The staff went above and beyond - they organized a surprise birthday cake for my wife. Highly recommend!", date: "October 2025" }
        ],
        packages: [
            {
                name: "Eat, Pray, Love",
                duration: "8 Days / 7 Nights",
                price: 139999,
                description: "A spiritual and cultural journey through Bali. Visit temples, healers, and enjoy organic food in Ubud.",
                inclusions: ["Ubud Villa Stay", "Yoga Classes", "Healer Visit", "Cooking Class", "Temple Tours"],
                image: "/images/hotels/bali-retreat.png"
            },
            {
                name: "Surf & Sun",
                duration: "5 Days / 4 Nights",
                price: 114999,
                description: "For the active traveler. Surf the best breaks in Uluwatu and relax in a beachfront villa.",
                inclusions: ["Beachfront Villa", "Surf Lessons", "Equipment Rental", "Beach Club Access", "Seafood Dinner"],
                image: "/images/destinations/bali.png"
            }
        ]
    },
    {
        slug: "paris",
        name: "Paris",
        tagline: "The City of Light & Love",
        description: "Fall in love with Paris, the eternal city of romance, art, and gastronomy.",
        heroImage: "/images/destinations/paris.png",
        hotels: [
            {
                slug: "maison-royale",
                name: "Le Maison Royale",
                description: "A historic 18th-century mansion transformed into an intimate luxury hotel steps from the Louvre.",
                image: "/images/hotels/paris-boutique.png",
                stars: 5,
                rooms: [
                    { name: "Classic Room", price: 32999, image: "/images/rooms/ocean-suite.png", features: ["Courtyard view", "Antique decor", "Marble bath"] },
                    { name: "Royal Suite", price: 79999, image: "/images/rooms/penthouse.png", features: ["Separate living", "High ceilings", "Fireplace"] }
                ],
                amenities: ["Tea Salon", "Library", "Secret Garden"],
                reviews: [
                    { name: "Pooja Agarwal", city: "Indore", rating: 4, text: "Beautiful historic hotel with character.", date: "September 2025" }
                ]
            },
            {
                slug: "eiffel-palace",
                name: "Tour Eiffel Palace",
                description: "Contemporary luxury with panoramic Eiffel Tower views from every room.",
                image: "/images/hotels/paris-tower.png",
                stars: 5,
                rooms: [
                    { name: "Tower View Room", price: 49999, image: "/images/rooms/garden-villa.png", features: ["Direct Eiffel view", "Balcony", "Modern design"] },
                    { name: "Penthouse", price: 149999, image: "/images/rooms/penthouse.png", features: ["360 view", "Rooftop terrace", "Jacuzzi"] }
                ],
                amenities: ["Rooftop Bar", "Spa", "Limousine"],
                reviews: [
                    { name: "Meera Bose", city: "Kolkata", rating: 5, text: "The Eiffel Tower view from our balcony was breathtaking.", date: "December 2025" }
                ]
            }
        ],
        rooms: [
            { name: "Parisian Suite", price: 32999, image: "/images/rooms/ocean-suite.png", features: ["Eiffel Tower view", "Marble bathroom", "Nespresso machine", "French balcony"] },
            { name: "Artist's Loft", price: 49999, image: "/images/rooms/penthouse.png", features: ["Duplex layout", "Art collection", "Rooftop access", "Welcome champagne"] },
            { name: "Royal Apartment", price: 114999, image: "/images/rooms/garden-villa.png", features: ["2 bedrooms", "Private terrace", "Butler service", "Antique furnishings"] }
        ],
        amenities: ["Michelin Restaurant", "Wine Cellar", "Spa & Beauty", "Private Tours", "Limousine Service", "Concierge", "Garden Terrace", "Art Gallery"],
        reviews: [
            { name: "Meera Bose", city: "Kolkata", rating: 5, text: "Paris lived up to every expectation and this hotel exceeded them! The Eiffel Tower view from our balcony was breathtaking, especially at night when it sparkles. The croissants at breakfast were the best I've ever had. Pure magic!", date: "December 2025" },
            { name: "Aditya Joshi", city: "Nagpur", rating: 5, text: "Took my parents here for their 30th anniversary. The hotel arranged a private dinner cruise on the Seine - my mom cried happy tears! The location is perfect - we walked everywhere. Staff spoke a little Hindi which was a lovely surprise.", date: "November 2025" },
            { name: "Pooja Agarwal", city: "Indore", rating: 4, text: "Beautiful historic hotel with so much character. The room was smaller than expected but very elegant. The concierge got us into a fully-booked restaurant - great connections! Would recommend for a romantic trip.", date: "September 2025" }
        ],
        packages: [
            {
                name: "Parisian Art & Culture",
                duration: "4 Days / 3 Nights",
                price: 129999,
                description: "Immerse yourself in art. Includes skip-the-line Louvre access, a guided Musée d'Orsay tour, and an art district walking tour.",
                inclusions: ["Boutique Hotel Stay", "Museum Passes", "Private Guide", "Seine Cruise", "Metro Pass"],
                image: "/images/destinations/paris.png"
            },
            {
                name: "Gastronomy of Paris",
                duration: "5 Days / 4 Nights",
                price: 169999,
                description: "A culinary adventure. Includes a market tour, a macaron making class, and a 5-course dinner at a Michelin-starred restaurant.",
                inclusions: ["Luxury Hotel Stay", "Cooking Class", "Food Tour", "Michelin Dinner", "Wine Tasting"],
                image: "/images/hotels/paris-boutique.png"
            }
        ]
    }
];

export function getDestinationBySlug(slug: string): Destination | undefined {
    return destinations.find(d => d.slug === slug);
}

export function getAllDestinationSlugs(): string[] {
    return destinations.map(d => d.slug);
}

export function getHotelBySlug(destinationSlug: string, hotelSlug: string): Hotel | undefined {
    const destination = getDestinationBySlug(destinationSlug);
    return destination?.hotels.find(h => h.slug === hotelSlug);
}

export function getAllHotelPaths(): { destinationSlug: string, hotelSlug: string }[] {
    const paths: { destinationSlug: string, hotelSlug: string }[] = [];
    destinations.forEach(d => {
        d.hotels.forEach(h => {
            paths.push({ destinationSlug: d.slug, hotelSlug: h.slug });
        });
    });
    return paths;
}
