import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const all = await prisma.place.findMany({
    include: { menuItems: true }
  });
  console.log(`Found ${all.length} places.`);
  
  const searchResults = await prisma.place.findMany({
    where: {
      OR: [
        { name: { contains: 'Nasi Putih', mode: 'insensitive' } },
        { menuItems: { some: { name: { contains: 'Nasi Putih', mode: 'insensitive' } } } }
      ]
    },
    include: { menuItems: true }
  });
  
  console.log(`Found ${searchResults.length} places matching 'Nasi Putih'`);
  if (searchResults.length > 0) {
    console.log(searchResults[0].name);
  }
}

check().finally(() => prisma.$disconnect());
