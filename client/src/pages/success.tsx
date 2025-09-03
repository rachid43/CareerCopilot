import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircleIcon, ArrowRightIcon } from 'lucide-react';

export default function SuccessPage() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  
  // Get tier from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const tier = urlParams.get('tier') as 'essential' | 'professional' | 'elite' || 'professional';

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md mx-auto px-4">
        <Card className={`text-center ${getTierBackground(tier)}`}>
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            
            <CardTitle className="text-2xl text-gray-900 mb-2">
              {t('paymentSuccessful')}
            </CardTitle>
            
            <p className="text-gray-600">
              {t('subscriptionActivated')}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className={`font-semibold ${getTierColor(tier)}`}>
                {t(`${tier}Plan`)}
              </p>
              <p className="text-sm text-gray-600">
                {t('accessGranted')}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setLocation('/')}
                className="w-full"
                data-testid="button-continue-home"
              >
                {t('continueToApp')}
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
              
              <p className="text-xs text-gray-500">
                {t('receiptSentEmail')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}