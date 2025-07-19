import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BodyMeasurements } from './BodyMeasurements';
import { Camera, Upload, Calendar, MessageSquare, Weight, Ruler, Star, Trash2, Eye, Plus } from 'lucide-react';

interface ProgressPhoto {
  id: string;
  photo_url: string;
  description: string;
  professor_comment: string;
  weight: number;
  measurements: any;
  is_baseline: boolean;
  taken_at: string;
  student_id: string;
}

interface ProgressPhotosProps {
  studentId?: string;
  isStudentView?: boolean;
}

const ProgressPhotos = ({ studentId, isStudentView = true }: ProgressPhotosProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [professorComment, setProfessorComment] = useState('');
  
  const [uploadData, setUploadData] = useState({
    description: '',
    weight: '',
    measurements: {
      chest: '',
      waist: '',
      hip: '',
      arm: '',
      thigh: ''
    },
    isBaseline: false
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (isStudentView && user?.id) {
      // Para vista do estudante, buscar o student_id usando o user_id
      const fetchStudentId = async () => {
        try {
          const { data, error } = await supabase
            .from('student_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();
          
          if (error) throw error;
          setCurrentStudentId(data.id);
        } catch (error) {
          console.error('Erro ao buscar ID do estudante:', error);
        }
      };
      fetchStudentId();
    } else if (studentId) {
      setCurrentStudentId(studentId);
    }
  }, [studentId, isStudentView, user?.id]);

  useEffect(() => {
    if (currentStudentId) {
      fetchProgressPhotos();
    }
  }, [currentStudentId]);

  const fetchProgressPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('*')
        .eq('student_id', currentStudentId)
        .order('taken_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar fotos:', error);
      toast({
        title: 'Erro ao carregar fotos',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const compressImage = (file: File, maxWidth = 800, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          }
        }, file.type, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);
    
    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPhoto = async () => {
    if (!selectedFile || !currentStudentId) {
      if (!currentStudentId) {
        toast({
          title: 'Erro',
          description: 'ID do estudante não encontrado. Tente recarregar a página.',
          variant: 'destructive'
        });
      }
      return;
    }

    setUploading(true);
    
    try {
      // Comprimir a imagem antes do upload
      const compressedFile = await compressImage(selectedFile);
      
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${currentStudentId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadResult, error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('progress_photos')
        .insert({
          student_id: currentStudentId,
          photo_url: publicUrl,
          description: uploadData.description,
          weight: uploadData.weight ? parseFloat(uploadData.weight) : null,
          measurements: uploadData.measurements,
          is_baseline: uploadData.isBaseline
        });

      if (insertError) throw insertError;

      toast({
        title: 'Foto enviada com sucesso!',
        description: 'Sua foto de progresso foi salva.'
      });

      // Limpar dados do formulário
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setFilePreview(null);
      setUploadData({
        description: '',
        weight: '',
        measurements: { chest: '', waist: '', hip: '', arm: '', thigh: '' },
        isBaseline: false
      });
      fetchProgressPhotos();
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar foto',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedPhoto || !professorComment.trim()) return;

    try {
      const { error } = await supabase
        .from('progress_photos')
        .update({ professor_comment: professorComment })
        .eq('id', selectedPhoto.id);

      if (error) throw error;

      toast({
        title: 'Comentário adicionado!',
        description: 'Seu comentário foi salvo com sucesso.'
      });

      setCommentDialogOpen(false);
      setProfessorComment('');
      fetchProgressPhotos();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar comentário',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const deletePhoto = async (photoId: string, photoUrl: string) => {
    try {
      // Extrair o caminho do arquivo da URL
      const fileName = photoUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('progress-photos')
          .remove([`${currentStudentId}/${fileName}`]);
      }

      const { error } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: 'Foto removida',
        description: 'A foto foi removida com sucesso.'
      });

      fetchProgressPhotos();
    } catch (error: any) {
      toast({
        title: 'Erro ao remover foto',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando fotos...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="photos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-sm">
          <TabsTrigger value="photos">Fotos de Progresso</TabsTrigger>
          <TabsTrigger value="measurements">Medidas Corporais</TabsTrigger>
        </TabsList>

        <TabsContent value="photos">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Fotos de Progresso
              </CardTitle>
              <CardDescription>
                Registre seu progresso com fotos e medidas corporais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Suas Fotos</h3>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe sua evolução através de fotos
                  </p>
                </div>
        
        {isStudentView && (
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Foto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Foto de Progresso</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="photo">Foto</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelection}
                    disabled={uploading}
                  />
                </div>

                {filePreview && (
                  <div>
                    <Label>Preview da Imagem</Label>
                    <div className="mt-2">
                      <img 
                        src={filePreview} 
                        alt="Preview" 
                        className="w-full max-h-48 object-cover rounded-lg border"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Como você está se sentindo? Qual foi o treino de hoje?"
                    value={uploadData.description}
                    onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="70.5"
                      value={uploadData.weight}
                      onChange={(e) => setUploadData(prev => ({ ...prev, weight: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Medidas (cm)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Peito"
                      value={uploadData.measurements.chest}
                      onChange={(e) => setUploadData(prev => ({
                        ...prev,
                        measurements: { ...prev.measurements, chest: e.target.value }
                      }))}
                    />
                    <Input
                      placeholder="Cintura"
                      value={uploadData.measurements.waist}
                      onChange={(e) => setUploadData(prev => ({
                        ...prev,
                        measurements: { ...prev.measurements, waist: e.target.value }
                      }))}
                    />
                    <Input
                      placeholder="Quadril"
                      value={uploadData.measurements.hip}
                      onChange={(e) => setUploadData(prev => ({
                        ...prev,
                        measurements: { ...prev.measurements, hip: e.target.value }
                      }))}
                    />
                    <Input
                      placeholder="Braço"
                      value={uploadData.measurements.arm}
                      onChange={(e) => setUploadData(prev => ({
                        ...prev,
                        measurements: { ...prev.measurements, arm: e.target.value }
                      }))}
                    />
                    <Input
                      placeholder="Coxa"
                      value={uploadData.measurements.thigh}
                      onChange={(e) => setUploadData(prev => ({
                        ...prev,
                        measurements: { ...prev.measurements, thigh: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="baseline"
                    checked={uploadData.isBaseline}
                    onCheckedChange={(checked) => 
                      setUploadData(prev => ({ ...prev, isBaseline: checked as boolean }))
                    }
                  />
                  <Label htmlFor="baseline">Esta é uma foto inicial (baseline)</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleSubmitPhoto} 
                    disabled={!selectedFile || uploading}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Enviar Foto
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setUploadDialogOpen(false);
                      setSelectedFile(null);
                      setFilePreview(null);
                      setUploadData({
                        description: '',
                        weight: '',
                        measurements: { chest: '', waist: '', hip: '', arm: '', thigh: '' },
                        isBaseline: false
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {photos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {isStudentView 
                ? "Nenhuma foto de progresso ainda. Adicione sua primeira foto!" 
                : "Este aluno ainda não possui fotos de progresso."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={photo.photo_url}
                  alt="Foto de progresso"
                  className="w-full h-48 object-cover"
                />
                {photo.is_baseline && (
                  <Badge className="absolute top-2 left-2" variant="secondary">
                    <Star className="h-3 w-3 mr-1" />
                    Inicial
                  </Badge>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedPhoto(photo);
                      setViewDialogOpen(true);
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  {isStudentView && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePhoto(photo.id, photo.photo_url)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(photo.taken_at).toLocaleDateString('pt-BR')}
                  </div>
                  
                  {photo.weight && (
                    <div className="flex items-center gap-2 text-sm">
                      <Weight className="h-3 w-3" />
                      {photo.weight} kg
                    </div>
                  )}
                  
                  {photo.description && (
                    <p className="text-sm line-clamp-2">{photo.description}</p>
                  )}
                  
                  {photo.professor_comment && (
                    <div className="bg-muted p-2 rounded text-sm">
                      <div className="flex items-center gap-1 mb-1">
                        <MessageSquare className="h-3 w-3" />
                        <span className="font-medium">Professor:</span>
                      </div>
                      <p className="line-clamp-2">{photo.professor_comment}</p>
                    </div>
                  )}
                  
                  {!isStudentView && !photo.professor_comment && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedPhoto(photo);
                        setCommentDialogOpen(true);
                      }}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Adicionar Comentário
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
           ))}
         </div>
       )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="measurements">
          <BodyMeasurements photos={photos} showTrends={true} />
        </TabsContent>
      </Tabs>

       {/* Dialog para visualizar foto em detalhes */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Foto de Progresso</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <img
                src={selectedPhoto.photo_url}
                alt="Foto de progresso"
                className="w-full max-h-96 object-contain rounded-lg"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Data:</Label>
                  <p className="text-sm">{new Date(selectedPhoto.taken_at).toLocaleDateString('pt-BR')}</p>
                </div>
                
                {selectedPhoto.weight && (
                  <div>
                    <Label className="text-sm font-medium">Peso:</Label>
                    <p className="text-sm">{selectedPhoto.weight} kg</p>
                  </div>
                )}
              </div>
              
              {selectedPhoto.measurements && Object.values(selectedPhoto.measurements).some(v => v) && (
                <div>
                  <Label className="text-sm font-medium">Medidas (cm):</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                    {selectedPhoto.measurements.chest && <p>Peito: {selectedPhoto.measurements.chest}</p>}
                    {selectedPhoto.measurements.waist && <p>Cintura: {selectedPhoto.measurements.waist}</p>}
                    {selectedPhoto.measurements.hip && <p>Quadril: {selectedPhoto.measurements.hip}</p>}
                    {selectedPhoto.measurements.arm && <p>Braço: {selectedPhoto.measurements.arm}</p>}
                    {selectedPhoto.measurements.thigh && <p>Coxa: {selectedPhoto.measurements.thigh}</p>}
                  </div>
                </div>
              )}
              
              {selectedPhoto.description && (
                <div>
                  <Label className="text-sm font-medium">Descrição:</Label>
                  <p className="text-sm mt-1">{selectedPhoto.description}</p>
                </div>
              )}
              
              {selectedPhoto.professor_comment && (
                <div className="bg-muted p-3 rounded">
                  <Label className="text-sm font-medium">Comentário do Professor:</Label>
                  <p className="text-sm mt-1">{selectedPhoto.professor_comment}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar comentário do professor */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Comentário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Escreva seu comentário sobre o progresso do aluno..."
              value={professorComment}
              onChange={(e) => setProfessorComment(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={handleAddComment} disabled={!professorComment.trim()}>
                Salvar Comentário
              </Button>
              <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProgressPhotos;