import Header from '@/components/Header';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose max-w-none">
          <p>Your privacy is important to us. This Privacy Policy explains how GearShare collects, uses, and discloses information about you.</p>

          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, list gear for rent, rent gear, or communicate with us. This may include your name, email address, postal address, phone number, payment information, and details about the gear you list or rent.</p>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our Service;</li>
            <li>Process transactions and send you related information, including confirmations and invoices;</li>
            <li>Send you technical notices, updates, security alerts, and support and administrative messages;</li>
            <li>Respond to your comments, questions, and requests and provide customer service;</li>
            <li>Communicate with you about products, services, offers, promotions, and events offered by GearShare and others, and provide news and information we think will be of interest to you;</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our Service;</li>
            <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities and protect the rights and property of GearShare and others;</li>
            <li>Personalize and improve the Service and provide advertisements, content, or features that match user profiles or interests.</li>
          </ul>

          <h2>3. Sharing of Information</h2>
          <p>We may share information about you as follows or as otherwise described in this Privacy Policy:</p>
          <ul>
            <li>With vendors, consultants, and other service providers who need access to such information to carry out work on our behalf;</li>
            <li>In response to a request for information if we believe disclosure is in accordance with, or required by, any applicable law, regulation, or legal process;</li>
            <li>If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of GearShare or others;</li>
            <li>In connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business by another company;</li>
            <li>With your consent or at your direction.</li>
          </ul>

          <h2>4. Security</h2>
          <p>GearShare takes reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration, and destruction.</p>

          <h2>5. Your Choices</h2>
          <p>You may update, correct, or delete information about you at any time by logging into your online account or by emailing us at [Your Contact Email].</p>

          <h2>6. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at [Your Contact Email].</p>
        </div>
      </div>
    </div>
  );
}
