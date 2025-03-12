import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import  supabase  from '../../lib/supabaseClient'
import { format } from 'date-fns'
import { FaEye, FaMapMarkerAlt } from 'react-icons/fa'

const UserReports = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data, error } = await supabase
            .from('waste_reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            
          if (error) throw error
          setReports(data || [])
        }
      } catch (error) {
        console.error('Error fetching reports:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchReports()
  }, [])

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'assigned':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'assigned':
        return 'Assigned'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
      case 'rejected':
        return 'Rejected'
      default:
        return status
    }
  }

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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">My Waste Reports</h1>
        
        {reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="md:w-1/4">
                    <img 
                      src={report.image_url || 'https://via.placeholder.com/300?text=No+Image'} 
                      alt="Waste" 
                      className="w-full h-48 md:h-full object-cover"
                    />
                  </div>
                  
                  {/* Details */}
                  <div className="p-4 md:w-3/4">
                    <div className="flex justify-between items-start">
                      <h2 className="text-lg font-semibold">{report.title || 'Waste Report'}</h2>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(report.status)}`}>
                        {getStatusText(report.status)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-1">
                      Reported on {format(new Date(report.created_at), 'MMM d, yyyy')}
                    </p>
                    
                    {report.address && (
                      <div className="flex items-start mt-2">
                        <FaMapMarkerAlt className="text-gray-400 mt-1 mr-1 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{report.address}</p>
                      </div>
                    )}
                    
                    {report.description && (
                      <p className="mt-2 text-gray-700">{report.description}</p>
                    )}
                    
                    {report.status === 'completed' && !report.feedback && (
                      <div className="mt-4">
                        <Link 
                          to={`/feedback/${report.id}`}
                          className="btn btn-primary inline-flex items-center"
                        >
                          <FaEye className="mr-2" />
                          View Result & Give Feedback
                        </Link>
                      </div>
                    )}
                    
                    {report.status === 'completed' && report.feedback && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <p className="font-medium">Your Feedback:</p>
                        <div className="flex items-center mt-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg 
                                key={star}
                                className={`w-5 h-5 ${star <= report.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {report.rating}/5
                          </span>
                        </div>
                        {report.feedback_text && (
                          <p className="mt-2 text-sm text-gray-600">{report.feedback_text}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
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

export default UserReports