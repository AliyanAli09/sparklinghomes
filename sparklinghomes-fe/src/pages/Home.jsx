import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import WhyChoose from '../components/WhyChoose';
import CTA from '../components/CTA';

const Home = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <HowItWorks />
      <WhyChoose />
      <CTA />
    </div>
  );
};

export default Home;
