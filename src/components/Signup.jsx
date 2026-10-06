import React, { useState} from 'react'
import { Link } from 'react-router-dom'
import { userAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Signup = () => {

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState('');

const {session, signUpNewUser} = userAuth();
const navigate = useNavigate();
// console.log(session);

const handleSignUp = async (e) => {
  e.preventDefault();
  setLoading(true);
  try{
    const result = await signUpNewUser(email, password);
    if(result.success){
      navigate('/dashboard');
    }
  } catch (error){
    setError("An error occured");
  } finally {
    setLoading(false);
  }
}

 return (
  <div>
    <form onSubmit = {handleSignUp} className="max-w-md mx-auto pt-24">
        <h2 className="text-2xl font-bold mb-4">Sign Up</h2>
        <p className="mb-4">Already have an account? <Link to="/signin" className="text-blue-500 hover:underline">Sign In</Link></p>
        <div>
        <input onChange={(e) => setEmail(e.target.value)} 
        type="email" placeholder="Email" className="border border-blue-300 rounded px-4 py-2" />
        <input onChange={(e) => setPassword(e.target.value)} 
        type="password" placeholder="Password" className="border border-blue-300 rounded px-4 py-2 ml-2" />
        </div>
        <button type="submit" className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 mt-4">Submit</button>
        {error && <p className="text-red-500 pt-4">{error}</p>}
    </form>
  </div>
 )
}

export default Signup