import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useUserAvatar = () => {
  const { user, updateUserAvatar } = useAuth();

  const uploadAvatar = async (file: File): Promise<{ success: boolean; error?: string; url?: string }> => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      // Validar tamanho do arquivo
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: 'Arquivo muito grande. Máximo 5MB' };
      }

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Apenas imagens são permitidas' };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          cacheControl: '3600',
          upsert: true 
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualizar no banco de dados
      const { error: updateError } = await supabase
        .from(user.type === 'professor' ? 'professor_profiles' : 'student_profiles')
        .update({ avatar_url: publicUrl } as any)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Atualizar o avatar globalmente
      updateUserAvatar(publicUrl);

      return { success: true, url: publicUrl };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao fazer upload' };
    }
  };

  const removeAvatar = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      // Remover do banco de dados
      const { error: updateError } = await supabase
        .from(user.type === 'professor' ? 'professor_profiles' : 'student_profiles')
        .update({ avatar_url: null } as any)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Atualizar o avatar globalmente
      updateUserAvatar('');

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao remover avatar' };
    }
  };

  return {
    user,
    avatarUrl: user?.avatar_url,
    uploadAvatar,
    removeAvatar
  };
};