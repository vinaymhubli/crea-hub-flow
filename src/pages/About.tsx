
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AboutHero from '../components/AboutHero';
import MissionSection from '../components/MissionSection';
import StorySection from '../components/StorySection';
import TeamSection from '../components/TeamSection';
import ValuesSection from '../components/ValuesSection';

const About = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <AboutHero />
      <MissionSection />
      <StorySection />
      <ValuesSection />
      <TeamSection />
      <Footer />
    </div>
  );
};

export default About;
