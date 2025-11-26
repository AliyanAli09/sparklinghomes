import { FiHome } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Footer = () => {
  const quickLinks = [
    "Home",
    "Book Now",
    "For Cleaners",
    "Contact Us"
  ];

  const services = [
    "Standard Cleaning",
    "Deep Cleaning",
    "Move-In/Out Cleaning",
    "Airbnb Turnover",
    "Post-Construction"
  ];

  return (
    <footer className="bg-dark-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="h-10 w-10 bg-green-600 rounded-xl flex items-center justify-center">
                <FiHome className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Sparkling Homes</span>
            </div>
            <p className="text-gray-400 mb-4">
              Professional home cleaning services.
              Book Online Clean Anytime!
            </p>
           
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Services</h3>
            <ul className="space-y-3">
              {services.map((service, index) => (
                <li key={index}>
                  <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Contact</h3>
            <div className="space-y-3 text-gray-400">
             
              <a href="mailto:marcusbrndn@yahoo.com">marcusbrndn@yahoo.com</a>
              <p>✨ Professional Cleaning Services</p>
              <button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors" onClick={() => window.location.href = '/book'}>
                Book Now
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Sparkling Homes Cleaning Service • All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-gray-400 hover:text-green-400 text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-green-400 text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
