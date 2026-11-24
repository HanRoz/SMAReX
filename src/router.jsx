import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import Profile from "./pages/Profile";
import Library from "./pages/Library";
import Saved from "./pages/Saved";
import Upload from "./pages/Upload";
import Settings from "./pages/Settings";
import ResourceDetails from "./pages/ResourceDetails";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminReports from "./pages/admin/AdminReports";
import AdminRejectedUploads from "./pages/admin/AdminRejectedUploads";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminRoute from "./components/AdminRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />
  },

  {
    path: "/signup",
    element: <Signup />
  },

  {
    path: "/signin",
    element: <Signin />
  },

  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    )
  },
  {
    path: "/resource/:id",
    element: (
      <PrivateRoute>
        <ResourceDetails />
      </PrivateRoute>
    )
  },

  {
    path: "/profile",
    element: (
      <PrivateRoute>
        <Profile />
      </PrivateRoute>
    )
  },

  {
    path: "/library",
    element: (
      <PrivateRoute>
        <Library />
      </PrivateRoute>
    )
  },

  {
    path: "/saved",
    element: (
      <PrivateRoute>
        <Saved />
      </PrivateRoute>
    )
  },

  {
    path: "/upload",
    element: (
      <PrivateRoute>
        <Upload />
      </PrivateRoute>
    )
  },

  {
    path: "/settings",
    element: (
      <PrivateRoute>
        <Settings />
      </PrivateRoute>
    )
  },

  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout>
          <AdminOverview />
        </AdminLayout>
      </AdminRoute>
    ),
  },

  {
    path: "/admin/reports",
    element: (
      <AdminRoute>
        <AdminLayout>
          <AdminReports />
        </AdminLayout>
      </AdminRoute>
    ),
  },

  {
    path: "/admin/rejected-uploads",
    element: (
      <AdminRoute>
        <AdminLayout>
          <AdminRejectedUploads />
        </AdminLayout>
      </AdminRoute>
    ),
  },

]);
