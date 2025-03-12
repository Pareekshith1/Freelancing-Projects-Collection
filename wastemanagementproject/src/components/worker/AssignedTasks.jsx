import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import  supabase  from '../../lib/supabaseClient'
import { format } from 'date-fns'
import { FaMapMarkerAlt, FaCalendarAlt, FaFilter } from 'react-icons/fa'

const AssignedTasks = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data, error } = await supabase
            .from('waste_reports')
            .select('*')
            .eq('worker_id', user.id)
            .order('created_at', { ascending: false })
            
          if (error) throw error
          setTasks(data || [])
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTasks()
  }, [])

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filter)

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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Assigned Tasks</h1>
        
        {/* Filter Controls */}
        <div className="flex items-center mb-6">
          <FaFilter className="text-gray-400 mr-2" />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                filter === 'all' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              All Tasks
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
        </div>
        
        {/* Tasks List */}
        {filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
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
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <FaCalendarAlt className="mr-1" />
                        <span>Reported: {format(new Date(task.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      
                      {task.assigned_date && (
                        <div className="flex items-center text-sm text-gray-500">
                          <FaCalendarAlt className="mr-1" />
                          <span>Assigned: {format(new Date(task.assigned_date), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      
                      {task.address && (
                        <div className="flex items-start text-sm text-gray-500">
                          <FaMapMarkerAlt className="mr-1 mt-1 flex-shrink-0" />
                          <span>{task.address}</span>
                        </div>
                      )}
                    </div>
                    
                    {task.waste_type && (
                      <div className="mt-2">
                        <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          {task.waste_type.charAt(0).toUpperCase() + task.waste_type.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No tasks found matching the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AssignedTasks