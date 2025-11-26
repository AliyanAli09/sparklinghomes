import { FiCalendar, FiCreditCard, FiCheckCircle, FiPhone } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      icon: <FiCalendar className="w-8 h-8 text-white" />,
      title: "Fill Out Form",
      description: "Tell us about your cleaning needs and schedule.",
      detail: "Enter property details, cleaning type, date, time, and special instructions"
    },
    {
      number: "2",
      icon: <FiCreditCard className="w-8 h-8 text-white" />,
      title: "Pay Deposit",
      description: "Secure your booking with a small upfront deposit.",
      detail: "Pay a small deposit to lock in your cleaning date and time"
    },
    {
      number: "3",
      icon: <FiCheckCircle className="w-8 h-8 text-white" />,
      title: "Get Confirmation",
      description: "Receive confirmation and next steps.",
      detail: "Get email/text confirmation with booking summary and what to expect"
    },
    {
      number: "4",
      icon: <FiPhone className="w-8 h-8 text-white" />,
      title: "Cleaner Contacts You",
      description: "Professional cleaner reaches out to confirm details.",
      detail: "A vetted cleaner will contact you directly to finalize arrangements"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get your cleaning service started in four simple steps. We handle the cleaner matching - you just relax.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gray-200 z-0"></div>
              )}
              
              {/* Step Circle */}
              <div className="relative z-10 mx-auto mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {step.number}
                </div>
              </div>

              {/* Step Content */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 mb-4 font-medium">
                {step.description}
              </p>
              <p className="text-sm text-gray-500">
                {step.detail}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link
            to="/book"
            className="bg-gradient-to-r from-primary-600 to-red-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-primary-700 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 inline-block"
          >
            Book Your Cleaning Today
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
