// Subscription Tier System for CareerCopilot

export type SubscriptionTier = 'essential' | 'professional' | 'elite';

export interface TierFeatures {
  // Core Features
  cvCoverLetterGeneration: boolean;
  matchingScoreAnalysis: boolean;
  aiMentorChat: boolean;
  
  // Job Tracker Features
  jobTrackerBasic: boolean;
  jobTrackerFull: boolean;
  
  // Mock Interview Features
  textInterviews: boolean;
  avatarInterviews: boolean;
  unlimitedTextInterviews: boolean;
  unlimitedAvatarInterviews: boolean;
  
  // Advanced Features
  unlimitedCvScoring: boolean;
  advancedFeedback: boolean;
  personalizedReports: boolean;
  industryQuestionBanks: boolean;
  prioritySupport: boolean;
  
  // Limits
  maxCvGenerations: number | 'unlimited';
  maxInterviewSessions: number | 'unlimited';
  maxJobApplications: number | 'unlimited';
}

// Define features for each tier
export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  essential: {
    // Core Features
    cvCoverLetterGeneration: true,
    matchingScoreAnalysis: true,
    aiMentorChat: true,
    
    // Job Tracker
    jobTrackerBasic: true,
    jobTrackerFull: false,
    
    // Mock Interviews
    textInterviews: true,
    avatarInterviews: false,
    unlimitedTextInterviews: false,
    unlimitedAvatarInterviews: false,
    
    // Advanced Features
    unlimitedCvScoring: false,
    advancedFeedback: false,
    personalizedReports: false,
    industryQuestionBanks: false,
    prioritySupport: false,
    
    // Limits
    maxCvGenerations: 10,
    maxInterviewSessions: 5,
    maxJobApplications: 50,
  },
  
  professional: {
    // Core Features
    cvCoverLetterGeneration: true,
    matchingScoreAnalysis: true,
    aiMentorChat: true,
    
    // Job Tracker
    jobTrackerBasic: true,
    jobTrackerFull: true,
    
    // Mock Interviews
    textInterviews: true,
    avatarInterviews: false,
    unlimitedTextInterviews: true,
    unlimitedAvatarInterviews: false,
    
    // Advanced Features
    unlimitedCvScoring: true,
    advancedFeedback: true,
    personalizedReports: false,
    industryQuestionBanks: false,
    prioritySupport: false,
    
    // Limits
    maxCvGenerations: 'unlimited',
    maxInterviewSessions: 'unlimited',
    maxJobApplications: 'unlimited',
  },
  
  elite: {
    // Core Features
    cvCoverLetterGeneration: true,
    matchingScoreAnalysis: true,
    aiMentorChat: true,
    
    // Job Tracker
    jobTrackerBasic: true,
    jobTrackerFull: true,
    
    // Mock Interviews
    textInterviews: true,
    avatarInterviews: true,
    unlimitedTextInterviews: true,
    unlimitedAvatarInterviews: true,
    
    // Advanced Features
    unlimitedCvScoring: true,
    advancedFeedback: true,
    personalizedReports: true,
    industryQuestionBanks: true,
    prioritySupport: true,
    
    // Limits
    maxCvGenerations: 'unlimited',
    maxInterviewSessions: 'unlimited',
    maxJobApplications: 'unlimited',
  }
};

// Utility functions for checking tier access
export function getTierFeatures(tier: SubscriptionTier): TierFeatures {
  return TIER_FEATURES[tier];
}

export function hasFeatureAccess(
  userTier: SubscriptionTier, 
  feature: keyof TierFeatures
): boolean {
  return TIER_FEATURES[userTier][feature] === true;
}

export function canUserAccessFeature(
  userTier: SubscriptionTier,
  subscriptionStatus: string,
  subscriptionExpiresAt: Date | null,
  feature: keyof TierFeatures
): boolean {
  // Check if subscription is active
  if (subscriptionStatus !== 'active') {
    return false;
  }
  
  // Check if subscription hasn't expired
  if (subscriptionExpiresAt && new Date() > subscriptionExpiresAt) {
    return false;
  }
  
  // Check if tier has access to feature
  return hasFeatureAccess(userTier, feature);
}

export function checkUsageLimit(
  userTier: SubscriptionTier,
  feature: 'maxCvGenerations' | 'maxInterviewSessions' | 'maxJobApplications',
  currentUsage: number
): { allowed: boolean; remaining: number | 'unlimited' } {
  const tierFeatures = getTierFeatures(userTier);
  const limit = tierFeatures[feature];
  
  if (limit === 'unlimited') {
    return { allowed: true, remaining: 'unlimited' };
  }
  
  const remaining = Math.max(0, (limit as number) - currentUsage);
  return { 
    allowed: currentUsage < (limit as number), 
    remaining 
  };
}

export function getTierPriority(tier: SubscriptionTier): number {
  const priorities = {
    essential: 1,
    professional: 2,
    elite: 3
  };
  return priorities[tier];
}

export function canUpgradeFrom(currentTier: SubscriptionTier, targetTier: SubscriptionTier): boolean {
  return getTierPriority(targetTier) > getTierPriority(currentTier);
}

export function getTierDisplayName(tier: SubscriptionTier): string {
  const displayNames = {
    essential: 'Essential',
    professional: 'Professional', 
    elite: 'Elite'
  };
  return displayNames[tier];
}

export function getTierColor(tier: SubscriptionTier): string {
  const colors = {
    essential: 'text-gray-600',
    professional: 'text-primary',
    elite: 'text-purple-600'
  };
  return colors[tier];
}

// Subscription pricing and feature lists for UI display
export interface TierInfo {
  monthlyPrice: number;
  features: string[];
}

export const subscriptionTiers: Record<SubscriptionTier, TierInfo> = {
  essential: {
    monthlyPrice: 9.99,
    features: [
      'cvCoverLetterGeneration',
      'matchingScoreAnalysis', 
      'aiMentorChat',
      'jobTrackerBasic',
      'textInterviews',
      'maxCvGenerations10',
      'maxInterviewSessions5',
      'maxJobApplications50'
    ]
  },
  professional: {
    monthlyPrice: 19.99,
    features: [
      'cvCoverLetterGeneration',
      'matchingScoreAnalysis',
      'aiMentorChat', 
      'jobTrackerFull',
      'unlimitedTextInterviews',
      'unlimitedCvScoring',
      'advancedFeedback',
      'unlimitedCvGenerations',
      'unlimitedInterviewSessions',
      'unlimitedJobApplications'
    ]
  },
  elite: {
    monthlyPrice: 29.99,
    features: [
      'cvCoverLetterGeneration',
      'matchingScoreAnalysis',
      'aiMentorChat',
      'jobTrackerFull',
      'avatarInterviews',
      'unlimitedTextInterviews',
      'unlimitedAvatarInterviews',
      'unlimitedCvScoring',
      'advancedFeedback',
      'personalizedReports',
      'industryQuestionBanks',
      'prioritySupport',
      'unlimitedCvGenerations',
      'unlimitedInterviewSessions',
      'unlimitedJobApplications'
    ]
  }
};