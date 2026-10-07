import React from 'react'
import {userAuth} from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import {Sidebar} from '../components/sidebar'

const Settings = () => {
  return (
    <Sidebar>

      <div>
        <h1>Settings</h1>
      </div>

    </Sidebar>
  )
}

export default Settings
