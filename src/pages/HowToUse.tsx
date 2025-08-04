import Header from '../components/Header';
import Footer from '../components/Footer';
import HowToUseHero from '../components/HowToUseHero';
import CustomerGuide from '../components/CustomerGuide';
import DesignerGuide from '../components/DesignerGuide';
import FAQSection from '../components/FAQSection';
import CTASection from '../components/CTASection';

const HowToUse = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HowToUseHero />
        <CustomerGuide />
        <DesignerGuide />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default HowToUse;