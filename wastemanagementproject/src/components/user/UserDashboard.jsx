import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import supabase  from '../../lib/supabaseClient'
import { FaPlus, FaClipboardList, FaCheckCircle } from 'react-icons/fa'
import { format } from 'date-fns'

const UserDashboard = () => {
  const [user, setUser] = useState(null)
  const [recentReports, setRecentReports] = useState([])
  const [pendingFeedback, setPendingFeedback] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
            
          if (profileError) throw profileError
          setUser(profile)
          
          // Get recent reports
          const { data: reports, error: reportsError } = await supabase
            .from('waste_reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3)
            
          if (reportsError) throw reportsError
          setRecentReports(reports)
          
          // Get reports needing feedback
          const { data: feedback, error: feedbackError } = await supabase
            .from('waste_reports')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .is('feedback', null)
            .order('updated_at', { ascending: false })
            
          if (feedbackError) throw feedbackError
          setPendingFeedback(feedback)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {user?.name || 'User'}
        </h1>
        <p className="text-gray-600">
          Help keep our city clean by reporting waste in your area.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <Link to="/report" className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              <FaPlus className="text-primary-600 mr-3" />
              <span>Report New Waste</span>
            </Link>
            <Link to="/my-reports" className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              <FaClipboardList className="text-primary-600 mr-3" />
              <span>View My Reports</span>
            </Link>
          </div>
        </div>

        {/* Pending Feedback */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Feedback</h2>
          {pendingFeedback.length > 0 ? (
            <div className="space-y-3">
              {pendingFeedback.map((report) => (
                <Link 
                  key={report.id} 
                  to={`/feedback/${report.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <FaCheckCircle className="text-green-500 mr-3" />
                    <div>
                      <p className="font-medium">{report.title || 'Waste Report'}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(report.updated_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-primary-600">Give Feedback</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No pending feedback requests.</p>
          )}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h2>
        {recentReports.length > 0 ? (
          <div className="space-y-4">
            {recentReports.map((report) => (
              <div key={report.id} className="flex border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                <div className="w-16 h-16 rounded-md overflow-hidden mr-4">
                  <img 
                    src={report.image_url || 'https://via.placeholder.com/150?text=No+Image'} 
                    alt="Waste" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{report.title || 'Waste Report'}</h3>
                  <p className="text-sm text-gray-500 mb-1">
                    {format(new Date(report.created_at), 'MMM d, yyyy')}
                  </p>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    report.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    report.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                    report.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {report.status === 'pending' ? 'Pending' :
                     report.status === 'assigned' ? 'Assigned' :
                     report.status === 'in_progress' ? 'In Progress' :
                     report.status === 'completed' ? 'Completed' :
                     report.status}
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-4 text-center">
              <Link to="/my-reports" className="text-primary-600 hover:text-primary-700 font-medium">
                View all reports
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">You haven't reported any waste yet.</p>
            <Link to="/report" className="btn btn-primary">
              Report Waste
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard