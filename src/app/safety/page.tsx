import Header from '@/components/Header';

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Safety</h1>
        <p className="text-gray-600 mb-8">Our commitment to keeping you, your gear, and your experience safe.</p>

        <div className="prose max-w-none">
          <h2>Secure Payments</h2>
          <p>
            All payments on GearShare are processed through Stripe, one of the most trusted payment
            platforms in the world. Your financial information is encrypted and never stored on our servers.
            We use industry-standard PCI DSS compliance to protect every transaction.
          </p>

          <h2>Identity & Trust</h2>
          <p>
            Every account on GearShare requires email verification. We encourage owners and renters alike
            to complete their profiles fully — a complete profile builds trust and makes the rental
            experience smoother for everyone.
          </p>
          <ul>
            <li>Email verification is required to transact</li>
            <li>Reviews and ratings are visible on all profiles</li>
            <li>Rental history is tracked and accessible to both parties</li>
          </ul>

          <h2>Insurance & Protection</h2>
          <p>
            Gear owners can opt into GearShare's standard insurance programme when listing equipment.
            When insurance is enabled on a listing, both the owner and the renter are covered for damage,
            theft, or loss during the rental period, up to the declared replacement value.
          </p>
          <ul>
            <li>Insurance details are displayed clearly on every listing</li>
            <li>A security deposit may be required depending on the listing</li>
            <li>Damage claims must be reported within 48 hours of the rental ending</li>
          </ul>

          <h2>Dispute Resolution</h2>
          <p>
            If something goes wrong during a rental, GearShare provides a structured dispute resolution
            process. Either party can open a dispute from their dashboard. Our team reviews the details
            and works with both sides to reach a fair resolution.
          </p>
          <ul>
            <li>Disputes should be opened as soon as possible after an issue occurs</li>
            <li>Both parties are encouraged to communicate through the platform messaging system</li>
            <li>Our team aims to resolve disputes within 5 business days</li>
          </ul>

          <h2>Prohibited Items</h2>
          <p>
            The following items may not be listed or rented through GearShare:
          </p>
          <ul>
            <li>Items that are stolen or obtained illegally</li>
            <li>Items with outstanding liens or legal encumbrances</li>
            <li>Items that cannot legally be rented in the listing jurisdiction</li>
            <li>Counterfeit or misrepresented equipment</li>
          </ul>

          <h2>Reporting Concerns</h2>
          <p>
            If you have a safety concern — whether about a listing, a user, or an experience on the
            platform — please contact us immediately at{' '}
            <a href="mailto:safety@gearshare.io" className="text-purple-600 hover:underline">safety@gearshare.io</a>.
            We take all reports seriously and will investigate promptly.
          </p>
        </div>
      </div>
    </div>
  );
}
