import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { userAuth } from '../context/AuthContext'
import { Input } from '../assets/ui/input'
import { Label } from '../assets/ui/label'
import { Button } from '../assets/ui/button'
// import { BookOpen } from 'lucide-react'
// import { Eye, EyeOff } from 'lucide-react'
import { supabase } from "../supabaseClient";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import AuthLayout from "./AuthLayout";
const Signin = () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { session, signInUser } = userAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Step 1: Authenticate with Supabase
      const result = await signInUser(email, password);

      if (!result.success) {
        setError(
          result.error || "Invalid email or password. Please try again."
        );
        return;
      }

      // Step 2: Get the authenticated user ID
      const userId = result.data?.user?.id;

      if (!userId) {
        setError("Unable to identify the signed-in user.");
        return;
      }

      // Step 3: Retrieve the user's role from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        console.error("Failed to fetch user role:", profileError);
        setError("Unable to determine your account role.");
        return;
      }

      // Step 4: Redirect based on role
      toast.success("Signed in successfully!");

      if (profile.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }

    } catch (err) {
      console.error("Sign in error:", err);
      setError("Something went wrong. Please try again later.");

    } finally {
      setLoading(false);
    }
  };


  // return (
  //   <div className="min-h-screen bg-background flex items-center justify-center px-6">

  //     <div className="w-full max-w-md">

  //       <div className="text-center mb-8">

  //         <div className="flex items-center justify-center gap-2 mb-4">
  //           <BookOpen className="w-10 h-10 text-primary" />
  //           <h1 className="text-2xl font-semibold">
  //             SMAReX
  //           </h1>
  //         </div>

  //         <h2 className="text-xl text-muted-foreground">
  //           Sign in to your account
  //         </h2>

  //       </div>

  //       <div className="bg-card border border-border rounded-lg p-8 shadow-sm">

  //         <form
  //           onSubmit={handleSignIn}
  //           className="space-y-6"
  //         >

  //           <div className="space-y-2">

  //             <Label htmlFor="email">
  //               IIUM Email
  //             </Label>

  //             <Input
  //               id="email"
  //               type="email"
  //               placeholder="username@live.iium.edu.my"
  //               value={email}
  //               onChange={(e) => setEmail(e.target.value)}
  //               required
  //             />

  //           </div>

  //           <div className="space-y-2">
  //             <Label htmlFor="password">
  //               Password
  //             </Label>

  //             <div className="relative">

  //               <Input
  //                 id="password"
  //                 type={showPassword ? 'text' : 'password'}
  //                 value={password}
  //                 onChange={(e) => setPassword(e.target.value)}
  //                 className="pr-10"
  //                 autoComplete="current-password"
  //                 required
  //               />

  //               <button
  //                 type="button"
  //                 onClick={() => setShowPassword(!showPassword)}
  //                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
  //                 aria-label={showPassword ? 'Hide password' : 'Show password'}
  //                 aria-pressed={showPassword}
  //               >
  //                 {showPassword ? (
  //                   <EyeOff className="w-5 h-5" />
  //                 ) : (
  //                   <Eye className="w-5 h-5" />
  //                 )}
  //               </button>
  //             </div>
  //           </div>

  //           {error && (
  //             <p
  //               role="alert"
  //               className="text-sm text-red-500"
  //             >
  //               {error}
  //             </p>
  //           )}
  //           <Button
  //             type="submit"
  //             className="w-full"
  //             disabled={loading}
  //           >
  //             {loading ? 'Signing in...' : 'Sign In'}
  //           </Button>

  //         </form>

  //         <p className="text-center text-sm text-muted-foreground mt-6">
  //           Don't have an account?{' '}

  //           <Link
  //             to="/signup"
  //             className="text-primary hover:underline"
  //           >
  //             Register here
  //           </Link>

  //         </p>

  //       </div>

  //     </div>

  //   </div>
  // );

  return (
    // <AuthLayout mode="signin">
    //   <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
    <AuthLayout mode="signin">
      <div className="w-full">

        {/* Heading */}
        <div className="mb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[2px] text-primary">
            ACCOUNT ACCESS
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back!
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Sign in to your SMAReX account and continue your academic journey.
          </p>
        </div>

        {/* Sign In Form */}
        <form onSubmit={handleSignIn} className="space-y-5">

          {/* Email */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="font-semibold text-slate-700"
            >
              IIUM Email
            </Label>

            <Input
              id="email"
              type="email"
              placeholder="username@live.iium.edu.my"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="h-12 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-ring"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="font-semibold text-slate-700"
            >
              Password
            </Label>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="h-12 rounded-xl border-slate-200 bg-white pr-12 text-slate-900 placeholder:text-slate-400 focus-visible:ring-ring"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Authentication Error */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {/* Sign In Button */}
          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full gap-2 rounded-xl bg-primary font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 focus-visible:ring-ring disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Registration Link */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
          >
            Create an account
          </Link>
        </p>

        {/* Community Notice */}
        <div className="mt-7 flex items-center justify-center gap-2 border-t border-slate-200 pt-5">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />

          <p className="text-xs text-slate-500">
            Exclusive to the IIUM student community
          </p>
        </div>

      </div>
    </AuthLayout>
  );

}

export default Signin