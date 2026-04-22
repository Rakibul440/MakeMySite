import { Route, Routes, useLocation } from 'react-router-dom'

import {
  Community,
  Home,
  MyProjects,
  Preview,
  Pricing,
  Projects,
  View,
  LandingPage
} from "./pages/index.ts"

import Navbar from './components/Navbar.tsx'
// Toster import
import { Toaster } from "@/components/ui/sonner"
import AuthPage from './pages/auth/AuthPage.tsx'
import Settings from './pages/Settings.tsx'

export default function App() {

  const { pathname } = useLocation()
  const hideNavbar = pathname.startsWith("/projects/") && pathname !== "/projects"
    || pathname.startsWith("/view/")
    || pathname.startsWith("/preview/")


  return (
    <div>
      <Toaster />
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/pricing' element={<Pricing />} />
        {/* <Route path='/landingPage' element={<LandingPage />} /> */}

        <Route path='/projects' element={<MyProjects />} />
        <Route path='/projects/:projectId' element={<Projects />} />
        <Route path='/preview/:projectId' element={<Preview />} />
        <Route path='/preview/:projectId/:versionId' element={<Preview />} />
        <Route path='/community' element={<Community />} />
        <Route path='/view/:projectId' element={<View />} />

        <Route path='/auth/:pathname' element={<AuthPage />} />
        <Route path='/account/settings' element={<Settings />} />
      </Routes>
    </div>
  )
}
