// Example: How to Use Subscription Tier Access Control System
// This file demonstrates the complete implementation

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, MessageCircle, Crown } from "lucide-react";
import { 
  SubscriptionGate, 
  SubscriptionStatus, 
  UsageLimit,
  UpgradePrompt 
} from "@/components/subscription-gate";
import { 
  useFeatureAccess, 
  useUsageLimit, 
  useSubscription,
  useTierInfo 
} from "@/hooks/useSubscription";

// Example 1: Feature Gating in Mock Interview
export function MockInterviewExample() {
  const { hasAccess } = useFeatureAccess('avatarInterviews');
  const { allowed, remaining } = useUsageLimit('maxInterviewSessions', 3);
  const { tier } = useSubscription();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mock Interview</h2>
        <SubscriptionStatus />
      </div>

      {/* Usage Limits Display */}
      <UsageLimit 
        remaining={remaining} 
        total={tier === 'essential' ? 5 : 'unlimited'} 
        feature="Interview Sessions" 
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Text Interview - Available to all tiers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Text Interview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Practice with text-based questions and get detailed feedback.
            </p>
            <Button className="w-full" disabled={!allowed}>
              Start Text Interview
            </Button>
          </CardContent>
        </Card>

        {/* Avatar Interview - Elite tier only */}
        <SubscriptionGate 
          feature="avatarInterviews"
          showUpgradePrompt={true}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Avatar Interview
                <Crown className="h-4 w-4 text-yellow-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Practice with AI avatars using webcam and microphone.
              </p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Start Avatar Interview
              </Button>
            </CardContent>
          </Card>
        </SubscriptionGate>
      </div>

      {/* Upgrade prompt for features not available */}
      {!hasAccess && (
        <UpgradePrompt 
          feature="avatarInterviews" 
          currentTier={tier}
          title="Unlock Premium Interview Experience"
          description="Get access to AI avatar interviews with advanced feedback and personalized coaching."
        />
      )}
    </div>
  );
}

// Example 2: Backend Route Protection
/*
// In server/routes.ts

import { requireFeature, requireTier } from './subscription-middleware';

// Protect specific features
app.post('/api/mock-interview/avatar', 
  isAuthenticated, 
  requireFeature('avatarInterviews'), 
  async (req, res) => {
    // This route is only accessible to Elite tier users
    // with active subscription
  }
);

// Protect by minimum tier
app.post('/api/cv/unlimited-scoring', 
  isAuthenticated, 
  requireTier('professional'), 
  async (req, res) => {
    // Professional and Elite tiers can access this
  }
);

// Check usage limits
app.post('/api/mock-interview/start', 
  isAuthenticated, 
  async (req, res) => {
    const userId = req.user.claims.sub;
    const subscriptionInfo = await getUserSubscriptionInfo(userId);
    
    // Get current usage
    const currentSessions = await storage.getInterviewSessionsCount(userId);
    
    // Check if user can create more sessions
    const { allowed } = checkUsageLimit(
      subscriptionInfo.tier, 
      'maxInterviewSessions', 
      currentSessions
    );
    
    if (!allowed) {
      return res.status(403).json({
        message: 'Interview session limit reached',
        upgrade: true
      });
    }
    
    // Proceed with creating interview session
  }
);
*/

// Example 3: Admin Panel for Managing Subscriptions
export function AdminSubscriptionManager({ userId }: { userId: number }) {
  const handleUpgradeTier = async (newTier: string) => {
    try {
      await fetch(`/api/admin/users/${userId}/subscription-tier`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier })
      });
      // Refresh user data
    } catch (error) {
      console.error('Failed to upgrade tier:', error);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Manage Subscription</h3>
      
      <div className="flex gap-2">
        <Button 
          onClick={() => handleUpgradeTier('essential')}
          variant="outline"
        >
          Set to Essential
        </Button>
        <Button 
          onClick={() => handleUpgradeTier('professional')}
          className="bg-primary"
        >
          Set to Professional
        </Button>
        <Button 
          onClick={() => handleUpgradeTier('elite')}
          className="bg-purple-600"
        >
          Set to Elite
        </Button>
      </div>
    </div>
  );
}

// Example 4: Feature-Specific Component
export function CVScoringSection() {
  const { hasAccess } = useFeatureAccess('unlimitedCvScoring');

  return (
    <SubscriptionGate 
      feature="unlimitedCvScoring"
      fallback={
        <div className="text-center p-4 border border-gray-200 rounded-lg">
          <p className="text-gray-500">
            CV scoring is limited to 3 per month on Essential plan
          </p>
        </div>
      }
    >
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-700 font-medium">
          ✨ Unlimited CV scoring available with your {hasAccess ? 'Professional+' : 'current'} plan
        </p>
      </div>
    </SubscriptionGate>
  );
}