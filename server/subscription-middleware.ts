import { Request, Response, NextFunction } from 'express';
import { SubscriptionTier, canUserAccessFeature, TierFeatures } from '@shared/subscription-tiers';
import { storage } from './storage';

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      userSubscription?: {
        tier: SubscriptionTier;
        status: string;
        expiresAt: Date | null;
        isActive: boolean;
      };
    }
  }
}

// Middleware to check if user has access to a specific feature
export function requireFeature(featureName: keyof TierFeatures) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get user ID from auth
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ 
          message: 'Authentication required',
          featureRequired: featureName
        });
      }

      // Get user data
      const user = await storage.getUserByUsername(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if user account is active
      if (!user.isActive || (user.accountExpiresAt && new Date() > user.accountExpiresAt)) {
        return res.status(403).json({ 
          message: 'Account inactive or expired',
          featureRequired: featureName
        });
      }

      // Get subscription tier (default to essential for backward compatibility)
      const userTier = (user.subscriptionTier as SubscriptionTier) || 'essential';

      // Check feature access
      const hasAccess = canUserAccessFeature(
        userTier,
        user.subscriptionStatus,
        user.subscriptionExpiresAt,
        featureName
      );

      if (!hasAccess) {
        return res.status(403).json({ 
          message: `This feature requires ${getRequiredTier(featureName)} subscription or higher`,
          userTier: userTier,
          requiredTier: getRequiredTier(featureName),
          featureRequired: featureName
        });
      }

      // Add subscription info to request for further use
      req.userSubscription = {
        tier: userTier,
        status: user.subscriptionStatus,
        expiresAt: user.subscriptionExpiresAt,
        isActive: user.isActive
      };

      next();
    } catch (error) {
      console.error('Feature access check failed:', error);
      res.status(500).json({ 
        message: 'Failed to verify feature access',
        featureRequired: featureName
      });
    }
  };
}

// Middleware to check minimum subscription tier
export function requireTier(minimumTier: SubscriptionTier) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ 
          message: 'Authentication required',
          requiredTier: minimumTier
        });
      }

      const user = await storage.getUserByUsername(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.isActive || (user.accountExpiresAt && new Date() > user.accountExpiresAt)) {
        return res.status(403).json({ 
          message: 'Account inactive or expired',
          requiredTier: minimumTier
        });
      }

      const userTier = (user.subscriptionTier as SubscriptionTier) || 'essential';
      const tierPriorities = { essential: 1, professional: 2, elite: 3 };
      
      if (tierPriorities[userTier] < tierPriorities[minimumTier]) {
        return res.status(403).json({
          message: `This feature requires ${minimumTier} subscription or higher`,
          userTier: userTier,
          requiredTier: minimumTier
        });
      }

      req.userSubscription = {
        tier: userTier,
        status: user.subscriptionStatus,
        expiresAt: user.subscriptionExpiresAt,
        isActive: user.isActive
      };

      next();
    } catch (error) {
      console.error('Tier access check failed:', error);
      res.status(500).json({ 
        message: 'Failed to verify tier access',
        requiredTier: minimumTier
      });
    }
  };
}

// Helper function to determine minimum tier required for a feature
function getRequiredTier(featureName: keyof TierFeatures): SubscriptionTier {
  const tiers: SubscriptionTier[] = ['essential', 'professional', 'elite'];
  
  for (const tier of tiers) {
    if (canUserAccessFeature(tier, 'active', null, featureName)) {
      return tier;
    }
  }
  
  return 'elite'; // Default to highest tier if feature not found
}

// Utility function to get user subscription info
export async function getUserSubscriptionInfo(userId: string) {
  try {
    const user = await storage.getUserByUsername(userId);
    if (!user) return null;

    const userTier = (user.subscriptionTier as SubscriptionTier) || 'essential';
    
    return {
      tier: userTier,
      status: user.subscriptionStatus,
      expiresAt: user.subscriptionExpiresAt,
      isActive: user.isActive,
      accountExpiresAt: user.accountExpiresAt
    };
  } catch (error) {
    console.error('Failed to get user subscription info:', error);
    return null;
  }
}