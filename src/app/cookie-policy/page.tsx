import Header from '@/components/Header';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
        <p className="text-gray-600 mb-8">
          This policy explains how GearShare uses cookies and similar technologies on our platform.
        </p>

        <div className="prose max-w-none">
          <h2>What Are Cookies?</h2>
          <p>
            Cookies are small text files that are stored on your device when you visit a website. They
            help websites remember information about your visit, such as your preferences or login
            status, and can be used to improve your experience.
          </p>

          <h2>How We Use Cookies</h2>
          <p>GearShare uses cookies for the following purposes:</p>

          <h3>Essential Cookies</h3>
          <p>
            These cookies are required for the platform to function. They enable core features such as
            authentication, session management, and security. You cannot opt out of essential cookies
            as they are necessary for the service to work.
          </p>
          <ul>
            <li><strong>Session cookies</strong> — Keep you signed in during a browsing session</li>
            <li><strong>Authentication tokens</strong> — Managed by Supabase to verify your identity securely</li>
            <li><strong>CSRF tokens</strong> — Protect against cross-site request forgery attacks</li>
          </ul>

          <h3>Functional Cookies</h3>
          <p>
            These cookies help us provide a personalised experience. They remember your preferences
            and choices to improve usability.
          </p>
          <ul>
            <li><strong>Preferences</strong> — Remember settings such as language or display preferences</li>
            <li><strong>Toast notifications</strong> — Track which notifications you have already seen</li>
          </ul>

          <h3>Analytics Cookies</h3>
          <p>
            These cookies help us understand how visitors use GearShare, so we can improve the platform.
            They collect anonymous, aggregated data about page views and user behaviour.
          </p>
          <ul>
            <li><strong>Google Analytics</strong> — Tracks anonymised usage patterns to help us improve the site</li>
          </ul>

          <h2>Third-Party Cookies</h2>
          <p>
            Some cookies are set by third-party services we use:
          </p>
          <ul>
            <li><strong>Stripe</strong> — Required for secure payment processing. Set when you interact with payment forms.</li>
            <li><strong>Supabase</strong> — Used for authentication and session management.</li>
          </ul>

          <h2>Managing Cookies</h2>
          <p>
            You can manage cookies through your browser settings. Most browsers allow you to view,
            delete, or block cookies. Note that blocking essential cookies may prevent the platform
            from working correctly.
          </p>
          <p>
            For specific instructions, check your browser&apos;s help documentation:
          </p>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/cookies-firefox" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/en-us/111764" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Safari</a></li>
            <li><a href="https://support.microsoft.com/en-us/topic/how-to-manage-cookies-in-microsoft-edge-bd1c0243-f445-4fb6-b61d-30f2c8d8b622" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Microsoft Edge</a></li>
          </ul>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this cookie policy from time to time. If we make significant changes, we will
            notify you by updating the date below. Continued use of the platform after changes constitutes
            acceptance of the updated policy.
          </p>
          <p className="text-sm text-gray-500">Last updated: February 2026</p>
        </div>
      </div>
    </div>
  );
}
