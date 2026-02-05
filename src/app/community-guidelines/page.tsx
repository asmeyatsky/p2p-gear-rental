import Header from '@/components/Header';

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Community Guidelines</h1>
        <p className="text-gray-600 mb-8">
          These guidelines exist to keep GearShare a safe, fair, and enjoyable place for everyone.
        </p>

        <div className="prose max-w-none">
          <h2>1. Be Honest & Transparent</h2>
          <p>
            Accurate listings are the foundation of trust on GearShare. Describe your gear honestly —
            including its condition, any known issues, and realistic photos. Misrepresenting equipment
            undermines the entire community and may result in account suspension.
          </p>

          <h2>2. Respect Each Other</h2>
          <p>
            Treat every interaction on the platform — whether through messages, reviews, or disputes —
            with courtesy and professionalism. Harassment, discrimination, or abusive language of any
            kind is not tolerated and will result in immediate account action.
          </p>

          <h2>3. Honour Your Commitments</h2>
          <ul>
            <li><strong>Owners:</strong> Once a rental is approved, honour the agreement. If you need to cancel, do so as early as possible and communicate directly with the renter.</li>
            <li><strong>Renters:</strong> Return gear on time, in the same condition you received it. If there's an issue, communicate promptly.</li>
          </ul>

          <h2>4. Use the Platform as Intended</h2>
          <p>
            GearShare is a marketplace for renting photography and videography equipment. Do not use
            the platform to conduct transactions outside of our system, sell equipment outright, or
            engage in any activity not covered by our Terms of Service.
          </p>

          <h2>5. Leave Honest Reviews</h2>
          <p>
            Reviews help the community make informed decisions. Leave reviews that are honest, fair,
            and based on your actual experience. Do not use reviews to threaten, coerce, or retaliate
            against other users.
          </p>

          <h2>6. Protect Privacy</h2>
          <p>
            Do not share other users' personal information — including contact details, location, or
            any other private data — outside of the platform. Respect the privacy of gear locations
            and owner information.
          </p>

          <h2>7. Report Issues</h2>
          <p>
            If you witness a violation of these guidelines or have concerns about a listing or user,
            please report it to{' '}
            <a href="mailto:support@gearshare.io" className="text-purple-600 hover:underline">support@gearshare.io</a>.
            We review all reports and take appropriate action.
          </p>

          <h2>Consequences</h2>
          <p>
            Violations of these guidelines may result in warnings, temporary suspension, or permanent
            removal from the platform, depending on the severity and frequency of the violation. We
            reserve the right to take action necessary to maintain a safe community.
          </p>
        </div>
      </div>
    </div>
  );
}
