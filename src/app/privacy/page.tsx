import { PageHeader } from '@/components/ui'

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for Triple A Book Club.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container-main max-w-3xl">
        <PageHeader
          title="Privacy Policy"
          description="Last updated: January 2026"
        />

        <div className="prose prose-invert max-w-none">
          <div className="space-y-8 text-white/70">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h2>
              <p>
                When you create an account, we collect your email address and name. We may also 
                collect information about your book suggestions, votes, and participation in club activities.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Manage your account and club membership</li>
                <li>Process book suggestions and votes</li>
                <li>Communicate with you about club activities</li>
                <li>Improve our services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information. 
                Your data is stored securely using our infrastructure, which includes 
                encryption and secure data handling practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Data Sharing</h2>
              <p>
                We do not sell or share your personal information with third parties for 
                marketing purposes. Your book suggestions and public profile information 
                may be visible to other club members.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Access your personal data</li>
                <li>Update or correct your information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Contact Us</h2>
              <p>
                If you have questions about this privacy policy, please contact us at 
                privacy@tripleabookclub.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
