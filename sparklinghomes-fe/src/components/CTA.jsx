import { Link } from 'react-router-dom';

const CTA = () => {
  return (
    <section className="bg-gradient-to-br from-green-600 via-green-700 to-blue-600 py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute top-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-60 h-60 bg-blue-400/10 rounded-full blur-xl"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
          Ready for a Sparkling Clean Home?
        </h2>
        <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
          Join thousands of satisfied customers who trust Sparkling Homes for their
          cleaning needs. No searching, no comparing - just reliable service.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            to="/book"
            className="bg-white text-green-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-50 transition-colors shadow-lg"
          >
            Book Your Cleaning Now
          </Link>
          <Link
            to="/book"
            className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="text-green-200 text-sm">
          ✓ No hidden fees ✓ Small deposit ✓ Professional cleaners ✓ Available nationwide
        </div>
      </div>
    </section>
  );
};

export default CTA;
