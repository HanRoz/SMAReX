import React from 'react'
import {userAuth} from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import {Sidebar} from '../components/sidebar'

const Library = () => {
  return (
    <Sidebar>
      <div>
        <h1>Library</h1>
      </div>
    </Sidebar>
  )
}

export default Library