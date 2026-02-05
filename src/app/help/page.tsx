import Link from 'next/link';
import Header from '@/components/Header';

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        question: 'How do I sign up?',
        answer: 'Click "Sign Up" in the top navigation. You can create an account as a renter, a gear lister, or both. Email verification is required before you can transact.',
      },
      {
        question: 'How do I list my gear?',
        answer: 'Once signed in, go to "List Your Gear" in the navigation or visit your dashboard. You can add photos, set pricing, and choose your availability.',
      },
      {
        question: 'How do I rent gear?',
        answer: 'Browse our listings, click on a piece of gear you\'re interested in, select your dates, and submit a rental request. The owner will approve or decline.',
      },
    ],
  },
  {
    category: 'Payments & Pricing',
    items: [
      {
        question: 'How does payment work?',
        answer: 'Payment is processed securely through Stripe. You are not charged until the owner accepts your rental request. Payment is held and released to the owner after the rental is confirmed.',
      },
      {
        question: 'What payment methods are accepted?',
        answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express) via Stripe\'s secure payment system.',
      },
      {
        question: 'How do refunds work?',
        answer: 'If a rental is cancelled before it begins, you will receive a full refund. Disputes about rentals in progress are handled through our dispute resolution process.',
      },
    ],
  },
  {
    category: 'Safety & Insurance',
    items: [
      {
        question: 'Is the gear insured?',
        answer: 'Gear owners can opt into our standard insurance coverage, which protects both the owner and the renter during the rental period. Details are shown on each listing.',
      },
      {
        question: 'What if something gets damaged?',
        answer: 'If gear is damaged during a rental, the renter is responsible for repair or replacement costs up to the listed replacement value. Insurance coverage may apply — see the listing details.',
      },
      {
        question: 'How do I report a problem?',
        answer: 'If you have an issue with a rental, you can open a dispute from your dashboard. Our team will review and help resolve it.',
      },
    ],
  },
  {
    category: 'Account & Settings',
    items: [
      {
        question: 'How do I reset my password?',
        answer: 'Go to the login page and click "Forgot password?" You\'ll receive an email with instructions to set a new password.',
      },
      {
        question: 'How do I update my profile?',
        answer: 'Sign in and navigate to your profile page to update your name, photo, and other details.',
      },
      {
        question: 'How do I delete my account?',
        answer: 'Please email support@gearshare.io with your deletion request. We will process it within 30 days.',
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Help Center</h1>
        <p className="text-gray-600 mb-8">Find answers to common questions about GearShare.</p>

        <div className="space-y-10">
          {faqs.map((group) => (
            <div key={group.category}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">{group.category}</h2>
              <div className="space-y-4">
                {group.items.map((faq, i) => (
                  <details key={i} className="group">
                    <summary className="flex items-center justify-between cursor-pointer py-3 border-b border-gray-100">
                      <span className="font-medium text-gray-900 group-open:text-purple-600">{faq.question}</span>
                      <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="text-gray-600 py-3 text-sm leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-gray-700 mb-2">Still can&apos;t find what you need?</p>
          <Link href="/contact" className="text-purple-600 hover:text-purple-700 font-medium">Contact our support team</Link>
        </div>
      </div>
    </div>
  );
}
