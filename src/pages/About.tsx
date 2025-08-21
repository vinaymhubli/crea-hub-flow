
import React from 'react';
import AboutHero from '../components/AboutHero';
import MissionSection from '../components/MissionSection';
import StorySection from '../components/StorySection';
import TeamSection from '../components/TeamSection';
import ValuesSection from '../components/ValuesSection';

const About = () => {
  return (
    <main>
      <AboutHero />
      <MissionSection />
      <StorySection />
      <ValuesSection />
      <TeamSection />
    </main>
  );
};

export default About;
