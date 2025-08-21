import HowToUseHero from '../components/HowToUseHero';
import CustomerGuide from '../components/CustomerGuide';
import DesignerGuide from '../components/DesignerGuide';
import FAQSection from '../components/FAQSection';
import CTASection from '../components/CTASection';

const HowToUse = () => {
  return (
    <main>
      <HowToUseHero />
      <CustomerGuide />
      <DesignerGuide />
      <FAQSection />
      <CTASection />
    </main>
  );
};

export default HowToUse;