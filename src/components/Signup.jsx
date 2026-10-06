import React, { useState} from 'react'
import { Link } from 'react-router-dom'
import { userAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Signup = () => {

const [fullName, setFullName] = useState('');
const [displayName, setDisplayName] = useState('');
const [matricNumber, setMatricNumber] = useState('');
const [kulliyyah, setKulliyyah] = useState('');

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');

const [error, setError] = useState('');
const [loading, setLoading] = useState('');

const {session, signUpNewUser} = userAuth();
const navigate = useNavigate();
// console.log(session);  this to test if the user is logged in or not, if logged in, session will have data, else null

const handleSignUp = async (e) => {
    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
    }

    if (!email.toLowerCase().endsWith("@live.iium.edu.my")) {
        setError("Please use your IIUM email");
        return;
    }

    setLoading(true);

    try {

        const result = await signUpNewUser({
            email,
            password,
            fullName,
            displayName,
            matricNumber,
            kulliyyah
        });

        if (result.success) {
            navigate('/signin');
        } else {
            setError(result.error);
        }

    } catch (error) {

        console.error(error);
        setError("An error occurred during registration");

    } finally {

        setLoading(false);

    }
};

 return (
  <div>
    <form onSubmit = {handleSignUp} className="max-w-md mx-auto pt-24">
        <h2 className="text-2xl font-bold mb-4">Sign Up</h2>
        <p className="mb-4">Already have an account? <Link to="/signin" className="text-blue-500 hover:underline">Sign In</Link></p>
        <div>
        <input
    type="text"
    placeholder="Full Name"
    value={fullName}
    onChange={(e) => setFullName(e.target.value)}
/>

<input
    type="text"
    placeholder="Display Name"
    value={displayName}
    onChange={(e) => setDisplayName(e.target.value)}
/>

<input
    type="text"
    placeholder="Matric Number"
    value={matricNumber}
    onChange={(e) => setMatricNumber(e.target.value)}
/>
<select
    value={kulliyyah}
    onChange={(e) => setKulliyyah(e.target.value)}
>
    <option value="">Select Kulliyyah</option>
    <option value="KICT">KICT</option>
    <option value="AIKOL">AIKOL</option>
    <option value="KENMS">KENMS</option>
    <option value="KOED">KOED</option>
    <option value="KIRKHS">KIRKHS</option>
    <option value="KOE">KOE</option>
    <option value="KOS">KOS</option>
</select>
<input
    type="email"
    placeholder="IIUM Email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
/>

<input
    type="password"
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
/>

<input
    type="password"
    placeholder="Confirm Password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
/>
        </div>
        <button type="submit" className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 mt-4">Submit</button>
        {error && <p className="text-red-500 pt-4">{error}</p>}
    </form>
  </div>
 )
}

export default Signup