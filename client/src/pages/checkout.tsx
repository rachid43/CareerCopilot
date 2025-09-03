import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckIcon, Loader2Icon } from 'lucide-react';
import { subscriptionTiers } from '@shared/subscription-tiers';

export default function CheckoutPage() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get tier from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const tier = urlParams.get('tier') as 'essential' | 'professional' | 'elite' || 'professional';

  const tierInfo = subscriptionTiers[tier];
  const features = tierInfo.features;

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      
      const result = await apiRequest('POST', '/api/subscription/create-checkout-session', {
        subscriptionTier: tier,
        successUrl: `${window.location.origin}/success?tier=${tier}`,
        cancelUrl: `${window.location.origin}/`,
      });

      // Redirect to Stripe checkout
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: t('error'),
        description: t('paymentError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTierColor = (tierName: string) => {
    switch (tierName) {
      case 'essential': return 'text-blue-600';
      case 'professional': return 'text-orange-600';
      case 'elite': return 'text-purple-600';
      default: return 'text-orange-600';
    }
  };

  const getTierBackground = (tierName: string) => {
    switch (tierName) {
      case 'essential': return 'bg-blue-50 border-blue-200';
      case 'professional': return 'bg-orange-50 border-orange-200';
      case 'elite': return 'bg-purple-50 border-purple-200';
      default: return 'bg-orange-50 border-orange-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('upgradeSubscription')}
          </h1>
          <p className="text-gray-600">
            {t('upgradeToUnlockFeatures')}
          </p>
        </div>

        {/* Selected Plan Card */}
        <Card className={`mb-8 ${getTierBackground(tier)}`}>
          <CardHeader className="text-center">
            <CardTitle className={`text-2xl ${getTierColor(tier)}`}>
              {t(`${tier}Plan`)}
            </CardTitle>
            <CardDescription className="text-4xl font-bold text-gray-900">
              €{tierInfo.monthlyPrice}
              <span className="text-lg font-normal text-gray-600">/month</span>
            </CardDescription>
            <p className="text-gray-600">
              {t(`${tier}Description`)}
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                {t('featuresIncluded')}
              </h3>
              
              <ul className="space-y-3">
                {features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckIcon className={`h-5 w-5 mt-0.5 ${getTierColor(tier)}`} />
                    <span className="text-gray-700">{t(feature)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            disabled={isLoading}
            data-testid="button-cancel-checkout"
          >
            {t('cancel')}
          </Button>
          
          <Button
            onClick={handleSubscribe}
            disabled={isLoading}
            className={`${getTierColor(tier).replace('text-', 'bg-').replace('-600', '-600')} hover:opacity-90`}
            data-testid="button-proceed-payment"
          >
            {isLoading ? (
              <>
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                {t('processing')}
              </>
            ) : (
              t('proceedToPayment')
            )}
          </Button>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {t('securePaymentNotice')}
          </p>
        </div>
      </div>
    </div>
  );
}