import {createContext, useEffect, useState, useContext} from "react";
import {supabase} from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({children}) => {
    const [session, setSession] = useState('Test Session');

//Sign Up Function
    const signUpNewUser = async (email, password) => {
        const {data, error} = await supabase.auth.signUp({
            email: email,
            password: password,
        });
        if (error) {
            console.error('Error signing up:', error);
            return {success: false, error};
        }
        return {success: true, data};
    };

    useEffect(() => {
        supabase.auth.getSession().then(({data: {session}}) => {
            setSession(session);
        });


        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        })
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


    return (
        <AuthContext.Provider value={{session, signUpNewUser, signOut, signInUser}}>
            {children}
        </AuthContext.Provider>
    );
}

export const userAuth = () => {
    return useContext(AuthContext);
}