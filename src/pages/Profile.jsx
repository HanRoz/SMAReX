import React from 'react'
import { userAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import {Sidebar} from '../components/sidebar'

const Profile = () => {

  const { session, profile} = userAuth();

  return (
    <Sidebar>

      <div className="max-w-xl mx-auto pt-20 px-6">

      <h1 className="text-2xl font-bold mb-6">
        Profile
      </h1>

      <div className="space-y-4">

        <div>
          <p className="font-semibold">Full Name</p>
          <p>{profile?.full_name}</p>
        </div>

        <div>
          <p className="font-semibold">Display Name</p>
          <p>{profile?.display_name}</p>
        </div>

        <div>
          <p className="font-semibold">Matric Number</p>
          <p>{profile?.matric_number}</p>
        </div>

        <div>
          <p className="font-semibold">Kulliyyah</p>
          <p>{profile?.kulliyyah}</p>
        </div>

        <div>
          <p className="font-semibold">IIUM Email</p>
          <p>{session?.user?.email}</p>
        </div>

      </div>

      <p className="mt-8">
        Go to{' '}
        <Link
          to="/dashboard"
          className="text-blue-500 hover:underline"
        >
          Dashboard
        </Link>
      </p>

    </div>
    </Sidebar>
  )
}

export default Profile