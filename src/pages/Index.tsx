
import React from 'react';
import HeroSection from '../components/HeroSection';
import HowItWorks from '../components/HowItWorks';
import MobileShowcase from '../components/MobileShowcase';
import FeaturedDesigners from '../components/FeaturedDesigners';
import TrustSection from '../components/TrustSection';
import FeaturesSection from '../components/FeaturesSection';

const Index = () => {
  return (
    <main>
      <HeroSection />
      <HowItWorks />
      <MobileShowcase />
      <FeaturedDesigners />
      <TrustSection />
      <FeaturesSection />
    </main>
  );
};

export default Index;
