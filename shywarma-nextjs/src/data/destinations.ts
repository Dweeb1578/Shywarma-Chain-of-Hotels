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

export interface Destination {
    slug: string;
    name: string;
    tagline: string;
    description: string;
    heroImage: string;
    hotels: Hotel[];
    rooms: Room[];
    amenities: string[];
    reviews: Review[];
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
                name: "Azure Lagoon Resort & Spa",
                description: "An iconic overwater retreat featuring 86 luxurious villas suspended above the pristine lagoon. Each villa offers direct ocean access, glass floor panels, and panoramic sunset views.",
                image: "/images/hotels/maldives-resort.png",
                stars: 5
            },
            {
                name: "Coral Haven Private Island",
                description: "An exclusive private island experience with only 12 ultra-luxury villas. Perfect for those seeking absolute privacy and personalized butler service.",
                image: "/images/hotels/maldives-private.png",
                stars: 5
            }
        ],
        rooms: [
            { name: "Overwater Villa", price: 899, image: "/images/rooms/ocean-suite.png", features: ["Private infinity pool", "Glass floor panels", "Outdoor shower", "Direct lagoon access"] },
            { name: "Beach Pool Suite", price: 1199, image: "/images/rooms/penthouse.png", features: ["Private beach", "Plunge pool", "Outdoor dining pavilion", "Personal butler"] },
            { name: "Presidential Water Villa", price: 2499, image: "/images/rooms/garden-villa.png", features: ["2 bedrooms", "Private spa room", "Wine cellar", "Helicopter transfer"] }
        ],
        amenities: ["Infinity Pool", "Private Beach", "Underwater Restaurant", "Luxury Spa", "Water Sports Center", "Sunset Cruises", "Diving Center", "Private Cinema"],
        reviews: [
            { name: "Rajesh Krishnamurthy", city: "Bengaluru", rating: 5, text: "What an incredible experience! The overwater villa was beyond our expectations. Waking up to see fish swimming beneath our glass floor was magical. The staff remembered our anniversary and surprised us with a candlelit dinner on the beach. Truly unforgettable!", date: "December 2025" },
            { name: "Priya Sharma", city: "Mumbai", rating: 5, text: "We spent 5 nights here for our honeymoon and it was absolutely perfect. The underwater restaurant experience was once-in-a-lifetime. The sunset views from our villa made me cry happy tears. Already planning our next visit!", date: "November 2025" },
            { name: "Amit Patel", city: "Ahmedabad", rating: 4, text: "Fantastic resort with world-class amenities. The diving experience was excellent - saw manta rays and sea turtles! Only minor issue was WiFi being slow sometimes, but honestly, who needs internet when you have this view?", date: "October 2025" }
        ]
    },
    {
        slug: "santorini",
        name: "Santorini",
        tagline: "Where Dreams Touch the Aegean",
        description: "Discover the magic of Santorini, where whitewashed buildings cascade down volcanic cliffs into the deep blue Aegean Sea. Experience legendary sunsets, exquisite Greek cuisine, and romantic moments in one of the world's most photographed destinations.",
        heroImage: "/images/destinations/santorini.png",
        hotels: [
            {
                name: "Caldera View Suites",
                description: "Perched on the iconic cliffs of Oia, this boutique hotel offers uninterrupted views of the famous Santorini sunset. Traditional cave architecture meets modern luxury.",
                image: "/images/hotels/santorini-villa.png",
                stars: 5
            },
            {
                name: "Aegean Pearl Resort",
                description: "A stunning cliffside property in Fira with infinity pools that seem to merge with the sea. Features a world-renowned restaurant with Michelin-starred Greek cuisine.",
                image: "/images/hotels/santorini-resort.png",
                stars: 5
            }
        ],
        rooms: [
            { name: "Cave Suite", price: 599, image: "/images/rooms/ocean-suite.png", features: ["Traditional cave design", "Private terrace", "Caldera view", "Jacuzzi"] },
            { name: "Honeymoon Villa", price: 899, image: "/images/rooms/penthouse.png", features: ["Private plunge pool", "Sunset terrace", "Champagne on arrival", "Couples spa"] },
            { name: "Captain's House", price: 1599, image: "/images/rooms/garden-villa.png", features: ["2 floors", "Private infinity pool", "Panoramic views", "Personal concierge"] }
        ],
        amenities: ["Infinity Pool", "Cliffside Restaurant", "Wine Tasting", "Spa & Wellness", "Yacht Charters", "Sunset Lounge", "Art Gallery", "Cooking Classes"],
        reviews: [
            { name: "Sneha Reddy", city: "Hyderabad", rating: 5, text: "The Santorini sunset from our private terrace was the most beautiful thing I've ever seen. We spent 4 nights here and every moment felt like a dream. The Greek food was amazing - we still think about that lamb dish!", date: "September 2025" },
            { name: "Vikram Singh", city: "Delhi", rating: 5, text: "Proposed to my girlfriend here and she said yes! The hotel staff helped me arrange everything perfectly - rose petals, champagne, photographer hiding nearby. This place is pure romance. Worth every rupee!", date: "August 2025" },
            { name: "Ananya Nair", city: "Kochi", rating: 5, text: "As a solo female traveler, I felt completely safe and pampered here. The cave suite was unique and Instagram-worthy. The wine tasting tour with hotel guests was a great way to meet people. Highly recommend!", date: "October 2025" }
        ]
    },
    {
        slug: "dubai",
        name: "Dubai",
        tagline: "Where Luxury Knows No Limits",
        description: "Welcome to Dubai, a city that transforms impossible dreams into glittering reality. From the world's tallest buildings to man-made islands, experience futuristic luxury, world-class shopping, and Arabian hospitality at its finest.",
        heroImage: "/images/destinations/dubai.png",
        hotels: [
            {
                name: "The Royal Palm Tower",
                description: "A stunning 60-floor tower on Palm Jumeirah with sweeping views of the Arabian Gulf. Features the city's largest infinity pool and a celebrity-chef restaurant.",
                image: "/images/hotels/dubai-tower.png",
                stars: 5
            },
            {
                name: "Desert Oasis Resort",
                description: "Escape to the serene Dubai desert in this ultra-luxury resort. Experience traditional Bedouin hospitality with modern amenities, private dune experiences, and stargazing.",
                image: "/images/hotels/dubai-desert.png",
                stars: 5
            }
        ],
        rooms: [
            { name: "Skyline Suite", price: 699, image: "/images/rooms/ocean-suite.png", features: ["Floor-to-ceiling windows", "Burj Khalifa view", "Smart room controls", "Premium minibar"] },
            { name: "Palm View Penthouse", price: 1499, image: "/images/rooms/penthouse.png", features: ["Private terrace", "Piano lounge", "Personal chef available", "Limousine service"] },
            { name: "Royal Desert Villa", price: 2999, image: "/images/rooms/garden-villa.png", features: ["Private pool", "Desert views", "Camel stable", "24-hour butler"] }
        ],
        amenities: ["Rooftop Infinity Pool", "Private Beach", "Helipad", "Spa & Hammam", "Desert Safari", "Shopping Concierge", "Kids Club", "Business Center"],
        reviews: [
            { name: "Karthik Iyer", city: "Chennai", rating: 5, text: "Dubai never disappoints and this hotel took it to the next level! The view of Burj Khalifa from our room was spectacular. We did the desert safari through the hotel and it was the highlight of our trip. Kids loved the pool!", date: "December 2025" },
            { name: "Neha Kapoor", city: "Chandigarh", rating: 5, text: "This was my third time in Dubai but first time at this hotel. The service was impeccable - they upgraded us for our anniversary without us even asking! The spa hammam experience was heavenly. Will definitely return.", date: "November 2025" },
            { name: "Arjun Malhotra", city: "Jaipur", rating: 4, text: "Great hotel with amazing views. The breakfast buffet was extensive with lots of Indian options which we appreciated. Location is perfect for Dubai Mall. Slightly expensive but you get what you pay for!", date: "October 2025" }
        ]
    },
    {
        slug: "bali",
        name: "Bali",
        tagline: "Island of the Gods",
        description: "Immerse yourself in the mystical beauty of Bali, where ancient temples rise from emerald rice terraces and sacred traditions blend with tropical luxury. Discover inner peace through yoga, adventure through world-class surfing, and indulgence through exquisite spa experiences.",
        heroImage: "/images/destinations/bali.png",
        hotels: [
            {
                name: "Ubud Rainforest Retreat",
                description: "Nestled in the heart of Ubud's sacred monkey forest, this eco-luxury resort offers private villas with infinity pools overlooking the jungle canopy and rice terraces.",
                image: "/images/hotels/bali-retreat.png",
                stars: 5
            },
            {
                name: "Seminyak Beach Palace",
                description: "A beachfront paradise on Seminyak's golden sands. Perfect blend of Balinese architecture and contemporary design with a famous sunset beach club.",
                image: "/images/hotels/bali-beach.png",
                stars: 5
            }
        ],
        rooms: [
            { name: "Jungle Pool Villa", price: 449, image: "/images/rooms/ocean-suite.png", features: ["Private infinity pool", "Rainforest view", "Outdoor bathtub", "Yoga deck"] },
            { name: "Rice Terrace Suite", price: 649, image: "/images/rooms/penthouse.png", features: ["Panoramic terrace", "Traditional decor", "Private garden", "Meditation room"] },
            { name: "Cliff Edge Villa", price: 1299, image: "/images/rooms/garden-villa.png", features: ["Ocean views", "Private beach access", "In-villa spa", "Personal chef"] }
        ],
        amenities: ["Yoga Pavilion", "Infinity Pool", "Traditional Spa", "Rice Terrace Tours", "Surf School", "Cooking Classes", "Temple Visits", "Organic Restaurant"],
        reviews: [
            { name: "Sanjay Mehta", city: "Pune", rating: 5, text: "Bali was our first international trip as a family and this hotel made it magical! The kids loved the pool and we loved the spa. The staff taught us about Balinese culture - we even attended a temple ceremony. Beautiful experience.", date: "December 2025" },
            { name: "Deepika Krishnan", city: "Coimbatore", rating: 5, text: "Came here for a yoga retreat and left as a changed person. The morning yoga sessions with jungle views were transformative. The food was incredible - fresh, healthy, and so flavorful. Already planning to come back!", date: "November 2025" },
            { name: "Rohit Gupta", city: "Lucknow", rating: 5, text: "The sunset from our villa was unreal. We did a cooking class and learned to make authentic Balinese dishes. The staff went above and beyond - they organized a surprise birthday cake for my wife. Highly recommend!", date: "October 2025" }
        ]
    },
    {
        slug: "paris",
        name: "Paris",
        tagline: "The City of Light & Love",
        description: "Fall in love with Paris, the eternal city of romance, art, and gastronomy. From the iconic Eiffel Tower to hidden patisseries, designer boutiques to world-class museums, experience timeless elegance in every cobblestone street and café terrace.",
        heroImage: "/images/destinations/paris.png",
        hotels: [
            {
                name: "Le Maison Royale",
                description: "A historic 18th-century mansion transformed into an intimate luxury hotel steps from the Louvre. Features antique furnishings, a Michelin-starred restaurant, and a secret garden.",
                image: "/images/hotels/paris-boutique.png",
                stars: 5
            },
            {
                name: "Tour Eiffel Palace",
                description: "Contemporary luxury with panoramic Eiffel Tower views from every room. Art deco elegance meets modern comfort in the heart of the 7th arrondissement.",
                image: "/images/hotels/paris-tower.png",
                stars: 5
            }
        ],
        rooms: [
            { name: "Parisian Suite", price: 549, image: "/images/rooms/ocean-suite.png", features: ["Eiffel Tower view", "Marble bathroom", "Nespresso machine", "French balcony"] },
            { name: "Artist's Loft", price: 799, image: "/images/rooms/penthouse.png", features: ["Duplex layout", "Art collection", "Rooftop access", "Welcome champagne"] },
            { name: "Royal Apartment", price: 1899, image: "/images/rooms/garden-villa.png", features: ["2 bedrooms", "Private terrace", "Butler service", "Antique furnishings"] }
        ],
        amenities: ["Michelin Restaurant", "Wine Cellar", "Spa & Beauty", "Private Tours", "Limousine Service", "Concierge", "Garden Terrace", "Art Gallery"],
        reviews: [
            { name: "Meera Bose", city: "Kolkata", rating: 5, text: "Paris lived up to every expectation and this hotel exceeded them! The Eiffel Tower view from our balcony was breathtaking, especially at night when it sparkles. The croissants at breakfast were the best I've ever had. Pure magic!", date: "December 2025" },
            { name: "Aditya Joshi", city: "Nagpur", rating: 5, text: "Took my parents here for their 30th anniversary. The hotel arranged a private dinner cruise on the Seine - my mom cried happy tears! The location is perfect - we walked everywhere. Staff spoke a little Hindi which was a lovely surprise.", date: "November 2025" },
            { name: "Pooja Agarwal", city: "Indore", rating: 4, text: "Beautiful historic hotel with so much character. The room was smaller than expected but very elegant. The concierge got us into a fully-booked restaurant - great connections! Would recommend for a romantic trip.", date: "September 2025" }
        ]
    }
];

export function getDestinationBySlug(slug: string): Destination | undefined {
    return destinations.find(d => d.slug === slug);
}

export function getAllDestinationSlugs(): string[] {
    return destinations.map(d => d.slug);
}
