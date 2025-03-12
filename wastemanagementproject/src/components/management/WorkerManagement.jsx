import React, { useState, useEffect } from 'react'
import  supabase  from '../../lib/supabaseClient'
import toast from 'react-hot-toast'
import { FaUser, FaEnvelope, FaCalendarAlt, FaClipboardList, FaCheckCircle } from 'react-icons/fa'
import { format } from 'date-fns'

const WorkerManagement = () => {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [workerStats, setWorkerStats] = useState({})
  const [assignedReports, setAssignedReports] = useState([])

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const { data, error } = await supabase
          .from('contractdb')
          .select('*')
          .eq('role', 'worker')
          .order('name')
          
        if (error) throw error
        setWorkers(data || [])
      } catch (error) {
        console.error('Error fetching workers:', error)
        toast.error('Failed to load workers')
      } finally {
        setLoading(false)
      }
    }
    
    fetchWorkers()
  }, [])

  const fetchWorkerDetails = async (workerId) => {
    try {
      setSelectedWorker(workerId)
      
      // Get worker stats
      const { data: reports, error: reportsError } = await supabase
        .from('waste_reports')
        .select('*')
        .eq('worker_id', workerId)
        
      if (reportsError) throw reportsError
      
      const assigned = reports.length
      const inProgress = reports.filter(r => r.status === 'in_progress').length
      const completed = reports.filter(r => r.status === 'completed').length
      
      setWorkerStats({
        assigned,
        inProgress,
        completed
      })
      
      // Get assigned reports
      const { data: assignedData, error: assignedError } = await supabase
        .from('waste_reports')
        .select('*')
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false })
        
      if (assignedError) throw assignedError
      setAssignedReports(assignedData || [])
      
    } catch (error) {
      console.error('Error fetching worker details:', error)
      toast.error('Failed to load worker details')
    }
  }

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Worker Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workers List */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cleaning Workers</h2>
            
            {workers.length > 0 ? (
              <div className="space-y-2">
                {workers.map((worker) => (
                  <div 
                    key={worker.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedWorker === worker.id 
                        ? 'bg-primary-50 border-primary-200' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => fetchWorkerDetails(worker.id)}
                  >
                    <div className="flex items-center">
                      <div className="bg-gray-200 rounded-full p-3 mr-3">
                        <FaUser className="text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{worker.name}</h3>
                        <p className="text-sm text-gray-500">{worker.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No workers found.</p>
              </div>
            )}
          </div>
          
          {/* Worker Details */}
          <div className="lg:col-span-2">
            {selectedWorker ? (
              <div>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Worker Statistics</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-500">Total Assigned</p>
                      <p className="text-2xl font-bold">{workerStats.assigned || 0}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-purple-800">In Progress</p>
                      <p className="text-2xl font-bold text-purple-800">{workerStats.inProgress || 0}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-green-800">Completed</p>
                      <p className="text-2xl font-bold text-green-800">{workerStats.completed || 0}</p>
                    </div>
                  </div>
                </div>
                
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Reports</h2>
                {assignedReports.length > 0 ? (
                  <div className="space-y-4">
                    {assignedReports.map((report) => (
                      <div key={report.id} className="border rounded-lg overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-1/3">
                            <img 
                              src={report.image_url || 'https://via.placeholder.com/300?text=No+Image'} 
                              alt="Waste" 
                              className="w-full h-40 object-cover"
                            />
                          </div>
                          <div className="p-4 md:w-2/3">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium">{report.title || 'Waste Report'}</h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(report.status)}`}>
                                {getStatusText(report.status)}
                              </span>
                            </div>
                            
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center text-sm text-gray-500">
                                <FaCalendarAlt className="mr-1" />
                                <span>Reported: {format(new Date(report.created_at), 'MMM d, yyyy')}</span>
                              </div>
                              
                              {report.address && (
                                <div className="flex items-start text-sm text-gray-500">
                                  <FaClipboardList className="mr-1 mt-1 flex-shrink-0" />
                                  <span>{report.waste_type}</span>
                                </div>
                              )}
                            </div>
                            
                            {report.status === 'completed' && (
                              <div className="mt-2 flex items-center text-green-600">
                                <FaCheckCircle className="mr-1" />
                                <span className="text-sm">Completed on {format(new Date(report.updated_at), 'MMM d, yyyy')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No reports assigned to this worker.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 bg-gray-50 rounded-lg">
                <FaUser className="text-gray-300 text-5xl mb-4" />
                <p className="text-gray-500">Select a worker to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkerManagement