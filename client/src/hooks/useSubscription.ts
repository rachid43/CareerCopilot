import { SubscriptionTier, canUserAccessFeature, getTierFeatures, TierFeatures, checkUsageLimit } from "@shared/subscription-tiers";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: string;
  expiresAt: Date | null;
  isActive: boolean;
  features: TierFeatures;
}


export function useSubscription() {
  const { user, isLoading: userLoading } = useAuth();
  
  const subscriptionInfo: SubscriptionInfo | null = user ? {
    tier: (user.subscriptionTier as SubscriptionTier) || 'essential',
    status: user.subscriptionStatus || 'active',
    expiresAt: user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null,
    isActive: user.isActive ?? true,
    features: getTierFeatures((user.subscriptionTier as SubscriptionTier) || 'essential')
  } : null;

  return {
    subscription: subscriptionInfo,
    isLoading: userLoading,
    isSubscribed: subscriptionInfo?.status === 'active',
    tier: subscriptionInfo?.tier || 'essential'
  };
}

export function useFeatureAccess(feature: keyof TierFeatures) {
  const { subscription, isLoading } = useSubscription();
  
  if (isLoading || !subscription) {
    return { hasAccess: false, isLoading: true };
  }

  const hasAccess = canUserAccessFeature(
    subscription.tier,
    subscription.status,
    subscription.expiresAt,
    feature
  );

  return { 
    hasAccess, 
    isLoading: false,
    tier: subscription.tier,
    requiresUpgrade: !hasAccess
  };
}

export function useUsageLimit(
  feature: 'maxCvGenerations' | 'maxInterviewSessions' | 'maxJobApplications',
  currentUsage: number
) {
  const { subscription, isLoading } = useSubscription();
  
  if (isLoading || !subscription) {
    return { 
      allowed: false, 
      remaining: 0, 
      isLoading: true,
      isUnlimited: false
    };
  }

  const { allowed, remaining } = checkUsageLimit(
    subscription.tier,
    feature,
    currentUsage
  );

  return {
    allowed,
    remaining,
    isLoading: false,
    isUnlimited: remaining === 'unlimited'
  };
}

// Hook for checking if user can upgrade to a specific tier
export function useCanUpgrade(targetTier: SubscriptionTier) {
  const { subscription } = useSubscription();
  
  if (!subscription) return false;
  
  const tierPriorities = { essential: 1, professional: 2, elite: 3 };
  return tierPriorities[targetTier] > tierPriorities[subscription.tier];
}

// Hook to get tier display information
export function useTierInfo() {
  const { subscription } = useSubscription();
  
  const getTierColor = (tier: SubscriptionTier) => {
    const colors = {
      essential: 'text-gray-600 bg-gray-100',
      professional: 'text-primary bg-orange-100',
      elite: 'text-purple-600 bg-purple-100'
    };
    return colors[tier];
  };

  const getTierDisplayName = (tier: SubscriptionTier) => {
    const names = {
      essential: 'Essential',
      professional: 'Professional',
      elite: 'Elite'
    };
    return names[tier];
  };

  return {
    currentTier: subscription?.tier || 'essential',
    displayName: getTierDisplayName(subscription?.tier || 'essential'),
    colors: getTierColor(subscription?.tier || 'essential'),
    isActive: subscription?.isActive ?? false,
    expiresAt: subscription?.expiresAt
  };
}