import { createBrowserRouter, Navigate } from "react-router";
import VerifyPage from './pages/VerifyPage';
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHomeWrapper from "./pages/DashboardHomeWrapper";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

// Volunteer pages
import OpportunitiesPage from "./pages/volunteer/OpportunitiesPage";
import SchedulePage from "./pages/volunteer/SchedulePage";
import VolunteerGroupsPage from "./pages/volunteer/VoluGroupsPage";

// Coordinator pages
import CreateEventPage from "./pages/coordinator/CreateEventPage";
import CoordinatorEventsPage from "./pages/coordinator/EventsPage";
import ManageGroupsPage from "./pages/coordinator/ManageGroupsPage";
import CoordinatorParticipantsPage from "./pages/coordinator/ParticipantsPage";


export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },

  {
  path: '/verify',
  Component: VerifyPage,
  },

  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { index: true, Component: DashboardHomeWrapper },
      { path: "profile", Component: ProfilePage },
      { path: "settings", Component: SettingsPage },
      { path: "opportunities", Component: OpportunitiesPage },
      { path: "schedule", Component: SchedulePage },
      { path: "create-event", Component: CreateEventPage },
      { path: "events", Component: CoordinatorEventsPage },
      { path: "manage-groups", Component: ManageGroupsPage },        // ← для координатора
      { path: "groups", Component: VolunteerGroupsPage },           // ← для волонтера
      { path: "participants", Component: CoordinatorParticipantsPage },
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
  
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);