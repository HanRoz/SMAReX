import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import Profile from "./pages/Profile";

export const router = createBrowserRouter([
{path: "/", element: <App />},
{path: "/signup", element: <Signup />},
{path: "/signin", element: <Signin />},
{path: "/dashboard", element: <PrivateRoute><Dashboard />{" "}</PrivateRoute> },
{path: "/profile", element: <PrivateRoute><Profile />{" "}</PrivateRoute> },
]);
