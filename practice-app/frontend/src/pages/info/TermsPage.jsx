import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import '../../styles/style.css';
import '../../styles/TermsPage.css';

const TermsPage = () => {
  useEffect(() => {
    document.title = "Terms & Conditions - FitHub";
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-primary">Fithub Terms & Conditions</h1>
        <p className="text-gray-600 mb-6 text-right">Last updated: May 14, 2025</p>

        <div className="prose max-w-none">
          <p className="mb-4">
            Welcome to Fithub! These Terms & Conditions ("Terms") govern your access to and use of our website, mobile apps, and related services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, please do not use the Service.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">1. Definitions</h2>
          <p className="mb-2">"Fithub", "we", "us", or "our" refers to the Fithub platform and its parent company.</p>
          <p className="mb-2">"User", "you", or "your" refers to any person who accesses or uses the Service.</p>
          <p className="mb-2">"Content" means all text, images, recipes, meal plans, comments, questions, nutrition tips, and other materials that Users submit to or through the Service.</p>

          <h2 className="text-xl font-semibold mt-6 mb-3">2. Acceptance of Terms</h2>
          <p className="mb-4">
            By registering for or using the Service, you affirm that you are at least 18 years old (or the age of majority in your jurisdiction) and have the legal capacity to agree to these Terms. You agree to comply with all applicable laws and regulations.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">3. Changes to Terms</h2>
          <p className="mb-4">
            We may modify these Terms at any time. When we make changes, we will update the "Last updated" date above and post the updated Terms on this page. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">4. Account Registration</h2>
          <p className="mb-2">Registration: To access certain features (e.g., saving recipes, creating meal plans), you must register for an account and provide accurate, complete information.</p>
          <p className="mb-2">Credentials: You are responsible for maintaining the security of your username and password. Do not share your credentials with others.</p>
          <p className="mb-2">Account Deletion: You may delete your account at any time via your profile settings. Upon deletion, your personal data and Content will be permanently removed, subject to any legal retention obligations.</p>

          <h2 className="text-xl font-semibold mt-6 mb-3">5. User Content</h2>
          <p className="mb-2">Ownership: You retain ownership of Content you submit, but grant Fithub a perpetual, worldwide, royalty-free license to use, reproduce, modify, and display it in connection with the Service.</p>
          <p className="mb-2">Responsibility: You are solely responsible for your Content and its compliance with these Terms. Do not post Content that is unlawful, infringing, or harmful.</p>
          <p className="mb-2">Moderation: We reserve the right to remove or refuse any Content that violates these Terms or is otherwise objectionable.</p>

          <h2 className="text-xl font-semibold mt-6 mb-3">6. Prohibited Conduct</h2>
          <p className="mb-2">You agree not to:</p>
          <ul className="list-disc pl-8 mb-4">
            <li>Violate any laws or infringe others' rights.</li>
            <li>Harass, threaten, or defame other Users.</li>
            <li>Upload viruses or harmful code.</li>
            <li>Scrape, mine, or collect data from the Service without authorization.</li>
            <li>Circumvent or interfere with security features.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">7. Third-Party Services & Links</h2>
          <p className="mb-4">
            The Service may contain links to third-party websites or services. Fithub is not responsible for their content, privacy practices, or terms. Your use of any third-party service is at your own risk.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">8. Disclaimers</h2>
          <p className="mb-4">
            The Service is provided "AS IS" and "AS AVAILABLE," without warranty of any kind. Fithub expressly disclaims all warranties, whether express, implied, or statutory, including fitness for a particular purpose, accuracy of nutritional information, and non-infringement.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">9. Limitation of Liability</h2>
          <p className="mb-4">
            To the maximum extent permitted by law, Fithub and its officers, directors, employees, and agents will not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of (or inability to use) the Service, even if advised of the possibility of such damages.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">10. Indemnification</h2>
          <p className="mb-4">
            You agree to defend, indemnify, and hold harmless Fithub and its affiliates from any claims, damages, losses, liabilities, and expenses (including attorneys' fees) arising out of or related to your violation of these Terms or your Content.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">11. Termination</h2>
          <p className="mb-4">
            We may suspend or terminate your access to the Service at any time, with or without cause or notice, if you breach these Terms or for operational reasons. Upon termination, your rights to use the Service will cease.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">12. Governing Law & Dispute Resolution</h2>
          <p className="mb-4">
            These Terms are governed by the laws of [Your Country/State], without regard to conflict of law principles. Any dispute arising under these Terms will be resolved in the courts located in [Your Jurisdiction], and you consent to personal jurisdiction there.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link to="/register">
            <Button className="mr-4">Back to Registration</Button>
          </Link>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
