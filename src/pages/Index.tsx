
import React from 'react';
import HeroSection from '../components/HeroSection';
import HowItWorks from '../components/HowItWorks';
import MobileShowcase from '../components/MobileShowcase';
import FeaturedDesigners from '../components/FeaturedDesigners';
import FeaturedDesignersDisplay from '../components/FeaturedDesignersDisplay';
import PromotionBanner from '../components/PromotionBanner';
import TrustSection from '../components/TrustSection';
import FeaturesSection from '../components/FeaturesSection';

const Index = () => {
  return (
    <main>
      <HeroSection />
      <PromotionBanner location="homepage" className="container mx-auto px-4 py-8" />
      <HowItWorks />
      <MobileShowcase />
      <FeaturedDesignersDisplay className="container mx-auto px-4 py-8" />
      <TrustSection />
      <FeaturesSection />
    </main>
  );
};

export default Index;
