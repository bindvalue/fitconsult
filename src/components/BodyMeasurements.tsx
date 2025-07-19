import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ruler, Calendar, Weight, TrendingUp } from 'lucide-react';

interface Measurements {
  chest?: string;
  waist?: string;
  hip?: string;
  arm?: string;
  thigh?: string;
}

interface ProgressPhoto {
  id: string;
  measurements: Measurements | null;
  weight: number | null;
  taken_at: string;
  description: string | null;
  is_baseline: boolean;
  photo_url: string;
}

interface BodyMeasurementsProps {
  photos: ProgressPhoto[];
  showTrends?: boolean;
  className?: string;
}

export const BodyMeasurements = ({ photos, showTrends = false, className = "" }: BodyMeasurementsProps) => {
  if (!photos || photos.length === 0) {
    return (
      <Card className={`bg-card/50 backdrop-blur-sm ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Medidas Corporais
          </CardTitle>
          <CardDescription>Nenhum registro de medidas encontrado</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Ordenar fotos por data (mais recente primeiro)
  const sortedPhotos = [...photos].sort((a, b) => 
    new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime()
  );

  const latestPhoto = sortedPhotos[0];
  const baselinePhoto = photos.find(p => p.is_baseline);

  const formatMeasurement = (value: string | undefined) => {
    if (!value) return '--';
    return `${value} cm`;
  };

  const formatWeight = (weight: number | null) => {
    if (!weight) return '--';
    return `${weight} kg`;
  };

  const calculateDifference = (current: string | number | null, baseline: string | number | null) => {
    if (!current || !baseline) return null;
    
    const currentNum = typeof current === 'string' ? parseFloat(current) : current;
    const baselineNum = typeof baseline === 'string' ? parseFloat(baseline) : baseline;
    
    if (isNaN(currentNum) || isNaN(baselineNum)) return null;
    
    const diff = currentNum - baselineNum;
    return {
      value: Math.abs(diff),
      type: diff > 0 ? 'increase' : diff < 0 ? 'decrease' : 'same',
      formatted: diff > 0 ? `+${diff.toFixed(1)}` : diff < 0 ? `${diff.toFixed(1)}` : '0'
    };
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Medidas Mais Recentes */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Medidas Atuais
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {new Date(latestPhoto.taken_at).toLocaleDateString('pt-BR')}
            {latestPhoto.is_baseline && (
              <Badge variant="secondary" className="ml-2">Baseline</Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Peso */}
            <div className="text-center p-3 rounded-lg bg-background/50">
              <Weight className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">Peso</div>
              <div className="font-semibold">{formatWeight(latestPhoto.weight)}</div>
            </div>

            {/* Medidas Corporais */}
            {latestPhoto.measurements && (
              <>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="text-xs text-muted-foreground">Peito</div>
                  <div className="font-semibold">{formatMeasurement(latestPhoto.measurements.chest)}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="text-xs text-muted-foreground">Cintura</div>
                  <div className="font-semibold">{formatMeasurement(latestPhoto.measurements.waist)}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="text-xs text-muted-foreground">Quadril</div>
                  <div className="font-semibold">{formatMeasurement(latestPhoto.measurements.hip)}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="text-xs text-muted-foreground">Braço</div>
                  <div className="font-semibold">{formatMeasurement(latestPhoto.measurements.arm)}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/50">
                  <div className="text-xs text-muted-foreground">Coxa</div>
                  <div className="font-semibold">{formatMeasurement(latestPhoto.measurements.thigh)}</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Evolução vs Baseline */}
      {showTrends && baselinePhoto && latestPhoto.id !== baselinePhoto.id && (
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução vs Baseline
            </CardTitle>
            <CardDescription>
              Comparação com a foto inicial ({new Date(baselinePhoto.taken_at).toLocaleDateString('pt-BR')})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Peso */}
              {(() => {
                const diff = calculateDifference(latestPhoto.weight, baselinePhoto.weight);
                return (
                  <div className="text-center p-3 rounded-lg bg-background/50">
                    <Weight className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">Peso</div>
                    <div className="font-semibold">{formatWeight(latestPhoto.weight)}</div>
                    {diff && (
                      <div className={`text-xs mt-1 ${
                        diff.type === 'increase' ? 'text-orange-600' : 
                        diff.type === 'decrease' ? 'text-green-600' : 'text-muted-foreground'
                      }`}>
                        {diff.formatted} kg
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Medidas Corporais */}
              {latestPhoto.measurements && baselinePhoto.measurements && (
                <>
                  {[
                    { key: 'chest' as keyof Measurements, label: 'Peito' },
                    { key: 'waist' as keyof Measurements, label: 'Cintura' },
                    { key: 'hip' as keyof Measurements, label: 'Quadril' },
                    { key: 'arm' as keyof Measurements, label: 'Braço' },
                    { key: 'thigh' as keyof Measurements, label: 'Coxa' }
                  ].map(({ key, label }) => {
                    const diff = calculateDifference(
                      latestPhoto.measurements?.[key], 
                      baselinePhoto.measurements?.[key]
                    );
                    return (
                      <div key={key} className="text-center p-3 rounded-lg bg-background/50">
                        <div className="text-xs text-muted-foreground">{label}</div>
                        <div className="font-semibold">
                          {formatMeasurement(latestPhoto.measurements?.[key])}
                        </div>
                        {diff && (
                          <div className={`text-xs mt-1 ${
                            diff.type === 'increase' ? 'text-orange-600' : 
                            diff.type === 'decrease' ? 'text-green-600' : 'text-muted-foreground'
                          }`}>
                            {diff.formatted} cm
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Medidas */}
      {sortedPhotos.length > 1 && (
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Medidas
            </CardTitle>
            <CardDescription>Todas as medidas registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {sortedPhotos.map((photo) => (
                <div key={photo.id} className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/10">
                  <div className="flex items-center gap-3">
                    <img 
                      src={photo.photo_url} 
                      alt="Foto de progresso" 
                      className="w-12 h-12 object-cover rounded-md"
                    />
                    <div>
                      <div className="font-medium text-sm">
                        {new Date(photo.taken_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {photo.description || 'Sem descrição'}
                      </div>
                      {photo.is_baseline && (
                        <Badge variant="secondary" className="text-xs mt-1">Baseline</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatWeight(photo.weight)}
                    </div>
                    {photo.measurements && photo.measurements.chest && (
                      <div className="text-xs text-muted-foreground">
                        Peito: {formatMeasurement(photo.measurements.chest)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};