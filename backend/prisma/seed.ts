import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── Parking Zones ────────────────────────────────────────────────────────
  await prisma.parkingZone.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'Rudaki Avenue Zone',
        description: 'Central Dushanbe — Rudaki Ave',
        geojson: {
          type: 'Polygon',
          coordinates: [[
            [68.770, 38.558], [68.785, 38.558],
            [68.785, 38.570], [68.770, 38.570],
            [68.770, 38.558],
          ]],
        },
      },
      {
        name: 'Ismoil Somoni Park Zone',
        description: 'Near Ismoil Somoni monument',
        geojson: {
          type: 'Polygon',
          coordinates: [[
            [68.775, 38.575], [68.790, 38.575],
            [68.790, 38.585], [68.775, 38.585],
            [68.775, 38.575],
          ]],
        },
      },
      {
        name: 'Korvon Market Zone',
        description: 'Near Korvon bazaar',
        geojson: {
          type: 'Polygon',
          coordinates: [[
            [68.790, 38.560], [68.805, 38.560],
            [68.805, 38.572], [68.790, 38.572],
            [68.790, 38.560],
          ]],
        },
      },
    ],
  });

  // ── Cars ─────────────────────────────────────────────────────────────────
  await prisma.car.createMany({
    skipDuplicates: true,
    data: [
      // ── ECONOMY (5 cars) ─────────────────────────────────────────────────
      {
        id: 'car-001',
        licensePlate: 'TJ-7788-AB',
        model: 'Hyundai Accent',
        year: 2023,
        carClass: 'ECONOMY',
        features: ['Bluetooth', 'USB', 'Air conditioning'],
        imageUrl: 'http://localhost:3001/uploads/cars/hyundai-accent.avif',
        latitude: 38.5598,
        longitude: 68.7870,
        fuelLevel: 85,
        status: 'AVAILABLE',
      },
      {
        id: 'car-002',
        licensePlate: 'TJ-1234-CD',
        model: 'Toyota Vitz',
        year: 2022,
        carClass: 'ECONOMY',
        features: ['Bluetooth', 'USB', 'Air conditioning'],
        imageUrl: 'http://localhost:3001/uploads/cars/toyota-vitz.webp',
        latitude: 38.5620,
        longitude: 68.7900,
        fuelLevel: 60,
        status: 'AVAILABLE',
      },
      {
        id: 'car-003',
        licensePlate: 'TJ-4455-EF',
        model: 'Chevrolet Cobalt',
        year: 2023,
        carClass: 'ECONOMY',
        features: ['Bluetooth', 'USB', 'Air conditioning'],
        imageUrl: 'http://localhost:3001/uploads/cars/chevrolet-cobalt.jpeg',
        latitude: 38.5560,
        longitude: 68.7840,
        fuelLevel: 72,
        status: 'AVAILABLE',
      },
      {
        id: 'car-004',
        licensePlate: 'TJ-6677-GH',
        model: 'Daewoo Nexia',
        year: 2021,
        carClass: 'ECONOMY',
        features: ['USB', 'Air conditioning'],
        imageUrl: 'http://localhost:3001/uploads/cars/daewoo-nexia.jpeg',
        latitude: 38.5640,
        longitude: 68.7920,
        fuelLevel: 45,
        status: 'AVAILABLE',
      },
      {
        id: 'car-005',
        licensePlate: 'TJ-8899-IJ',
        model: 'Volkswagen Polo',
        year: 2022,
        carClass: 'ECONOMY',
        features: ['Bluetooth', 'USB', 'Air conditioning'],
        imageUrl: 'http://localhost:3001/uploads/cars/volkswagen-polo.webp',
        latitude: 38.5575,
        longitude: 68.7860,
        fuelLevel: 90,
        status: 'AVAILABLE',
      },

      // ── COMFORT (4 cars) ─────────────────────────────────────────────────
      {
        id: 'car-006',
        licensePlate: 'TJ-1122-KL',
        model: 'Kia Rio X',
        year: 2023,
        carClass: 'COMFORT',
        features: ['CarPlay', 'Android Auto', 'Heated seats', 'USB', 'Air conditioning'],
        imageUrl: 'http://localhost:3001/uploads/cars/kia-rio.jpeg',
        latitude: 38.5550,
        longitude: 68.7820,
        fuelLevel: 91,
        status: 'AVAILABLE',
      },
      {
        id: 'car-007',
        licensePlate: 'TJ-3344-MN',
        model: 'Hyundai Elantra',
        year: 2023,
        carClass: 'COMFORT',
        features: ['CarPlay', 'Android Auto', 'Heated seats', 'USB', 'Air conditioning'],
        imageUrl: 'http://localhost:3001/uploads/cars/hyundai-elantra.jpg',
        latitude: 38.5610,
        longitude: 68.7950,
        fuelLevel: 78,
        status: 'AVAILABLE',
      },
      {
        id: 'car-008',
        licensePlate: 'TJ-5566-OP',
        model: 'Chevrolet Lacetti',
        year: 2022,
        carClass: 'COMFORT',
        features: ['CarPlay', 'Heated seats', 'USB', 'Air conditioning'],
        imageUrl: 'http://localhost:3001/uploads/cars/chevrolet-lacetti.jpg',
        latitude: 38.5590,
        longitude: 68.7800,
        fuelLevel: 55,
        status: 'AVAILABLE',
      },
      {
        id: 'car-009',
        licensePlate: 'TJ-7788-QR',
        model: 'Kia Rio X',
        year: 2024,
        carClass: 'COMFORT',
        features: ['CarPlay', 'Android Auto', 'Heated seats', 'USB', 'Air conditioning'],
        imageUrl: 'http://localhost:3001/uploads/cars/kia-rio.jpeg',
        latitude: 38.5630,
        longitude: 68.7880,
        fuelLevel: 88,
        status: 'AVAILABLE',
      },

      // ── CROSSOVER (3 cars) ───────────────────────────────────────────────
      {
        id: 'car-010',
        licensePlate: 'TJ-9900-ST',
        model: 'Nissan Qashqai',
        year: 2023,
        carClass: 'CROSSOVER',
        features: ['CarPlay', 'Android Auto', 'Heated seats', 'Panoramic roof', 'AWD', 'USB'],
        imageUrl: 'http://localhost:3001/uploads/cars/nissan-qashqai.webp',
        latitude: 38.5580,
        longitude: 68.7810,
        fuelLevel: 95,
        status: 'AVAILABLE',
      },
      {
        id: 'car-011',
        licensePlate: 'TJ-2211-UV',
        model: 'Kia Sportage',
        year: 2023,
        carClass: 'CROSSOVER',
        features: ['CarPlay', 'Android Auto', 'Heated seats', 'Panoramic roof', 'AWD', 'USB'],
        imageUrl: 'http://localhost:3001/uploads/cars/kia-sportage.jpg',
        latitude: 38.5605,
        longitude: 68.7865,
        fuelLevel: 70,
        status: 'AVAILABLE',
      },
      {
        id: 'car-012',
        licensePlate: 'TJ-4433-WX',
        model: 'Hyundai Tucson',
        year: 2024,
        carClass: 'CROSSOVER',
        features: ['CarPlay', 'Android Auto', 'Heated seats', 'Panoramic roof', 'AWD', 'USB', 'Wireless charging'],
        imageUrl: 'http://localhost:3001/uploads/cars/hyundai-tucson.jpg',
        latitude: 38.5568,
        longitude: 68.7835,
        fuelLevel: 82,
        status: 'AVAILABLE',
      },
    ],
  });

  console.log('✅ Seed complete — 12 cars + 3 parking zones created');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
