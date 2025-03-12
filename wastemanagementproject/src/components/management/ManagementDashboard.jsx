import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import  supabase  from '../../lib/supabaseClient'
import { format } from 'date-fns'
import { FaMapMarkerAlt, FaUser, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa'

const ManagementDashboard = () => {
  const [reports, setReports] = useState([])
  const [stats, setStats] = useState({
    pending: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    console.log("useEffect triggered");
    const fetchData = async () => {
      console.log("fetchData function started");
      try {

        console.log("Fetching data from Supabase...");
        // Fetch all reports
        const { data: allReports, error } = await supabase
          .from('waste_reports')
          .select(`
            *,
            profiles:user_id(name),
            assigned_worker:worker_id(name)
          `)
          .order('created_at', { ascending: false })
          
          if (error) {
            console.error("Error fetching reports:", error)
            throw error;
          }

          console.log("Fetched Reports from Supabase:", allReports);
          console.log("All Reports Before Filtering:", reports);
 // ✅ LOG FETCHED DATA

        if (!allReports || allReports.length === 0) {
          console.warn("No reports found in the database.");
        }
        
        setReports(allReports || [])

        
        
        // Calculate stats
        const pending = allReports.filter(r => r.status === 'pending').length
        const assigned = allReports.filter(r => r.status === 'assigned').length
        const inProgress = allReports.filter(r => r.status === 'in_progress').length
        const completed = allReports.filter(r => r.status === 'completed').length


        console.log("Stats calculated:", { pending, assigned, inProgress, completed, total: allReports.length }); // ✅ LOG STATS
        
        setStats({
          pending,
          assigned,
          inProgress,
          completed,
          total: allReports.length
        })
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(report => report.status === filter)

    console.log("Filtered Reports are here :", filteredReports);


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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Waste Management Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Reports</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-yellow-800">Pending</p>
            <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-blue-800">Assigned</p>
            <p className="text-2xl font-bold text-blue-800">{stats.assigned}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-purple-800">In Progress</p>
            <p className="text-2xl font-bold text-purple-800">{stats.inProgress}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-green-800">Completed</p>
            <p className="text-2xl font-bold text-green-800">{stats.completed}</p>
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'all' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'pending' 
                ? 'bg-yellow-800 text-white' 
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('assigned')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'assigned' 
                ? 'bg-blue-800 text-white' 
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            }`}
          >
            Assigned
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'in_progress' 
                ? 'bg-purple-800 text-white' 
                : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'completed' 
                ? 'bg-green-800 text-white' 
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            Completed
          </button>
        </div>
        
        {/* Reports List */}
        {filteredReports.length > 0 ? (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Link 
                key={report.id} 
                to={`/management/report/${report.id}`}
                className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
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
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <FaUser className="mr-1" />
                        <span>Reported by: {report.profiles?.name || 'Unknown'}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <FaCalendarAlt className="mr-1" />
                        <span>Date: {format(new Date(report.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      
                      {report.address && (
                        <div className="flex items-start text-sm text-gray-500">
                          <FaMapMarkerAlt className="mr-1 mt-1 flex-shrink-0" />
                          <span>{report.address}</span>
                        </div>
                      )}
                    </div>
                    
                    {report.status === 'pending' && (
                      <div className="mt-3 flex items-center text-yellow-600">
                        <FaExclamationTriangle className="mr-1" />
                        <span className="text-sm font-medium">Needs assignment</span>
                      </div>
                    )}
                    
                    {report.worker_id && (
                      <div className="mt-3 text-sm">
                        <span className="font-medium">Assigned to: </span>
                        <span>{report.assigned_worker?.name || 'Unknown worker'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No reports found matching the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManagementDashboard