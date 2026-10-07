import React from 'react'
import {userAuth} from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import {Sidebar} from '../components/sidebar'

const Upload = () => {
  return (
    <Sidebar>
      <div>
        <h1>Upload</h1>
      </div>
    </Sidebar>
  )
}

export default Upload
