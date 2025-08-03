'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';

const dummyGear = {
  '1': {
    id: '1',
    title: 'Canon EOS R5',
    description: 'A high-performance mirrorless camera with a 45MP full-frame sensor and 8K video recording.',
    dailyRate: 50,
    weeklyRate: 300,
    monthlyRate: 1000,
    images: ['/canon-r5.jpg', '/canon-r5-2.jpg', '/canon-r5-3.jpg'],
    city: 'New York',
    state: 'NY',
    brand: 'Canon',
    model: 'EOS R5',
    condition: 'Like New',
    owner: {
      name: 'John Doe',
      avatar: '/avatar.jpg',
    },
    features: [
      '45MP Full-Frame CMOS Sensor',
      '8K30 Raw and 4K120 10-Bit Internal Video',
      'Sensor-Shift 5-Axis Image Stabilization',
      'Dual Pixel CMOS AF II with 1053 Points',
    ],
  },
  // Add other gear items as needed
};

export default function GearDetailsPage() {
  const { id } = useParams();
  const gear = dummyGear[id as keyof typeof dummyGear];

  if (!gear) {
    return <div>Gear not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="relative h-96 w-full mb-4">
            <Image
              src={gear.images[0]}
              alt={gear.title}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {gear.images.slice(1).map((image, index) => (
              <div key={index} className="relative h-24 w-full">
                <Image
                  src={image}
                  alt={`${gear.title} - ${index + 2}`}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{gear.title}</h1>
          <p className="text-lg text-gray-600 mb-4">
            {gear.brand} {gear.model}
          </p>
          <div className="text-2xl font-bold text-gray-900 mb-4">
            ${gear.dailyRate.toFixed(2)}
            <span className="text-sm text-gray-500"> / day</span>
          </div>
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{gear.description}</p>
          </div>
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Features</h3>
            <ul className="list-disc list-inside text-gray-700">
              {gear.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
          <div className="flex items-center">
            <div className="relative h-12 w-12 mr-4">
              <Image
                src={gear.owner.avatar}
                alt={gear.owner.name}
                fill
                className="rounded-full"
              />
            </div>
            <div>
              <p className="font-semibold">{gear.owner.name}</p>
              <p className="text-sm text-gray-500">Owner</p>
            </div>
          </div>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 mt-6 w-full">
            Rent Now
          </button>
        </div>
      </div>
    </div>
  );
}
