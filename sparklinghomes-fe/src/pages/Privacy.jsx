import { Link } from 'react-router-dom';
import { FiTruck, FiShield, FiEye, FiLock, FiArrowLeft, FiDatabase, FiUserCheck } from 'react-icons/fi';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link
              to="/register"
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
            >
              <FiArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <FiTruck className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sparkling Homes Privacy Policy</h2>
            <p className="text-gray-600 mb-2">Effective Date: September 1, 2025</p>
            <p className="text-gray-600">Last Updated: September 1, 2025</p>
          </div>

          {/* Introduction */}
          <div className="mb-12">
            <p className="text-lg text-gray-700 leading-relaxed">
              Sparkling Homes ("we," "our," "us") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.
            </p>
          </div>

          {/* 1. Information We Collect */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <FiDatabase className="h-6 w-6 text-blue-600 mr-3" />
              1. Information We Collect
            </h3>
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-xl p-6">
                <h4 className="font-semibold text-blue-900 mb-3">Personal Information</h4>
                <p className="text-blue-800">Name, phone number, email address, and payment details for processing deposits.</p>
              </div>
              
              <div className="bg-blue-50 rounded-xl p-6">
                <h4 className="font-semibold text-blue-900 mb-3">Booking Information</h4>
                <p className="text-blue-800">Move date, addresses, and job details you provide.</p>
              </div>

              <div className="bg-blue-50 rounded-xl p-6">
                <h4 className="font-semibold text-blue-900 mb-3">Technical Data</h4>
                <p className="text-blue-800">IP address, browser type, device information, and cookies to improve site performance.</p>
              </div>
            </div>
          </div>

          {/* 2. How We Use Your Information */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <FiEye className="h-6 w-6 text-blue-600 mr-3" />
              2. How We Use Your Information
            </h3>
            <div className="bg-gray-50 rounded-xl p-6">
              <ul className="list-disc list-inside space-y-3 text-gray-700">
                <li>To process deposits and secure your booking.</li>
                <li>To connect you with independent cleaning service providers ("ISPs").</li>
                <li>To send booking confirmations, receipts, and service updates.</li>
                <li>To improve and market our platform (your personal data is never sold).</li>
              </ul>
            </div>
          </div>

          {/* 3. Sharing of Information */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <FiUserCheck className="h-6 w-6 text-blue-600 mr-3" />
              3. Sharing of Information
            </h3>
            <div className="bg-gray-50 rounded-xl p-6">
              <ul className="list-disc list-inside space-y-3 text-gray-700">
                <li>We share booking details only with ISPs who accept your job.</li>
                <li>We do not sell, rent, or trade your personal information.</li>
                <li>Information may be shared with authorities if legally required.</li>
              </ul>
            </div>
          </div>

          {/* 4. Payments */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <FiLock className="h-6 w-6 text-red-600 mr-3" />
              4. Payments
            </h3>
            <div className="bg-red-50 rounded-xl p-6">
              <ul className="list-disc list-inside space-y-2 text-red-800">
                <li>Deposits are processed securely through third-party payment processors.</li>
                <li>Sparkling Homes never stores full credit card numbers.</li>
              </ul>
            </div>
          </div>

          {/* 5. Cookies */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">5. Cookies</h3>
            <div className="bg-yellow-50 rounded-xl p-6">
              <p className="text-yellow-800">
                We use cookies to improve your browsing experience. You may disable cookies in your browser settings, but some features may not work properly.
              </p>
            </div>
          </div>

          {/* 6. Data Security */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <FiLock className="h-6 w-6 text-red-600 mr-3" />
              6. Data Security
            </h3>
            <div className="bg-red-50 rounded-xl p-6">
              <p className="text-red-800">
                We use industry-standard encryption and safeguards to protect your information. However, no online system can be guaranteed to be 100% secure.
              </p>
            </div>
          </div>

          {/* 7. Third-Party Access */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">7. Third-Party Access</h3>
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-gray-700">
                Sparkling Homes does not share, sell, or link your information to outside websites or unrelated third parties. Your information is used only to manage bookings, process deposits, and connect you with Independent Service Providers (ISPs) through our platform.
              </p>
            </div>
          </div>

          {/* 8. Your Choices */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">8. Your Choices</h3>
            <div className="bg-blue-50 rounded-xl p-6">
              <ul className="list-disc list-inside space-y-2 text-blue-800">
                <li>You may update or delete your account information by contacting us.</li>
                <li>You may opt out of marketing emails at any time by clicking "unsubscribe."</li>
              </ul>
            </div>
          </div>

          {/* 9. Children's Privacy */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h3>
            <div className="bg-orange-50 rounded-xl p-6">
              <p className="text-orange-800">
                Our services are not directed to children under 18. We do not knowingly collect information from minors.
              </p>
            </div>
          </div>

          {/* 10. Contact Us */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h3>
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-gray-700">
                If you have questions about this Privacy Policy, please email us at: <strong>Support@BookAndMove.com</strong>
              </p>
            </div>
          </div>

          {/* Back to Registration */}
          <div className="text-center pt-8 border-t border-gray-200">
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <FiArrowLeft className="h-5 w-5 mr-2" />
              Back to Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;

