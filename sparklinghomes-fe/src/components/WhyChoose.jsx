import { FiCheck, FiClock, FiShield, FiDollarSign } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const WhyChoose = () => {
  const features = [
    "Simple booking form - no searching required",
    "Background checked, vetted cleaners",
    "Small upfront deposit to secure your date",
    "Satisfaction guarantee included",
    "Professional cleaners contact you directly",
    "24/7 customer support throughout the process"
  ];

  const benefits = [
    {
      icon: <FiClock className="w-6 h-6 text-primary-600" />,
      title: "Fast & Simple",
      description: "Book your cleaning in minutes with one form"
    },
    {
      icon: <FiShield className="w-6 h-6 text-green-500" />,
      title: "Satisfaction Guaranteed",
      description: "Your home is cleaned to perfection"
    },
    {
      icon: <FiDollarSign className="w-6 h-6 text-primary-600" />,
      title: "Transparent Pricing",
      description: "Small deposit, no hidden fees, clear costs"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why Choose Sparkling Homes?
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              We've made home cleaning simple, reliable, and stress-free. No searching, no comparing -
              just quality service from vetted professionals.
            </p>

            {/* Features Checklist */}
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <FiCheck className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <span className="text-gray-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Link
              to="/book"
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg inline-block"
            >
              Book Your Cleaning Today
            </Link>
          </div>

          {/* Right Content - Benefits Cards */}
          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                      {benefit.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Additional info card */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
              <div className="text-center">
                <h4 className="text-lg font-bold text-gray-900 mb-2">
                  Join 10,000+ Happy Homeowners
                </h4>
                <p className="text-gray-600 text-sm">
                  Thousands of homes sparkled to perfection with 99% customer satisfaction
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
