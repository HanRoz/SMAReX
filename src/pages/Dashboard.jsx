import React from 'react'
import {userAuth} from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import {Sidebar} from '../components/sidebar'

const Dashboard = () => {
  return (
    <Sidebar>
      <div>
        <h1>Dashboard</h1>
      </div>
    </Sidebar>
  )
}

export default Dashboard
