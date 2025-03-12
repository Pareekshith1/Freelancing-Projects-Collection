import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import  supabase  from './lib/supabaseClient'

// Auth Components
import Login from './components/auth/Login'
import Register from './components/auth/Register'

// User Interface
import UserDashboard from './components/user/UserDashboard'
import ReportWaste from './components/user/ReportWaste'
import UserReports from './components/user/UserReports'
import FeedbackForm from './components/user/FeedbackForm'

// Management Interface
import ManagementDashboard from './components/management/ManagementDashboard'
import ReportDetails from './components/management/ReportDetails'
import WorkerManagement from './components/management/WorkerManagement'
import Analytics from './components/management/Analytics'

// Worker Interface
import WorkerDashboard from './components/worker/WorkerDashboard'
import AssignedTasks from './components/worker/AssignedTasks'
import TaskDetails from './components/worker/TaskDetails'

// Shared Components
import Layout from './components/shared/Layout'
import ProtectedRoute from './components/shared/ProtectedRoute'
import NotFound from './components/shared/NotFound'

function App() {
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchUserRole(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) {
          fetchUserRole(session.user.id)
        } else {
          setUserRole(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('contractdb')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUserRole(data.role)
    } catch (error) {
      console.error('Error fetching user role:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!session ? <Register /> : <Navigate to="/" />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute session={session} />}>
          {/* User Routes */}
          <Route path="/" element={
            <Layout userRole={userRole}>
              {userRole === 'user' && <UserDashboard />}
              {userRole === 'management' && <ManagementDashboard />}
              {userRole === 'worker' && <WorkerDashboard />}
              {!userRole && <Navigate to="/login" />}
            </Layout>
          } />

          {/* User specific routes */}
          <Route path="/report" element={
            <Layout userRole={userRole}>
              {userRole === 'user' ? <ReportWaste /> : <Navigate to="/" />}
            </Layout>
          } />
          <Route path="/my-reports" element={
            <Layout userRole={userRole}>
              {userRole === 'user' ? <UserReports /> : <Navigate to="/" />}
            </Layout>
          } />
          <Route path="/feedback/:reportId" element={
            <Layout userRole={userRole}>
              {userRole === 'user' ? <FeedbackForm /> : <Navigate to="/" />}
            </Layout>
          } />

          {/* Management specific routes */}
          <Route path="/management/reports" element={
            <Layout userRole={userRole}>
              {userRole === 'management' ? <ManagementDashboard /> : <Navigate to="/" />}
            </Layout>
          } />
          <Route path="/management/report/:id" element={
            <Layout userRole={userRole}>
              {userRole === 'management' ? <ReportDetails /> : <Navigate to="/" />}
            </Layout>
          } />
          <Route path="/management/workers" element={
            <Layout userRole={userRole}>
              {userRole === 'management' ? <WorkerManagement /> : <Navigate to="/" />}
            </Layout>
          } />
          <Route path="/management/analytics" element={
            <Layout userRole={userRole}>
              {userRole === 'management' ? <Analytics /> : <Navigate to="/" />}
            </Layout>
          } />

          {/* Worker specific routes */}
          <Route path="/worker/tasks" element={
            <Layout userRole={userRole}>
              {userRole === 'worker' ? <AssignedTasks /> : <Navigate to="/" />}
            </Layout>
          } />
          <Route path="/worker/task/:id" element={
            <Layout userRole={userRole}>
              {userRole === 'worker' ? <TaskDetails /> : <Navigate to="/" />}
            </Layout>
          } />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App