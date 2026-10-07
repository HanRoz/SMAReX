import React from 'react'
import {userAuth} from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

const PrivateRoute = ({children}) => {
    const {session, authLoading} = userAuth();
    if(authLoading){
        return (

      <div className="
        min-h-screen
        flex
        items-center
        justify-center
      ">

        <p className="text-muted-foreground">
          Loading...
        </p>

      </div>

    );

    }

   if (!session) {

    return (
      <Navigate
        to="/signin"
        replace
      />
    );

  }

  return children;
};

export default PrivateRoute
