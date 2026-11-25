import React, { useState } from "react";
import { Link } from "react-router-dom";
import { userAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "../assets/ui/input";
import { Label } from "../assets/ui/label";
import { Button } from "../assets/ui/button";
// import { BookOpen } from "lucide-react";
// import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../assets/ui/select";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import AuthLayout from "./AuthLayout";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [kulliyyah, setKulliyyah] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");

  const { session, signUpNewUser } = userAuth();
  const navigate = useNavigate();
  // console.log(session);  this to test if the user is logged in or not, if logged in, session will have data, else null

  const handleSignUp = async (e) => {
    e.preventDefault();

    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!email.toLowerCase().endsWith("@live.iium.edu.my")) {
      setError("Please use your IIUM email");
      return;
    }

    setLoading(true);

    try {
      const result = await signUpNewUser({
        email,
        password,
        fullName,
        displayName,
        matricNumber,
        kulliyyah,
      });

      if (result.success) {
        if (result.confirmationRequired) {
          toast.success(
            "Account created! Please check your IIUM email and verify your account before signing in.",
          );

          navigate("/signin", {
            state: {
              emailConfirmationRequired: true,
              email: email,
            },
          });
        } else {
          toast.success("Account created successfully!");
          navigate("/signin");
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error(error);
      setError("An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  // return (
  //   <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
  //     <div className="w-full max-w-md">
  //       {/* Logo and heading */}
  //       <div className="text-center mb-8">
  //         <div className="flex items-center justify-center gap-2 mb-4">
  //           <BookOpen className="w-10 h-10 text-primary" />

  //           <h1 className="text-2xl font-semibold">SMAReX</h1>
  //         </div>

  //         <h2 className="text-xl text-muted-foreground">Create your account</h2>
  //       </div>

  //       {/* Registration card */}
  //       <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
  //         <form onSubmit={handleSignUp} className="space-y-4">
  //           {/* Full Name */}
  //           <div className="space-y-2">
  //             <Label htmlFor="fullName">Full Name</Label>

  //             <Input
  //               id="fullName"
  //               type="text"
  //               placeholder="Enter your full name"
  //               value={fullName}
  //               onChange={(e) => setFullName(e.target.value)}
  //               required
  //             />
  //           </div>

  //           {/* Display Name */}
  //           <div className="space-y-2">
  //             <Label htmlFor="displayName">Display Name</Label>

  //             <Input
  //               id="displayName"
  //               type="text"
  //               placeholder="Enter your display name"
  //               value={displayName}
  //               onChange={(e) => setDisplayName(e.target.value)}
  //               required
  //             />
  //           </div>

  //           {/* Matric Number */}
  //           <div className="space-y-2">
  //             <Label htmlFor="matricNumber">Matric Number</Label>

  //             <Input
  //               id="matricNumber"
  //               type="text"
  //               placeholder="Enter your matric number"
  //               value={matricNumber}
  //               onChange={(e) => setMatricNumber(e.target.value)}
  //               required
  //             />
  //           </div>

  //           {/* Kulliyyah */}
  //           <div className="space-y-2">
  //             <Label>Kulliyyah</Label>

  //             <Select
  //               value={kulliyyah}
  //               onValueChange={(value) => setKulliyyah(value)}
  //             >
  //               <SelectTrigger>
  //                 <SelectValue placeholder="Select your Kulliyyah" />
  //               </SelectTrigger>

  //               <SelectContent>
  //                 <SelectItem value="AIKOL">AIKOL</SelectItem>

  //                 <SelectItem value="KENMS">KENMS</SelectItem>

  //                 <SelectItem value="KOED">KOED</SelectItem>

  //                 <SelectItem value="KICT">KICT</SelectItem>

  //                 <SelectItem value="KIRKHS">KIRKHS</SelectItem>

  //                 <SelectItem value="KOM">KOM</SelectItem>

  //                 <SelectItem value="KOD">KOD</SelectItem>

  //                 <SelectItem value="ISTAC">ISTAC</SelectItem>

  //                 <SelectItem value="KOP">KOP</SelectItem>

  //                 <SelectItem value="KON">KON</SelectItem>

  //                 <SelectItem value="KAHS">KAHS</SelectItem>

  //                 <SelectItem value="KOS">KOS</SelectItem>

  //                 <SelectItem value="KOE">KOE</SelectItem>

  //                 <SelectItem value="IIiBF">IIiBF</SelectItem>

  //                 <SelectItem value="INHART">INHART</SelectItem>
  //               </SelectContent>
  //             </Select>
  //           </div>

  //           {/* Email */}
  //           <div className="space-y-2">
  //             <Label htmlFor="email">IIUM Email</Label>

  //             <Input
  //               id="email"
  //               type="email"
  //               placeholder="username@live.iium.edu.my"
  //               value={email}
  //               onChange={(e) => setEmail(e.target.value)}
  //               required
  //             />

  //             <p className="text-xs text-muted-foreground">
  //               Must end with @live.iium.edu.my
  //             </p>
  //           </div>

  //           {/* Password */}
  //           <div className="space-y-2">
  //             <Label htmlFor="password">Password</Label>

  //             <div className="relative">
  //               <Input
  //                 id="password"
  //                 type={showPassword ? "text" : "password"}
  //                 placeholder="Enter your password"
  //                 value={password}
  //                 onChange={(e) => setPassword(e.target.value)}
  //                 className="pr-10"
  //                 autoComplete="new-password"
  //                 required
  //               />

  //               <button
  //                 type="button"
  //                 onClick={() => setShowPassword(!showPassword)}
  //                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
  //                 aria-label={showPassword ? "Hide password" : "Show password"}
  //                 aria-pressed={showPassword}
  //               >
  //                 {showPassword ? (
  //                   <EyeOff className="w-5 h-5" />
  //                 ) : (
  //                   <Eye className="w-5 h-5" />
  //                 )}
  //               </button>
  //             </div>

  //             {password.length > 0 && password.length < 8 && (
  //               <p className="text-xs text-red-500">
  //                 Password must be at least 8 characters
  //               </p>
  //             )}
  //           </div>

  //           {/* Confirm Password */}
  //           <div className="space-y-2">
  //             <Label htmlFor="confirmPassword">Confirm Password</Label>

  //             <div className="relative">
  //               <Input
  //                 id="confirmPassword"
  //                 type={showPassword ? "text" : "password"}
  //                 placeholder="Confirm your password"
  //                 value={confirmPassword}
  //                 onChange={(e) => setConfirmPassword(e.target.value)}
  //                 className="pr-10"
  //                 autoComplete="new-password"
  //                 required
  //               />

  //               <button
  //                 type="button"
  //                 onClick={() => setShowPassword(!showPassword)}
  //                 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
  //                 aria-label={
  //                   showPassword ? "Hide password" : "Show password"
  //                 }
  //                 aria-pressed={showPassword}
  //               >
  //                 {showPassword ? (
  //                   <EyeOff className="w-5 h-5" />
  //                 ) : (
  //                   <Eye className="w-5 h-5" />
  //                 )}
  //               </button>
  //             </div>

  //             {confirmPassword.length > 0 && password !== confirmPassword && (
  //               <p className="text-xs text-red-500">Passwords do not match</p>
  //             )}
  //           </div>

  //           {/* Supabase error */}
  //           {error && <p className="text-sm text-red-500">{error}</p>}

  //           {/* Register */}
  //           <Button type="submit" className="w-full" disabled={loading}>
  //             {loading ? "Creating account..." : "Register"}
  //           </Button>
  //         </form>

  //         <p className="text-center text-sm text-muted-foreground mt-6">
  //           Already have an account?{" "}
  //           <Link to="/signin" className="text-primary hover:underline">
  //             Sign in here
  //           </Link>
  //         </p>
  //       </div>
  //     </div>
  //   </div>
  // );

  return (
    <AuthLayout mode="signup">
      <div className="w-full">

        {/* Heading */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-[2px] text-primary">
            GET STARTED
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Create your account
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Join the SMAReX community and start your collaborative learning journey.
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSignUp} className="space-y-4">

          {/* Full Name */}
          <div className="space-y-2">
            <Label
              htmlFor="fullName"
              className="font-semibold text-slate-700"
            >
              Full Name
            </Label>

            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className="h-11 rounded-xl border-border bg-white focus-visible:ring-ring"
              required
            />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label
              htmlFor="displayName"
              className="font-semibold text-slate-700"
            >
              Display Name
            </Label>

            <Input
              id="displayName"
              type="text"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="nickname"
              className="h-11 rounded-xl border-border bg-white focus-visible:ring-ring"
              required
            />
          </div>

          {/* Matric Number and Kulliyyah */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            {/* Matric Number */}
            <div className="space-y-2">
              <Label
                htmlFor="matricNumber"
                className="font-semibold text-slate-700"
              >
                Matric Number
              </Label>

              <Input
                id="matricNumber"
                type="text"
                placeholder="Matric number"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
                className="h-11 rounded-xl border-border bg-white focus-visible:ring-ring"
                required
              />
            </div>

            {/* Kulliyyah */}
            <div className="space-y-2">
              <Label
                htmlFor="kulliyyah"
                className="font-semibold text-slate-700"
              >
                Kulliyyah
              </Label>

              <Select
                value={kulliyyah}
                onValueChange={setKulliyyah}
                required
              >
                <SelectTrigger
                  id="kulliyyah"
                  className="h-11 rounded-xl border-border bg-white focus:ring-ring"
                >
                  <SelectValue placeholder="Select Kulliyyah" />
                </SelectTrigger>

                <SelectContent>
                  {[
                    "AIKOL",
                    "KENMS",
                    "KOED",
                    "KICT",
                    "KIRKHS",
                    "KOM",
                    "KOD",
                    "ISTAC",
                    "KOP",
                    "KON",
                    "KAHS",
                    "KOS",
                    "KOE",
                    "IIiBF",
                    "INHART",
                  ].map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* IIUM Email */}
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
              className="h-11 rounded-xl border-border bg-white focus-visible:ring-ring"
              required
            />

            <p className="text-xs text-slate-500">
              Must end with @live.iium.edu.my
            </p>
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
                autoComplete="new-password"
                className="h-11 rounded-xl border-border bg-white pr-12 focus-visible:ring-ring"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary"
                aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <p
              className={`text-xs ${password.length > 0 && password.length < 8
                  ? "text-red-500"
                  : "text-slate-500"
                }`}
            >
              Password must be at least 8 characters.
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="font-semibold text-slate-700"
            >
              Confirm Password
            </Label>

            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="h-11 rounded-xl border-border bg-white pr-12 focus-visible:ring-ring"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary"
                aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {confirmPassword.length > 0 &&
              password !== confirmPassword && (
                <p className="text-xs text-red-500">
                  Passwords do not match.
                </p>
              )}
          </div>

          {/* Registration Error */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {/* Create Account Button */}
          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full gap-2 rounded-xl bg-primary font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 focus-visible:ring-ring disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Sign In Link */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/signin"
            className="font-semibold text-primary hover:underline"
          >
            Sign in here
          </Link>
        </p>

        {/* Email Verification Notice */}
        <div className="mt-6 flex items-start justify-center gap-2 border-t border-border pt-5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

          <p className="text-xs leading-5 text-slate-500">
            Registration requires a verified IIUM student email address.
          </p>
        </div>

      </div>
    </AuthLayout>
  );

};

export default Signup;
