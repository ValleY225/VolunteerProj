import { createBrowserRouter } from "react-router";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import OpportunitiesPage from "./pages/OpportunitiesPage";
import CreateShiftPage from "./pages/CreateShiftPage";
import ProfilePage from "./pages/ProfilePage";
import SchedulePage from "./pages/SchedulePage";
import SettingsPage from "./pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
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
      { index: true, Component: DashboardHome },
      { path: "opportunities", Component: OpportunitiesPage },
      { path: "create-shift", Component: CreateShiftPage },
      { path: "profile", Component: ProfilePage },
      { path: "schedule", Component: SchedulePage },
      { path: "settings", Component: SettingsPage },
    ],
  },
]);
