// Minimal homepage for debugging
export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-4">GearShare</h1>
      <p className="text-center text-gray-600 mb-8">P2P Gear Rental Marketplace</p>
      <div className="text-center">
        <a href="/browse" className="bg-blue-600 text-white px-6 py-3 rounded-lg inline-block">
          Browse Gear
        </a>
      </div>
    </div>
  );
}
