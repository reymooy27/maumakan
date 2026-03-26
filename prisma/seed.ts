// We reuse the configured Prisma client from the app to handle the adapter correctly
import { prisma } from '../src/lib/prisma';
import { PlaceType } from '@prisma/client';

async function main() {
  console.log('Seeding places in Kupang...');

  const kupangPlaces = [
    {
      name: 'Salome 99',
      type: PlaceType.food_stall,
      address: 'Jl. W. J. Lalamentik, Oebobo, Kupang',
      lat: -10.1582,
      lng: 123.6069,
      rating: 4.8,
      avgPrice: 15000,
      openTime: 480,  // 08:00
      closeTime: 1320, // 22:00
      imageUrl: 'https://images.unsplash.com/photo-1548811579-017fc2a7f23e?auto=format&fit=crop&w=500&q=80',
      menu: [
        { name: 'Salome Campur', price: 10000, description: 'Pentol, tahu, dan gorengan khas Kupang' },
        { name: 'Salome Kuah', price: 12000, description: 'Salome dengan kuah kaldu sapi hangat' },
        { name: 'Salome Goreng', price: 10000, description: 'Salome digoreng renyah dengan telur' },
        { name: 'Es Sirup', price: 5000, description: 'Minuman dingin segar' },
        { name: 'Kacang Telur', price: 3000, description: 'Cemilan pelengkap salome' },
      ]
    },
    {
      name: 'Sei Babi Ba\'i',
      type: PlaceType.restaurant,
      address: 'Jl. H.R. Koroh, Walikota, Kupang',
      lat: -10.1705,
      lng: 123.6074,
      rating: 4.9,
      avgPrice: 45000,
      openTime: 600,  // 10:00
      closeTime: 1260, // 21:00
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80',
      menu: [
        { name: 'Sei Babi Reguler', price: 40000, description: 'Daging asap khas Kupang dengan sambal lu\'at' },
        { name: 'Sei Babi Spesial', price: 55000, description: 'Porsi besar sei babi with tumis bunga pepaya' },
        { name: 'Rusuk Babi Bakar', price: 65000, description: 'Rusuk babi bakar empuk bumbu rahasia' },
        { name: 'Tumis Bunga Pepaya', price: 15000, description: 'Sayuran khas NTT pendamping sei' },
        { name: 'Nasi Putih', price: 5000, description: 'Nasi hangat' },
      ]
    },
    {
      name: 'Warung Artis',
      type: PlaceType.food_stall,
      address: 'Pantai Kelapa Lima, Kupang',
      lat: -10.1495,
      lng: 123.5901,
      rating: 4.5,
      avgPrice: 20000,
      openTime: 960,  // 16:00
      closeTime: 1140, // 19:00
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80',
      menu: [
        { name: 'Bakso Urat', price: 15000, description: 'Bakso sapi urat besar dan gurih' },
        { name: 'Mie Ayam Solo', price: 12000, description: 'Mie ayam with topping ayam kecap manis' },
        { name: 'Mie Ayam Bakso', price: 18000, description: 'Mie ayam lengkap with bakso' },
        { name: 'Es Teh Manis', price: 5000, description: 'Minuman teh segar' },
        { name: 'Es Jeruk', price: 7000, description: 'Jeruk peras murni dingin' },
      ]
    },
    {
      name: 'Cafe La Haba',
      type: PlaceType.cafe,
      address: 'Jl. El Tari, Oebobo, Kupang',
      lat: -10.1610,
      lng: 123.6005,
      rating: 4.4,
      avgPrice: 35000,
      openTime: 480,  // 08:00
      closeTime: 1439, // 23:59
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=80',
      menu: [
        { name: 'Kopi Ja\'o', price: 20000, description: 'Kopi hitam khas Flores' },
        { name: 'Cafe Latte', price: 30000, description: 'Espresso with susu lembut' },
        { name: 'Steak Ayam', price: 45000, description: 'Daging ayam panggang with kentang goreng' },
        { name: 'Roti Bakar Keju', price: 15000, description: 'Roti bakar manis with taburan keju melimpah' },
        { name: 'Pisang Goreng Keju', price: 15000, description: 'Pisang goreng renyah srikaya dan keju' },
      ]
    },
    {
      name: 'Kampoeng Nelayan Restaurant',
      type: PlaceType.restaurant,
      address: 'Jl. Timor Raya, Pasir Panjang, Kupang',
      lat: -10.1432,
      lng: 123.5985,
      rating: 4.6,
      avgPrice: 125000,
      openTime: 660,  // 11:00
      closeTime: 1320, // 22:00
      imageUrl: 'https://images.unsplash.com/photo-1502301103665-0b95cc738daf?auto=format&fit=crop&w=500&q=80',
      menu: [
        { name: 'Gurame Bakar', price: 95000, description: 'Gurame segar bakar bumbu kecap madu' },
        { name: 'Kepiting Saos Padang', price: 150000, description: 'Kepiting jumbo with bumbu padang pedas' },
        { name: 'Udang Goreng Mentega', price: 85000, description: 'Udang laut goreng with mentega gurih' },
        { name: 'Cah Kangkung Seafood', price: 35000, description: 'Tumis kangkung segar with udang dan cumi' },
        { name: 'Kelapa Muda Utuh', price: 20000, description: 'Air kelapa muda segar langsung dari buahnya' },
      ]
    },
  ];

  for (const { menu, ...p } of kupangPlaces) {
    const existing = await prisma.place.findFirst({ where: { name: p.name } });
    let place;
    if (!existing) {
      place = await prisma.place.create({ data: p });
      console.log(`Created ${p.name}`);
    } else {
      place = await prisma.place.update({ 
        where: { id: existing.id },
        data: p
      });
      console.log(`Updated ${p.name}`);
    }

    // Handle Menu Items
    await prisma.menuItem.deleteMany({ where: { placeId: place.id } });
    await prisma.menuItem.createMany({
      data: menu.map(m => ({ ...m, placeId: place.id }))
    });
    console.log(`Added ${menu.length} menu items to ${p.name}`);
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
