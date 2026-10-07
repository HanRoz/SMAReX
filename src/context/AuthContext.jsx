import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import { supabase } from "../supabaseClient";


const AuthContext = createContext();


export const AuthContextProvider = ({ children }) => {

  // null = no session OR session hasn't been checked yet
  const [session, setSession] = useState(null);

  // User information from public.profiles
  const [profile, setProfile] = useState(null);

  // Important:
  // true means Supabase is still checking whether
  // the browser has an existing login session.
  const [authLoading, setAuthLoading] = useState(true);

//Fetch Profile Function
  const fetchProfile = async (userId) => {

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    setProfile(data);
  };

//Check if the user is already logged in when the app first loads or refreshes. If so, fetch their profile.
  useEffect(() => {

    // Runs when the app first loads or refreshes
    const getInitialSession = async () => {

      const {
        data: { session },
        error
      } = await supabase.auth.getSession();


      if (error) {
        console.error(
          "Error getting session:",
          error
        );
      }

      setSession(session);


      if (session?.user) {

        await fetchProfile(
          session.user.id
        );

      } else {

        setProfile(null);

      }

      setAuthLoading(false);
    };


    getInitialSession();


    // Listen for login/logout/session changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {

        setSession(newSession);

        if (newSession?.user) {

          fetchProfile(
            newSession.user.id
          );

        } else {

          setProfile(null);

        }

      }
    );


    return () => {
      subscription.unsubscribe();
    };

  }, []);

//Sign Up Function
  const signUpNewUser = async ({
    email,
    password,
    fullName,
    displayName,
    matricNumber,
    kulliyyah
  }) => {

    const { data, error } =
      await supabase.auth.signUp({

        email,
        password,

        options: {

          data: {

            full_name: fullName,

            display_name: displayName,

            matric_number: matricNumber,

            kulliyyah: kulliyyah

          }

        }

      });


    if (error) {

      console.error(
        "Error signing up:",
        error
      );

      return {
        success: false,
        error: error.message
      };

    }


    return {
      success: true,
      data
    };

  };

//Sign In Function
  const signInUser = async (
    email,
    password
  ) => {

    try {

      const { data, error } =
        await supabase.auth.signInWithPassword({

          email,
          password

        });


      if (error) {

        console.error(
          "Signing in error:",
          error
        );

        return {
          success: false,
          error: error.message
        };

      }


      return {
        success: true,
        data
      };


    } catch (error) {

      console.error(
        "Error signing in:",
        error
      );


      return {
        success: false,
        error: "An unexpected error occurred"
      };

    }

  };

//Sign Out Funtion
  const signOut = async () => {

    const { error } =
      await supabase.auth.signOut();


    if (error) {

      console.error(
        "Error signing out:",
        error
      );

      return {
        success: false,
        error: error.message
      };

    }


    return {
      success: true
    };

  };

  return (

    <AuthContext.Provider
      value={{
        session,
        profile,
        authLoading,

        signUpNewUser,
        signInUser,
        signOut
      }}
    >

      {children}

    </AuthContext.Provider>

  );

};

export const userAuth = () => {

  return useContext(AuthContext);

};