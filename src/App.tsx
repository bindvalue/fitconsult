import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import ProfessorProfile from "./pages/ProfessorProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfessorRegister from "./pages/ProfessorRegister";
import Plans from "./pages/Plans";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import CreateStudent from "./pages/CreateStudent";
import Students from "./pages/Students";
import ScheduleConsultation from "./pages/ScheduleConsultation";
import CreateWorkoutPlan from "./pages/CreateWorkoutPlan";
import ExerciseLibrary from "./pages/ExerciseLibrary";
import ChallengesRewards from "./pages/ChallengesRewards";
import StudentChallenges from "./pages/StudentChallenges";
import WorkoutPlanView from "./pages/WorkoutPlanView";
import EditWorkoutPlan from "./pages/EditWorkoutPlan";
import StudentWorkoutSessions from "./pages/StudentWorkoutSessions";
import Messages from "./pages/Messages";
import EmailConfirmation from "./pages/EmailConfirmation";
import Appointments from "./pages/Appointments";
import StudentProgressPhotos from "./pages/StudentProgressPhotos";
import Settings from "./pages/Settings";
import PendingApprovals from "./pages/PendingApprovals";
import AccountStatus from "./pages/AccountStatus";
import AdminProfessors from "./pages/AdminProfessors";
import SystemDiagnostics from "./pages/SystemDiagnostics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/professor-register" element={<ProfessorRegister />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/dashboard" element={
            <ProtectedRoute userType="professor">
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/student-dashboard" element={
            <ProtectedRoute userType="student">
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student-profile" element={
            <ProtectedRoute userType="student">
              <StudentProfile />
            </ProtectedRoute>
          } />
          <Route path="/student-profile/:id" element={
            <ProtectedRoute userType="professor">
              <StudentProfile />
            </ProtectedRoute>
          } />
          <Route path="/professor-profile" element={
            <ProtectedRoute userType="professor">
              <ProfessorProfile />
            </ProtectedRoute>
          } />
          <Route path="/create-student" element={
            <ProtectedRoute userType="professor">
              <CreateStudent />
            </ProtectedRoute>
          } />
          <Route path="/students" element={
            <ProtectedRoute userType="professor">
              <Students />
            </ProtectedRoute>
          } />
          <Route path="/pending-approvals" element={
            <ProtectedRoute userType="professor">
              <PendingApprovals />
            </ProtectedRoute>
          } />
          <Route path="/admin-professors" element={
            <ProtectedRoute userType="admin">
              <AdminProfessors />
            </ProtectedRoute>
          } />
          <Route path="/system-diagnostics" element={
            <ProtectedRoute userType="admin">
              <SystemDiagnostics />
            </ProtectedRoute>
          } />
          <Route path="/schedule-consultation" element={
            <ProtectedRoute userType="professor">
              <ScheduleConsultation />
            </ProtectedRoute>
          } />
          <Route path="/create-workout-plan" element={
            <ProtectedRoute userType="professor">
              <CreateWorkoutPlan />
            </ProtectedRoute>
          } />
          <Route path="/exercise-library" element={
            <ProtectedRoute userType="professor">
              <ExerciseLibrary />
            </ProtectedRoute>
          } />
          <Route path="/student-exercise-library" element={
            <ProtectedRoute userType="student">
              <ExerciseLibrary />
            </ProtectedRoute>
          } />
          <Route path="/challenges-rewards" element={
            <ProtectedRoute userType="professor">
              <ChallengesRewards />
            </ProtectedRoute>
          } />
          <Route path="/student-challenges/:studentId" element={
            <ProtectedRoute userType="professor">
              <StudentChallenges />
            </ProtectedRoute>
          } />
          <Route path="/student-challenges" element={
            <ProtectedRoute userType="student">
              <StudentChallenges />
            </ProtectedRoute>
          } />
          <Route path="/workout-plan/:planId" element={
            <ProtectedRoute userType="professor">
              <WorkoutPlanView />
            </ProtectedRoute>
          } />
          <Route path="/student-workout-plan/:planId" element={
            <ProtectedRoute userType="student">
              <WorkoutPlanView />
            </ProtectedRoute>
          } />
          <Route path="/edit-workout-plan/:planId" element={
            <ProtectedRoute userType="professor">
              <EditWorkoutPlan />
            </ProtectedRoute>
          } />
          <Route path="/student-workout-sessions" element={
            <ProtectedRoute userType="professor">
              <StudentWorkoutSessions />
            </ProtectedRoute>
          } />
          <Route path="/my-workout-sessions" element={
            <ProtectedRoute userType="student">
              <StudentWorkoutSessions />
            </ProtectedRoute>
          } />
          <Route path="/student-progress-photos" element={
            <ProtectedRoute userType="student">
              <StudentProgressPhotos />
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute userType="professor">
              <Messages />
            </ProtectedRoute>
          } />
          <Route path="/student-messages" element={
            <ProtectedRoute userType="student">
              <Messages />
            </ProtectedRoute>
          } />
          <Route path="/appointments" element={
            <ProtectedRoute userType="professor">
              <Appointments />
            </ProtectedRoute>
          } />
          <Route path="/student-appointments" element={
            <ProtectedRoute userType="student">
              <Appointments />
            </ProtectedRoute>
          } />
          <Route path="/student-progress-photos/:studentId" element={
            <ProtectedRoute userType="professor">
              <StudentProgressPhotos />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute userType="professor">
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/student-settings" element={
            <ProtectedRoute userType="student">
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/email-confirmation" element={<EmailConfirmation />} />
          <Route path="/account-status" element={<AccountStatus />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
