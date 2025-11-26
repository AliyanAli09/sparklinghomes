import { FiStar, FiShield, FiClock } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-green-600 via-green-700 to-blue-600 min-h-screen flex items-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-black/10"></div>
      
      <div className="max-w-7xl lg:mx-auto px-4 sm:px-6 mt-14 mb-14 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Book Online Clean Anytime
            </h1>
            <p className="text-lg text-green-100 mb-8 leading-relaxed">
              1. Get Free Quote
            </p>
            <p className="text-lg text-green-200 mb-8 max-w-lg">
              2. Pay Your Deposit
            </p>
            <p className="text-lg text-green-200 mb-8 max-w-lg">
              3. Relax, Cleaners Are On The Way
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                to="/book"
                className="bg-white text-green-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-50 transition-colors shadow-lg text-center"
              >
                Book Your Clean Now
              </Link>
              
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">10K+</div>
                <div className="text-green-200 text-sm">HOMES CLEANED</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">4.9★</div>
                <div className="text-green-200 text-sm">AVERAGE RATING</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-green-200 text-sm">SUPPORT</div>
              </div>
            </div>
          </div>

          {/* Right Content - Image */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=870&auto=format&fit=crop"
                alt="Professional home cleaning service"
                className="w-full h-auto rounded-xl shadow-lg"
              />
              {/* Overlay badge */}
              <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-semibold shadow-lg">
                Trusted Cleaners
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating elements for visual interest */}
      <div className="absolute top-1/4 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-green-400/20 rounded-full blur-xl"></div>
    </section>
  );
};

export default Hero;
