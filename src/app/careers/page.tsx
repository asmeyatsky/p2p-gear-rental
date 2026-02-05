import Header from '@/components/Header';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Careers</h1>
        <p className="text-gray-600 mb-8">Help us build the future of peer-to-peer gear rental.</p>

        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Join the GearShare Team</h2>
          <p className="text-gray-600 mb-4">
            We're a small, passionate team working to make professional photography and videography
            equipment accessible to everyone. If you share that mission, we'd love to hear from you.
          </p>
          <p className="text-gray-600">
            We value diversity, remote-first work, and a culture of trust. Our team spans engineering,
            design, marketing, and operations — and we're always looking for talented people to grow with us.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What We Look For</h2>
          <ul className="space-y-3">
            {[
              'Passion for creativity and the creators who use professional equipment',
              'Strong problem-solving skills and ability to work independently',
              'Willingness to wear multiple hats in a fast-moving startup environment',
              'Experience with modern web technologies (Next.js, TypeScript, React)',
              'Clear communication and ability to collaborate across teams',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-purple-900 mb-2">No specific roles listed right now?</h2>
          <p className="text-purple-700 mb-4">
            We're always open to hearing from talented people. Send us your CV and a short note about
            what interests you.
          </p>
          <a
            href="mailto:careers@gearshare.io"
            className="inline-block bg-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Email careers@gearshare.io
          </a>
        </div>
      </div>
    </div>
  );
}
