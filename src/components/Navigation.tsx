import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import strikingLogo from "@/assets/Logo-Striking-Borda.png";

interface NavigationProps {
  userType: 'professor' | 'student' | 'admin';
  userName: string;
  userEmail: string;
}

const Navigation = ({ userType, userName, userEmail }: NavigationProps) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="bg-card/50 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img src={strikingLogo} alt="Striking Consult" className="h-8 w-auto" />
              <h1 className="text-xl font-bold text-foreground">
                Striking Consult
              </h1>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground capitalize">
                {userType === 'professor' ? 'Professor' : userType === 'admin' ? 'Administrador' : 'Aluno'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(
                userType === 'professor' ? '/dashboard' : 
                userType === 'admin' ? '/admin-professors' : 
                '/student-dashboard'
              )}
              className="hidden md:flex"
            >
              <Home className="h-4 w-4 mr-2" />
              Início
            </Button>

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar_url} alt={userName} />
                    <AvatarFallback>
                      {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
                <DropdownMenuSeparator />
                {userType !== 'admin' && (
                  <DropdownMenuItem onClick={() => navigate(userType === 'professor' ? '/professor-profile' : '/student-profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                )}
                {userType !== 'admin' && (
                  <DropdownMenuItem onClick={() => {
                    const settingsRoute = userType === 'professor' ? '/settings' : '/student-settings';
                    navigate(settingsRoute);
                  }}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;