import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { userAuth } from '../context/AuthContext'
import { Input } from '../assets/ui/input'
import { Label } from '../assets/ui/label'
import { Button } from '../assets/ui/button'
import { BookOpen } from 'lucide-react'
import { Eye, EyeOff } from 'lucide-react'

const Signin = () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { session, signInUser } = userAuth();
  const navigate = useNavigate();
  // console.log(session);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signInUser(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError("Invalid email or password. Please try again.");
      }


    } catch (error) {
      setError("Something went wrong. Please try again later.");
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">

      <div className="w-full max-w-md">

        <div className="text-center mb-8">

          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-10 h-10 text-primary" />
            <h1 className="text-2xl font-semibold">
              SMAReX
            </h1>
          </div>

          <h2 className="text-xl text-muted-foreground">
            Sign in to your account
          </h2>

        </div>

        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">

          <form
            onSubmit={handleSignIn}
            className="space-y-6"
          >

            <div className="space-y-2">

              <Label htmlFor="email">
                IIUM Email
              </Label>

              <Input
                id="email"
                type="email"
                placeholder="username@live.iium.edu.my"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password
              </Label>

              <div className="relative">

                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="text-sm text-red-500"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}

            <Link
              to="/signup"
              className="text-primary hover:underline"
            >
              Register here
            </Link>

          </p>

        </div>

      </div>

    </div>
  );
}

export default Signin