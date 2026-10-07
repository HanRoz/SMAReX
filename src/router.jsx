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

export const router = createBrowserRouter([
{path: "/", element: <App />},
{path: "/signup", element: <Signup />},
{path: "/signin", element: <Signin />},
{path: "/dashboard", element: <PrivateRoute><Dashboard />{" "}</PrivateRoute> },
{path: "/profile", element: <PrivateRoute><Profile />{" "}</PrivateRoute> },
{path: "/library", element: <PrivateRoute><Library />{" "}</PrivateRoute> },
{path: "/saved", element: <PrivateRoute><Saved />{" "}</PrivateRoute> },
{path: "/upload", element: <PrivateRoute><Upload />{" "}</PrivateRoute> },
{path: "/settings", element: <PrivateRoute><Settings />{" "}</PrivateRoute> },
]);
