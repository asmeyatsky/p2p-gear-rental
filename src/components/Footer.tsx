import Link from 'next/link';
import { Container, Grid } from './ui/Layout';

const footerLinks = {
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
    { href: '/careers', label: 'Careers' }
  ],
  support: [
    { href: '/help', label: 'Help Center' },
    { href: '/safety', label: 'Safety' },
    { href: '/community-guidelines', label: 'Community Guidelines' }
  ],
  legal: [
    { href: '/terms-of-service', label: 'Terms of Service' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/cookie-policy', label: 'Cookie Policy' }
  ],
  social: [
    { href: 'https://twitter.com/gearshare', label: 'Twitter', icon: '𝕏' },
    { href: 'https://facebook.com/gearshare', label: 'Facebook', icon: '📘' },
    { href: 'https://instagram.com/gearshare', label: 'Instagram', icon: '📷' },
    { href: 'https://linkedin.com/company/gearshare', label: 'LinkedIn', icon: '💼' }
  ]
};

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <Container>
        <div className="py-12">
          <Grid cols={4} gap="lg" responsive>
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">⚙️</span>
                <span className="text-xl font-bold text-gray-900">GearShare</span>
              </div>
              <p className="text-gray-600 mb-6 max-w-sm">
                Your trusted marketplace for renting photography and videography equipment. 
                Connect with local gear owners and access professional equipment affordably.
              </p>
              <div className="flex space-x-4">
                {footerLinks.social.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={link.label}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="text-lg">{link.icon}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Company
              </h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Support
              </h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Legal
              </h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Grid>

          {/* Newsletter Signup */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="max-w-md mx-auto text-center lg:max-w-none lg:text-left lg:flex lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Stay updated
                </h3>
                <p className="text-gray-600">
                  Get the latest gear listings and platform updates.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 lg:max-w-sm">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} GearShare. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>Made with ❤️ for creators</span>
              <div className="flex items-center space-x-2">
                <span>🔒</span>
                <span>Secure payments</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🛡️</span>
                <span>Insured rentals</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
