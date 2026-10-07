import React from 'react';

import {
  Mail,
  BookOpen,
  GraduationCap,
  User,
  Shield
} from 'lucide-react';

import { userAuth } from '../context/AuthContext';
import { Badge } from '../assets/ui/badge';
import { Sidebar } from '../components/sidebar';

const Profile = () => {

  const { profile } = userAuth();

  if (!profile) {
    return (
      <Sidebar>

        <div className="flex items-center justify-center min-h-[400px]">

          <p className="text-muted-foreground">
            Loading profile...
          </p>

        </div>

      </Sidebar>
    );
  }


  // Create initials from full name
  const getInitials = (name) => {

    if (!name) return '?';

    const words = name
      .trim()
      .split(' ')
      .filter(Boolean);

    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }

    return (
      words[0][0] +
      words[1][0]
    ).toUpperCase();
  };


  return (

    <Sidebar>

      <div className="space-y-6">


        {/* Page heading */}

        <div>

          <h1 className="text-2xl font-semibold">
            Profile
          </h1>

          <p className="text-sm text-muted-foreground mt-1">
            View your SMAReX account information
          </p>

        </div>


        {/* Main Profile Card */}

        <div className="
          bg-card
          border
          border-border
          rounded-lg
          p-8
          shadow-sm
        ">

          <div className="
            flex
            flex-col
            sm:flex-row
            items-center
            sm:items-start
            gap-6
          ">


            {/* Profile Initials */}

            <div className="
              w-24
              h-24
              bg-primary
              rounded-full
              flex
              items-center
              justify-center
              text-primary-foreground
              text-3xl
              font-semibold
              flex-shrink-0
            ">

              {getInitials(profile.full_name)}

            </div>


            {/* User Information */}

            <div className="
              flex-1
              text-center
              sm:text-left
            ">


              <div className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                gap-2
                mb-4
              ">

                <h2 className="text-2xl font-semibold">

                  {profile.full_name}

                </h2>


                <Badge variant="secondary">

                  {profile.role === 'admin'
                    ? 'Admin'
                    : 'User'
                  }

                </Badge>

              </div>


              <div className="
                space-y-3
                text-sm
                text-muted-foreground
              ">


                {/* Display Name */}

                <div className="
                  flex
                  items-center
                  justify-center
                  sm:justify-start
                  gap-2
                ">

                  <User className="w-4 h-4" />

                  <span>
                    {profile.display_name}
                  </span>

                </div>


                {/* Matric Number */}

                <div className="
                  flex
                  items-center
                  justify-center
                  sm:justify-start
                  gap-2
                ">

                  <GraduationCap className="w-4 h-4" />

                  <span>
                    Matric: {profile.matric_number}
                  </span>

                </div>


                {/* Kulliyyah */}

                <div className="
                  flex
                  items-center
                  justify-center
                  sm:justify-start
                  gap-2
                ">

                  <BookOpen className="w-4 h-4" />

                  <span>
                    Kulliyyah: {profile.kulliyyah}
                  </span>

                </div>


                {/* Email */}

                <div className="
                  flex
                  items-center
                  justify-center
                  sm:justify-start
                  gap-2
                ">

                  <Mail className="w-4 h-4" />

                  <span>
                    {profile.email}
                  </span>

                </div>


                {/* Account Type */}

                <div className="
                  flex
                  items-center
                  justify-center
                  sm:justify-start
                  gap-2
                ">

                  <Shield className="w-4 h-4" />

                  <span>
                    Account type: {
                      profile.role === 'admin'
                        ? 'Administrator'
                        : 'IIUM User'
                    }
                  </span>

                </div>


              </div>

            </div>

          </div>

        </div>


        {/* Uploaded Resources */}

        <div>

          <h2 className="
            text-xl
            font-semibold
            mb-4
          ">
            Your Uploaded Resources
          </h2>


          {/* Temporary empty state */}

          <div className="
            text-center
            py-12
            bg-card
            border
            border-border
            rounded-lg
          ">

            <BookOpen className="
              w-12
              h-12
              mx-auto
              mb-4
              text-muted-foreground
            " />

            <p className="
              text-muted-foreground
              mb-2
            ">
              No uploaded resources yet
            </p>

            <p className="
              text-sm
              text-muted-foreground
            ">
              Share your notes and study materials with the community
            </p>

          </div>

        </div>


      </div>

    </Sidebar>

  );
};

export default Profile;