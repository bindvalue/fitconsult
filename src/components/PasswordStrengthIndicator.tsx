import { getPasswordStrength } from '@/lib/security';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  className
}) => {
  const strength = getPasswordStrength(password);

  const getStrengthColor = (score: number) => {
    if (score < 2) return 'bg-red-500';
    if (score < 3) return 'bg-yellow-500';
    if (score < 4) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStrengthText = (score: number) => {
    if (score < 2) return 'Muito fraca';
    if (score < 3) return 'Fraca';
    if (score < 4) return 'Moderada';
    return 'Forte';
  };

  if (!password) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Força da senha:</span>
        <span className={`text-sm font-semibold ${
          strength.isValid ? 'text-green-600' : 'text-red-600'
        }`}>
          {getStrengthText(strength.score)}
        </span>
      </div>
      
      <Progress 
        value={(strength.score / 5) * 100} 
        className="h-2"
        style={{
          background: `linear-gradient(to right, ${getStrengthColor(strength.score)} 0%, ${getStrengthColor(strength.score)} ${(strength.score / 5) * 100}%, #e5e7eb ${(strength.score / 5) * 100}%)`
        }}
      />
      
      {strength.feedback.length > 0 && (
        <Alert variant={strength.isValid ? "default" : "destructive"}>
          <AlertDescription>
            <div className="space-y-1">
              {strength.feedback.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {password && (
                    strength.isValid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )
                  )}
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {strength.isValid && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Senha segura!</span>
        </div>
      )}
    </div>
  );
};