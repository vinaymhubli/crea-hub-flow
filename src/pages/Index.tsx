
import React from 'react';
import HeroSection from '../components/HeroSection';
import HowItWorks from '../components/HowItWorks';
import MobileShowcase from '../components/MobileShowcase';
import { FeaturedDesignersWithVideo } from '../components/FeaturedDesignersWithVideo';
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
      <FeaturedDesignersWithVideo />
      <TrustSection />
      <FeaturesSection />
    </main>
  );
};

export default Index;
