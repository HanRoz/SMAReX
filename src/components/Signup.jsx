import React, { useState} from 'react'
import { Link } from 'react-router-dom'
import { userAuth } from '../context/AuthContext'

const Signup = () => {

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState('');
const {session} = userAuth();
console.log(session);


 return (
  <div>
    <form className="max-w-md mx-auto pt-24">
        <h2 className="text-2xl font-bold mb-4">Sign Up</h2>
        <p className="mb-4">Already have an account? <Link to="/signin" className="text-blue-500 hover:underline">Sign In</Link></p>
        <div>
        <input type="email" placeholder="Email" className="border border-blue-300 rounded px-4 py-2" />
        <input type="password" placeholder="Password" className="border border-blue-300 rounded px-4 py-2 ml-2" />
        </div>
        <button type="submit" className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 mt-4">Submit</button>
    </form>
  </div>
 )
}

export default Signup