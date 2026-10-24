import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthContextProvider } from './context/AuthContext.jsx'
import './index.css'
import { router } from './router.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
    <AuthContextProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-center" />
    </AuthContextProvider>
  </StrictMode>,
)
