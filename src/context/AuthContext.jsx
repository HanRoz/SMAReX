import {createContext, useEffect, useState, useContext} from "react";
import {supabase} from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({children}) => {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);

//Sign Up Function
    const signUpNewUser = async ({
    email,
    password,
    fullName,
    displayName,
    matricNumber,
    kulliyyah
}) => {

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,

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
        console.error("Error signing up:", error);

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

    useEffect(() => {

    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);

        if (session?.user) {
            fetchProfile(session.user.id);
        }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {

            setSession(session);

            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
        }
    );

    return () => {
        authListener.subscription.unsubscribe();
    };

}, []);

    //Sign Out Function
    const signOut = () => {
        const {error} = supabase.auth.signOut();
        if(error){
            console.log("Theres an error signing out: ", error);
        }
    }

    //Sign In Function
    const signInUser = async (email, password) => {
    try{
        const {data, error} = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        if (error){
            console.error("Signing in error occured: ", error);
            return {success: false, error: error.message};
        }
        console.log("Sign in successful: ", data);
        return {success: true, data};
    }catch (error){
        console.error("Error signing in: :", error);
    }
};

//Fetch Profile
const fetchProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error("Error fetching profile:", error);
        return;
    }

    setProfile(data);
};


    return (
        <AuthContext.Provider value={{session, profile, signUpNewUser, signOut, signInUser}}>
            {children}
        </AuthContext.Provider>
    );
}

export const userAuth = () => {
    return useContext(AuthContext);
}