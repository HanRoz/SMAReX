import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../assets/ui/button';
import { userAuth } from '../context/AuthContext';

import {
  Home,
  BookOpen,
  Bookmark,
  Upload,
  User,
  Settings,
  LogOut,
  Library,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { toast } from 'sonner';

export function Sidebar({ children }) {

  const location = useLocation();
  const navigate = useNavigate();

  const { signOut } = userAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {

    const result = await signOut();

    if (result?.success) {
      toast.success('Logged out successfully');
      navigate('/signin');
    } else {
      toast.error(result?.error || 'Failed to log out');
    }
  };

  const navItems = [
    {
      path: '/dashboard',
      icon: Home,
      label: 'Dashboard'
    },
    {
      path: '/library',
      icon: Library,
      label: 'Library'
    },
    {
      path: '/saved',
      icon: Bookmark,
      label: 'Saved'
    },
    {
      path: '/upload',
      icon: Upload,
      label: 'Upload'
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profile'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings'
    }
  ];

  return (
    <div className="min-h-screen flex">

      {/* Sidebar */}
      <aside
        className={`
          ${isCollapsed ? 'w-20' : 'w-64'}
          border-r border-border
          bg-white/95
          backdrop-blur-sm
          flex flex-col
          transition-all duration-300
          relative
          min-h-screen
          flex-shrink-0
        `}
      >

        {/* Collapse button */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="
            absolute
            -right-3
            top-6
            z-10
            w-6
            h-6
            rounded-full
            bg-primary
            text-primary-foreground
            shadow-md
            hover:shadow-lg
            transition-shadow
            flex
            items-center
            justify-center
          "
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>


        {/* SMAReX Logo */}
        <div className="p-6 border-b border-border">

          <Link
            to="/dashboard"
            className={`flex items-center ${
              isCollapsed
                ? 'justify-center'
                : 'gap-2'
            }`}
          >

            <BookOpen className="w-8 h-8 text-primary flex-shrink-0" />

            {!isCollapsed && (
              <div>

                <h1 className="text-lg font-semibold">
                  SMAReX
                </h1>

                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  IIUM Resource Exchange
                </p>

              </div>
            )}

          </Link>

        </div>


        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">

          {navItems.map((item) => {

            const Icon = item.icon;

            const isActive =
              location.pathname === item.path;

            return (

              <Link
                key={item.path}
                to={item.path}
                className="block"
              >

                <Button
                  type="button"
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`
                    w-full
                    ${isCollapsed
                      ? 'justify-center px-2'
                      : 'justify-start'
                    }
                    ${isActive
                      ? 'bg-secondary text-primary'
                      : ''
                    }
                  `}
                  title={
                    isCollapsed
                      ? item.label
                      : undefined
                  }
                >

                  <Icon
                    className={`
                      w-4 h-4
                      ${isCollapsed ? '' : 'mr-3'}
                    `}
                  />

                  {!isCollapsed && item.label}

                </Button>

              </Link>

            );
          })}

        </nav>


        {/* Logout */}
        <div className="p-4 border-t border-border">

          <Button
            type="button"
            variant="ghost"
            className={`
              w-full
              ${isCollapsed
                ? 'justify-center px-2'
                : 'justify-start'
              }
              text-destructive
              hover:text-destructive
            `}
            onClick={handleLogout}
            title={
              isCollapsed
                ? 'Logout'
                : undefined
            }
          >

            <LogOut
              className={`
                w-4 h-4
                ${isCollapsed ? '' : 'mr-3'}
              `}
            />

            {!isCollapsed && 'Logout'}

          </Button>

        </div>

      </aside>


      {/* Page content */}
      <main className="flex-1 overflow-y-auto">

        <div className="max-w-7xl mx-auto p-8">

          {children}

        </div>

      </main>

    </div>
  );
}