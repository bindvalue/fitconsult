import { useIsMobile } from '@/hooks/use-mobile';

export const Footer = () => {
  const isMobile = useIsMobile();
  
  // Não exibir footer em mobile
  if (isMobile) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/50 backdrop-blur-sm py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-bold text-primary">Striking Consult</span>
            <span className="text-sm text-muted-foreground">© {currentYear}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Desenvolvido por{" "}
            <a 
              href="https://www.bindvalue.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium transition-colors"
            >
              BindValue.dev
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};