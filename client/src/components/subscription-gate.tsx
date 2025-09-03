import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Zap } from "lucide-react";
import { useFeatureAccess, useTierInfo } from "@/hooks/useSubscription";
import { TierFeatures } from "@shared/subscription-tiers";
import { useLanguage } from "@/lib/i18n";

interface SubscriptionGateProps {
  feature: keyof TierFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export function SubscriptionGate({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: SubscriptionGateProps) {
  const { hasAccess, tier, requiresUpgrade } = useFeatureAccess(feature);
  const { t } = useLanguage();
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (!showUpgradePrompt) {
    return null;
  }

  return <UpgradePrompt feature={feature} currentTier={tier} />;
}

interface UpgradePromptProps {
  feature: keyof TierFeatures;
  currentTier: string;
  title?: string;
  description?: string;
}

export function UpgradePrompt({ 
  feature, 
  currentTier, 
  title,
  description 
}: UpgradePromptProps) {
  const { t } = useLanguage();
  const { displayName, colors } = useTierInfo();

  const getRequiredTier = (feature: keyof TierFeatures) => {
    const featureToTier = {
      unlimitedCvScoring: 'professional',
      unlimitedTextInterviews: 'professional',
      avatarInterviews: 'elite',
      unlimitedAvatarInterviews: 'elite',
      advancedFeedback: 'professional',
      personalizedReports: 'elite',
      industryQuestionBanks: 'elite',
      prioritySupport: 'elite'
    };
    return featureToTier[feature] || 'professional';
  };

  const requiredTier = getRequiredTier(feature);
  const requiredTierDisplay = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);
  
  const getTierIcon = (tier: string) => {
    if (tier === 'elite') return Crown;
    if (tier === 'professional') return Zap;
    return Lock;
  };

  const TierIcon = getTierIcon(requiredTier);

  return (
    <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <TierIcon className="h-6 w-6 text-gray-400" />
        </div>
        <CardTitle className="text-lg">
          {title || t('upgradeRequired')}
        </CardTitle>
        <CardDescription className="text-center">
          {description || t('thisFeatureRequires')} {requiredTierDisplay} {t('subscriptionOrHigher')}
        </CardDescription>
        
        <div className="flex items-center justify-center gap-2 mt-2">
          <Badge variant="outline" className={colors}>
            {t('currentPlan')}: {displayName}
          </Badge>
          <Badge className={`${requiredTier === 'professional' ? 'bg-primary' : 'bg-purple-600'} text-white`}>
            {t('required')}: {requiredTierDisplay}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="text-center pt-0">
        <Button 
          size="lg"
          className={`w-full ${requiredTier === 'professional' ? 'bg-primary hover:bg-orange-600' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
          onClick={() => {
            window.location.href = `/checkout?tier=${requiredTier}`;
          }}
        >
          {t('upgradeTo')} {requiredTierDisplay}
        </Button>
        
        <p className="text-xs text-gray-500 mt-2">
          {t('upgradeInstantly')}
        </p>
      </CardContent>
    </Card>
  );
}

// Component to show current subscription status
export function SubscriptionStatus() {
  const { displayName, colors, isActive, expiresAt } = useTierInfo();
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Badge className={colors}>
        {displayName}
      </Badge>
      {!isActive && (
        <Badge variant="destructive">
          {t('inactive')}
        </Badge>
      )}
      {expiresAt && (
        <span className="text-xs text-gray-500">
          {t('expires')}: {expiresAt.toLocaleDateString()}
        </span>
      )}
    </div>
  );
}

// Usage limit component
interface UsageLimitProps {
  remaining: number | 'unlimited';
  total: number | 'unlimited';
  feature: string;
}

export function UsageLimit({ remaining, total, feature }: UsageLimitProps) {
  const { t } = useLanguage();
  
  if (remaining === 'unlimited') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Zap className="h-4 w-4" />
        <span>{t('unlimited')} {feature}</span>
      </div>
    );
  }

  const percentage = total !== 'unlimited' ? ((total as number - (remaining as number)) / (total as number)) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{feature}</span>
        <span className={remaining === 0 ? 'text-red-500' : 'text-gray-600'}>
          {remaining} {t('remaining')}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all ${
            percentage > 80 ? 'bg-red-500' : 
            percentage > 60 ? 'bg-yellow-500' : 
            'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}