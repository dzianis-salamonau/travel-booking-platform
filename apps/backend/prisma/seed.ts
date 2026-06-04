import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createMockProviders } from '@travel/provider-sdk';

const prisma = new PrismaClient();

async function main() {
  await prisma.booking.deleteMany();
  await prisma.travelPackage.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.destination.deleteMany();
  await prisma.syncJobRun.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.commissionRule.deleteMany();
  await prisma.depositRule.deleteMany();
  await prisma.user.deleteMany();

  await prisma.commissionRule.create({
    data: { name: 'Default Commission', percentage: 15, isDefault: true, isActive: true },
  });
  await prisma.depositRule.create({
    data: { name: 'Default Deposit', percentage: 20, isDefault: true, isActive: true },
  });

  const adminHash = await bcrypt.hash('admin123', 10);
  const customerHash = await bcrypt.hash('customer123', 10);

  await prisma.user.createMany({
    data: [
      {
        email: 'admin@travel.com',
        passwordHash: adminHash,
        role: UserRole.admin,
        firstName: 'Admin',
        lastName: 'User',
      },
      {
        email: 'customer@travel.com',
        passwordHash: customerHash,
        role: UserRole.customer,
        firstName: 'Test',
        lastName: 'Customer',
      },
    ],
  });

  const mockProviders = createMockProviders();

  for (const mock of mockProviders) {
    const provider = await prisma.provider.create({
      data: {
        slug: mock.providerSlug,
        name: mock.providerSlug === 'mock-provider-a' ? 'Mock Provider A (Spain/Portugal)' : 'Mock Provider B (Cape Verde)',
        isActive: true,
        config: {},
      },
    });

    const destinations = await mock.syncDestinations();
    const destMap = new Map<string, string>();

    for (const dest of destinations) {
      const created = await prisma.destination.create({
        data: {
          providerId: provider.id,
          externalId: dest.externalId,
          name: dest.name,
          slug: dest.slug,
          country: dest.country,
          image: dest.image,
          description: dest.description,
        },
      });
      destMap.set(dest.externalId, created.id);
    }

    const hotels = await mock.syncHotels();
    const hotelMap = new Map<string, string>();

    for (const hotel of hotels) {
      const destinationId = destMap.get(hotel.destinationExternalId);
      if (!destinationId) continue;
      const created = await prisma.hotel.create({
        data: {
          providerId: provider.id,
          externalId: hotel.externalId,
          destinationId,
          name: hotel.name,
          stars: hotel.stars,
          address: hotel.address,
          description: hotel.description,
          amenities: hotel.amenities,
        },
      });
      hotelMap.set(hotel.externalId, created.id);
    }

    const packages = await mock.syncPackages();
    for (const pkg of packages) {
      const destinationId = destMap.get(pkg.destinationExternalId);
      const hotelId = hotelMap.get(pkg.hotelExternalId);
      if (!destinationId || !hotelId) continue;
      await prisma.travelPackage.create({
        data: {
          providerId: provider.id,
          externalId: pkg.externalId,
          destinationId,
          hotelId,
          departureAirport: pkg.departureAirport,
          departureDate: pkg.departureDate,
          returnDate: pkg.returnDate,
          duration: pkg.duration,
          boardType: pkg.boardType,
          basePrice: pkg.basePrice,
          currency: pkg.currency,
          availability: pkg.availability,
          description: pkg.description,
        },
      });
    }
  }

  console.log('Seed completed: providers, destinations, hotels, packages, users');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
