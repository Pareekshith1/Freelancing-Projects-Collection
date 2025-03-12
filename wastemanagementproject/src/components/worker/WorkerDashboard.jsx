import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import  supabase  from '../../lib/supabaseClient'
import { format } from 'date-fns'
import { FaMapMarkerAlt, FaClipboardList, FaCheckCircle, FaSpinner } from 'react-icons/fa'

const WorkerDashboard = () => {
  const [user, setUser] = useState(null)
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({
    assigned: 0,
    inProgress: 0,
    completed: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('contractdb')
            .select('*')
            .eq('id', user.id)
            .single()
            
          if (profileError) throw profileError
          setUser(profile)
          
          // Get assigned tasks
          const { data: reports, error: reportsError } = await supabase
            .from('waste_reports')
            .select('*')
            .eq('worker_id', user.id)
            .order('created_at', { ascending: false })
            
          if (reportsError) throw reportsError
          setTasks(reports || [])
          
          // Calculate stats
          const assigned = reports.filter(r => r.status === 'assigned').length
          const inProgress = reports.filter(r => r.status === 'in_progress').length
          const completed = reports.filter(r => r.status === 'completed').length
          
          setStats({
            assigned,
            inProgress,
            completed
          })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'assigned':
        return 'Assigned'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
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
    <div className="space-y-6 ">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {user?.name || 'Worker'}
        </h1>
        <p className="text-gray-600">
          Manage your assigned cleaning tasks and track your progress.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <FaClipboardList className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-800">Assigned</p>
              <p className="text-2xl font-bold text-blue-800">{stats.assigned}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 mr-4">
              <FaSpinner className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-800">In Progress</p>
              <p className="text-2xl font-bold text-purple-800">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <FaCheckCircle className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-800">Completed</p>
              <p className="text-2xl font-bold text-green-800">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h2>
        
        {tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.slice(0, 5).map((task) => (
              <Link 
                key={task.id}
                to={`/worker/task/${task.id}`}
                className="block border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4">
                    <img 
                      src={task.image_url || 'https://via.placeholder.com/300?text=No+Image'} 
                      alt="Waste" 
                      className="w-full h-48 md:h-full object-cover"
                    />
                  </div>
                  
                  <div className="p-4 md:w-3/4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold">{task.title || 'Waste Cleanup Task'}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(task.status)}`}>
                        {getStatusText(task.status)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-1">
                      Assigned on {format(new Date(task.assigned_date || task.created_at), 'MMM d, yyyy')}
                    </p>
                    
                    {task.address && (
                      <div className="flex items-start mt-2">
                        <FaMapMarkerAlt className="text-gray-400 mt-1 mr-1 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{task.address}</p>
                      </div>
                    )}
                    
                    {task.description && (
                      <p className="mt-2 text-gray-700 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            
            <div className="mt-4 text-center">
              <Link to="/worker/tasks" className="text-primary-600 hover:text-primary-700 font-medium">
                View all tasks
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">You don't have any assigned tasks yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkerDashboard
  