import React from 'react'
import {userAuth} from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {

  const {session, signOut} = userAuth();
  const navigate = useNavigate();

  // console.log(session);

  const handleSignOut = async (e) => {
    e.preventDefault();
    try{
      await signOut();
      navigate('/');
    } catch (error){
      console.error("Error signing out: ", error);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <h2 className="text-xl font-semibold">Welcome, {session?.user?.email}</h2>
      <div>
        <p className="text-blue-500 hover:underline cursor-pointer" onClick={handleSignOut}>Sign out</p>
      </div>
    </div>
  )
}

export default Dashboard
