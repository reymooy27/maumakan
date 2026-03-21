// We reuse the configured Prisma client from the app to handle the adapter correctly
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding places in Kupang...');

  const kupangPlaces = [
    {
      name: 'Salome 99',
      type: 'food_stall',
      address: 'Jl. W. J. Lalamentik, Oebobo, Kupang',
      lat: -10.1582,
      lng: 123.6069,
      rating: 4.8,
      priceRange: 1,
      imageUrl: 'https://images.unsplash.com/photo-1548811579-017fc2a7f23e?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Sei Babi Ba\'i',
      type: 'restaurant',
      address: 'Jl. H.R. Koroh, Walikota, Kupang',
      lat: -10.1705,
      lng: 123.6074,
      rating: 4.9,
      priceRange: 2,
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Warung Artis',
      type: 'food_stall',
      address: 'Pantai Kelapa Lima, Kupang',
      lat: -10.1495,
      lng: 123.5901,
      rating: 4.5,
      priceRange: 1,
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Cafe La Haba',
      type: 'cafe',
      address: 'Jl. El Tari, Oebobo, Kupang',
      lat: -10.1610,
      lng: 123.6005,
      rating: 4.4,
      priceRange: 3,
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Kampoeng Nelayan Restaurant',
      type: 'restaurant',
      address: 'Jl. Timor Raya, Pasir Panjang, Kupang',
      lat: -10.1432,
      lng: 123.5985,
      rating: 4.6,
      priceRange: 3,
      imageUrl: 'https://images.unsplash.com/photo-1502301103665-0b95cc738daf?auto=format&fit=crop&w=500&q=80',
    },
  ];

  for (const p of kupangPlaces) {
    const existing = await prisma.place.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.place.create({
        data: p,
      });
      console.log(`Created ${p.name}`);
    } else {
      console.log(`${p.name} already exists. Skipping.`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });