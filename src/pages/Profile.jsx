// import React from 'react'
// import {userAuth} from '../context/AuthContext'
// import { Link } from 'react-router-dom'

// const Profile = () => {
//     const {session} = userAuth();
//  return (
//     <div>
//       <h1 className="text-2xl font-bold">Profile</h1>
//       <h2 className="text-xl font-semibold">Welcome, {session?.user?.email}</h2>
//       <p className="mb-4">go to <Link to="/dashboard" className="text-blue-500 hover:underline">Dashboard</Link></p>
//     </div>
//   )
// }

// export default Profile


import React from 'react'
import { userAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const Profile = () => {

  const { session } = userAuth();

  // Placeholder profile data for now
  const profile = {
    fullName: "Ahmad bin Abdullah",
    displayName: "Ahmad",
    matricNumber: "2312345",
    kulliyyah: "Kulliyyah of Information and Communication Technology (KICT)",
    role: "User"
  };

  return (
    <div className="max-w-xl mx-auto pt-20 px-6">

      <h1 className="text-2xl font-bold mb-6">
        Profile
      </h1>

      <div className="space-y-4">

        <div>
          <p className="font-semibold">Display Name</p>
          <p>{profile.displayName}</p>
        </div>

        <div>
          <p className="font-semibold">Full Name</p>
          <p>{profile.fullName}</p>
        </div>

        <div>
          <p className="font-semibold">Matric Number</p>
          <p>{profile.matricNumber}</p>
        </div>

        <div>
          <p className="font-semibold">Kulliyyah</p>
          <p>{profile.kulliyyah}</p>
        </div>

        <div>
          <p className="font-semibold">IIUM Email</p>
          <p>{session?.user?.email || "student@live.iium.edu.my"}</p>
        </div>

        {/* <div>
          <p className="font-semibold">Role</p>
          <p>{profile.role}</p>
        </div> */}

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
  )
}

export default Profile