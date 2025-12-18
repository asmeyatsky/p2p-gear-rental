'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import { ShieldCheckIcon, ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function InsuranceTermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Insurance Coverage Terms</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Understand how our gear protection insurance works to keep both owners and renters protected.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Overview Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How Insurance Works</h2>
            <p className="text-gray-600 mb-4">
              When an owner enables insurance for their gear listing, renters pay an additional premium
              (typically 5-15% of the rental rate) that provides protection against accidental damage,
              theft, and loss during the rental period.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Example:</strong> For a $100/day camera rental with 10% insurance, the renter pays
                $110/day ($100 rental + $10 insurance premium). This insurance covers the gear throughout
                the rental period.
              </p>
            </div>
          </div>

          {/* Coverage Tiers */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Coverage Tiers</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-lg font-semibold text-gray-900 mb-2">Basic (5%)</div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Minor damage coverage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Up to $500 coverage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>Theft not covered</span>
                  </li>
                </ul>
              </div>
              <div className="border border-purple-300 bg-purple-50 rounded-lg p-4">
                <div className="text-lg font-semibold text-gray-900 mb-2">Standard (10%)</div>
                <div className="text-xs text-purple-600 font-medium mb-2">RECOMMENDED</div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Full damage coverage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Up to $2,000 coverage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Theft coverage included</span>
                  </li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-lg font-semibold text-gray-900 mb-2">Premium (15%)</div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Full replacement coverage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Unlimited coverage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Priority claim processing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* What's Covered */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What&apos;s Covered</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  Covered Events
                </h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>Accidental damage during normal use</li>
                  <li>Theft (with police report, Standard+ tiers)</li>
                  <li>Weather-related damage during shoots</li>
                  <li>Drops and impact damage</li>
                  <li>Liquid damage</li>
                  <li>Fire damage</li>
                  <li>Vandalism</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <XCircleIcon className="w-5 h-5 text-red-500" />
                  Not Covered
                </h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>Intentional damage or misuse</li>
                  <li>Normal wear and tear</li>
                  <li>Pre-existing damage</li>
                  <li>Loss without documentation</li>
                  <li>Damage from unauthorized modifications</li>
                  <li>Cosmetic damage that doesn&apos;t affect function</li>
                  <li>Damage from professional stunts</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Claims Process */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Filing a Claim</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">1</div>
                <div>
                  <h3 className="font-medium text-gray-900">Document the Incident</h3>
                  <p className="text-sm text-gray-600">Take photos of the damage immediately. For theft, file a police report within 24 hours.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">2</div>
                <div>
                  <h3 className="font-medium text-gray-900">Submit Claim</h3>
                  <p className="text-sm text-gray-600">Use the &quot;Report Issue&quot; button on your rental to submit a damage claim with photos and description.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">3</div>
                <div>
                  <h3 className="font-medium text-gray-900">Review Process</h3>
                  <p className="text-sm text-gray-600">Our team reviews claims within 2-3 business days. You&apos;ll be notified of the decision.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">4</div>
                <div>
                  <h3 className="font-medium text-gray-900">Resolution</h3>
                  <p className="text-sm text-gray-600">Approved claims are paid out within 5-7 business days to the gear owner.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Important Notice</h3>
                <p className="text-sm text-gray-600">
                  Insurance coverage begins when the rental period starts and ends when the gear is returned.
                  Both parties should document the gear condition before and after the rental using photos
                  in the app to ensure smooth claim processing if needed.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Can I opt out of insurance?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Insurance is set by the gear owner. If they require insurance, you cannot rent the gear without it.
                  Many owners choose not to require insurance for lower-value items.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">What if the damage exceeds my coverage limit?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  If damage exceeds your coverage tier limit, you may be responsible for the difference.
                  Consider the gear&apos;s value when selecting a coverage tier.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">How is the insurance premium calculated?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  The premium is a percentage of the base rental rate, set by the owner (5-15%).
                  For example, 10% insurance on a $100/day rental adds $10/day to the total.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">Have more questions about our insurance coverage?</p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
