import Layout from '@/components/ui/Layout';

export default function AboutPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-xl font-bold text-gray-900">About GearShare</h1>

        <p className="text-xs text-gray-600">
          GearShare is a peer-to-peer marketplace connecting photographers and videographers
          with local equipment owners. Rent professional cameras, lenses, lighting, and more
          at affordable prices.
        </p>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="bg-white p-3 rounded shadow-sm border">
            <div className="text-lg font-bold text-blue-600">1000+</div>
            <div className="text-[10px] text-gray-500">Gear Items</div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm border">
            <div className="text-lg font-bold text-blue-600">500+</div>
            <div className="text-[10px] text-gray-500">Active Renters</div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm border">
            <div className="text-lg font-bold text-blue-600">50+</div>
            <div className="text-[10px] text-gray-500">Cities</div>
          </div>
        </div>

        <div className="pt-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">How It Works</h2>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex gap-2">
              <span className="font-bold text-blue-600">1.</span>
              <span>Browse available gear in your area</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-blue-600">2.</span>
              <span>Request rental dates and confirm with owner</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-blue-600">3.</span>
              <span>Pick up gear, create, and return</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Contact</h2>
          <p className="text-xs text-gray-600">
            Email: support@gearshare.com
          </p>
        </div>
      </div>
    </Layout>
  );
}
