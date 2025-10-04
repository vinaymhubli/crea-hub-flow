import React, { useState, useEffect } from 'react';
import { Check, Star, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import CTASection from '@/components/CTASection';
import FAQSection from '@/components/FAQSection';
import { supabase } from '@/integrations/supabase/client';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  button_text: string;
  button_url: string;
  is_popular: boolean;
  is_published: boolean;
  sort_order: number;
}

interface DesignerPricing {
  id: string;
  title: string;
  description: string;
  platform_fee_percentage: number;
  features: string[];
  button_text: string;
  button_url: string;
  is_published: boolean;
}

const Pricing = () => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [designerPricing, setDesignerPricing] = useState<DesignerPricing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      setLoading(true);
      
      // Fetch customer pricing plans
      const { data: plansData, error: plansError } = await supabase
        .from('pricing_plans' as any)
        .select('*')
        .eq('is_published', true)
        .eq('plan_type', 'customer')
        .order('sort_order', { ascending: true });

      if (plansError) throw plansError;

      // Fetch designer pricing
      const { data: designerData, error: designerError } = await supabase
        .from('designer_pricing' as any)
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .single();

      if (designerError && designerError.code !== 'PGRST116') throw designerError;

      setPlans((plansData as PricingPlan[]) || []);
      setDesignerPricing((designerData as DesignerPricing) || null);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      // Fallback to empty arrays if database fetch fails
      setPlans([]);
      setDesignerPricing(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Badge className="mb-4" variant="secondary">
            <Star className="w-4 h-4 mr-2" />
            Transparent Pricing
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Simple, Fair Pricing
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Choose the plan that works best for you. No hidden fees, no surprises. 
            Start free and upgrade when you're ready.
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Plans for Every Need</h2>
            <p className="text-muted-foreground">Whether you're just starting out or running a design team</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading pricing plans...</p>
            </div>
          ) : plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <Card key={plan.id} className={`relative ${plan.is_popular ? 'border-primary shadow-lg scale-105' : ''}`}>
                  {plan.is_popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2" variant="default">
                      <Zap className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="py-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={plan.is_popular ? "default" : "outline"}
                      asChild
                    >
                      <Link to={plan.button_url}>{plan.button_text}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No pricing plans available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Designer Pricing */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">For Designers</h2>
            <p className="text-muted-foreground">Grow your business with our designer-friendly pricing</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading designer pricing...</p>
            </div>
          ) : designerPricing ? (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{designerPricing.title}</CardTitle>
                  <CardDescription>{designerPricing.description}</CardDescription>
                  <div className="py-4">
                    <span className="text-4xl font-bold">{designerPricing.platform_fee_percentage}%</span>
                    <span className="text-muted-foreground"> platform fee</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {designerPricing.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" asChild>
                    <Link to={designerPricing.button_url}>{designerPricing.button_text}</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Designer pricing information not available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <Shield className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-muted-foreground">Your payments are protected with bank-level security</p>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Hidden Fees</h3>
              <p className="text-muted-foreground">What you see is what you pay. No surprises</p>
            </div>
            <div className="flex flex-col items-center">
              <Star className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Money-Back Guarantee</h3>
              <p className="text-muted-foreground">Not satisfied? Get your money back within 30 days</p>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
      <CTASection />
    </div>
  );
};

export default Pricing;