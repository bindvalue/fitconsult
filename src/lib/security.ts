// Security utility functions
import { supabase } from '@/integrations/supabase/client';

export const validateInput = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length >= 5 && email.length <= 255;
  },

  password: (password: string): boolean => {
    return password.length >= 12 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password) &&
           /[!@#$%^&*(),.?":{}|<>]/.test(password);
  },

  name: (name: string): boolean => {
    return name.length >= 2 && name.length <= 100 && /^[a-zA-ZÀ-ÿ\s]+$/.test(name);
  },

  phone: (phone: string): boolean => {
    const phoneRegex = /^[0-9\+\-\s\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 10 && phone.length <= 20;
  },

  uuid: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  sanitizeString: (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  }
};

export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  isValid: boolean;
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 12) {
    feedback.push('Deve ter pelo menos 12 caracteres');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Deve conter pelo menos uma letra maiúscula');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Deve conter pelo menos uma letra minúscula');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    feedback.push('Deve conter pelo menos um número');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Deve conter pelo menos um caractere especial');
  } else {
    score += 1;
  }

  if (password.length > 16) {
    score += 1;
  }

  const isValid = score >= 5;

  return {
    score: Math.min(score, 5),
    feedback,
    isValid
  };
};

export const logSecurityEvent = async (
  actionType: string,
  success: boolean,
  userId?: string,
  additionalData?: Record<string, any>
) => {
  try {
    await supabase.from('rate_limit_log').insert({
      user_id: userId || null,
      action_type: actionType,
      ip_address: null,
      success,
      attempted_at: new Date().toISOString()
    });
  } catch (error) {
    // Silently fail - don't block the main operation
    console.warn('Failed to log security event:', error);
  }
};

export const checkRateLimit = async (
  actionType: string,
  userId?: string,
  timeWindow: number = 15 * 60 * 1000, // 15 minutes
  maxAttempts: number = 5
): Promise<{ allowed: boolean; remainingAttempts: number }> => {
  try {
    const since = new Date(Date.now() - timeWindow).toISOString();
    
    const { data, error } = await supabase
      .from('rate_limit_log')
      .select('id')
      .eq('action_type', actionType)
      .eq('user_id', userId || null)
      .gte('attempted_at', since);

    if (error) {
      // On error, allow the action but log it
      console.warn('Rate limit check failed:', error);
      return { allowed: true, remainingAttempts: maxAttempts };
    }

    const attemptCount = data?.length || 0;
    const remainingAttempts = Math.max(0, maxAttempts - attemptCount);

    return {
      allowed: attemptCount < maxAttempts,
      remainingAttempts
    };
  } catch (error) {
    // On error, allow the action but log it
    console.warn('Rate limit check failed:', error);
    return { allowed: true, remainingAttempts: maxAttempts };
  }
};

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};