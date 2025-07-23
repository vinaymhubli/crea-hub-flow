
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AIHero from '../components/AIHero';
import FeaturesSection from '../components/FeaturesSection';
import ComingSoonSection from '../components/ComingSoonSection';
import CTASection from '../components/CTASection';

const AIAssistant = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <AIHero />
      <FeaturesSection />
      <ComingSoonSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default AIAssistant;
