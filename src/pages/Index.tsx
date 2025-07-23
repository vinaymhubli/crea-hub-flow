
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import HowItWorks from '../components/HowItWorks';
import FeaturedDesigners from '../components/FeaturedDesigners';
import FeaturesSection from '../components/FeaturesSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <HowItWorks />
        <FeaturedDesigners />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
