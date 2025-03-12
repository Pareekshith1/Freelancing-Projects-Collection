import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import  supabase  from '../../lib/supabaseClient'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { FaUser, FaCalendarAlt, FaMapMarkerAlt, FaImage, FaCheck, FaTimes } from 'react-icons/fa'

const ReportDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [workers, setWorkers] = useState([])
  const [selectedWorker, setSelectedWorker] = useState('')
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [cleanedImageUrl, setCleanedImageUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch report details
        const { data: reportData, error: reportError } = await supabase
          .from('waste_reports')
          .select(`
            *,
            profiles:user_id(name, email),
            assigned_worker:worker_id(name, email)
          `)
          .eq('id', id)
          .single()
          
        if (reportError) throw reportError
        setReport(reportData)
        setStatus(reportData.status)
        setNotes(reportData.management_notes || '')
        setSelectedWorker(reportData.worker_id || '')
        setCleanedImageUrl(reportData.cleaned_image_url || '')
        
        // Fetch available workers
        const { data: workersData, error: workersError } = await supabase
          .from('contractdb')
          .select('id, name')
          .eq('role', 'worker')
          
        if (workersError) throw workersError
        setWorkers(workersData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Error loading report details')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id])

  const handleStatusUpdate = async (e) => {
    e.preventDefault()
    setUpdating(true)
    
    try {
      const updates = {
        status,
        management_notes: notes,
        worker_id: selectedWorker || null,
        updated_at: new Date().toISOString()
      }
      
      if (cleanedImageUrl) {
        updates.cleaned_image_url = cleanedImageUrl
      }
      
      const { error } = await supabase
        .from('waste_reports')
        .update(updates)
        .eq('id', id)
        
      if (error) throw error
      
      toast.success('Report updated successfully')
      
      // Refresh report data
      const { data, error: refreshError } = await supabase
        .from('waste_reports')
        .select(`
          *,
          profiles:user_id(name, email),
          assigned_worker:worker_id(name, email)
        `)
        .eq('id', id)
        .single()
        
      if (refreshError) throw refreshError
      setReport(data)
    } catch (error) {
      toast.error('Error updating report: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleImageUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }
    
    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `cleaned-images/${fileName}`
    
    try {
      setUpdating(true)
      
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)
        
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)
        
      setCleanedImageUrl(data.publicUrl)
      toast.success('Image uploaded successfully')
    } catch (error) {
      toast.error('Error uploading image: ' + error.message)
    } finally {
      setUpdating(false)
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

  if (!report) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Report Not Found</h1>
        <p className="text-gray-600 mb-4">The report you're looking for doesn't exist or you don't have permission to view it.</p>
        <button
          onClick={() => navigate('/management/reports')}
          className="btn btn-primary"
        >
          Back to Reports
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Report Details</h1>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(report.status)}`}>
            {getStatusText(report.status)}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Report Information */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Report Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Title</p>
                    <p className="font-medium">{report.title || 'Untitled Report'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Waste Type</p>
                    <p className="font-medium capitalize">{report.waste_type || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p>{report.description || 'No description provided'}</p>
                  </div>
                  
                  <div className="flex items-center">
                    <FaUser className="text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Reported By</p>
                      <p className="font-medium">{report.profiles?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <FaCalendarAlt className="text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Date Reported</p>
                      <p className="font-medium">{format(new Date(report.created_at), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  
                  {report.address && (
                    <div className="flex items-start">
                      <FaMapMarkerAlt className="text-gray-400 mr-2 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p>{report.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Waste Image */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Waste Image</h3>
              <div className="bg-gray-50 p-2 rounded-lg">
                <img 
                  src={report.image_url || 'https://via.placeholder.com/400x300?text=No+Image'} 
                  alt="Waste" 
                  className="w-full h-64 object-cover rounded"
                />
              </div>
            </div>
          </div>
          
          {/* Management Actions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Management Actions</h2>
            <form onSubmit={handleStatusUpdate} className="space-y-4">
              {/* Status Update */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input"
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              {/* Worker Assignment */}
              <div>
                <label htmlFor="worker" className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Worker
                </label>
                <select
                  id="worker"
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="input"
                >
                  <option value="">-- Select Worker --</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Management Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Management Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="input"
                  placeholder="Add notes about this report..."
                />
              </div>
              
              {/* Cleaned Image Upload (for completed status) */}
              {(status === 'completed' || report.status === 'completed') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cleaned Image
                  </label>
                  {cleanedImageUrl ? (
                    <div className="relative">
                      <img 
                        src={cleanedImageUrl} 
                        alt="Cleaned Area" 
                        className="w-full h-48 object-cover rounded-lg mb-2"
                      />
                      <button
                        type="button"
                        onClick={() => setCleanedImageUrl('')}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <label className="block w-full cursor-pointer">
                        <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                          <FaImage className="text-gray-400 mr-2" />
                          <span className="text-gray-500">Upload cleaned area image</span>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}
              
              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full btn btn-primary flex justify-center"
                >
                  {updating ? (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                  ) : (
                    'Update Report'
                  )}
                </button>
              </div>
            </form>
            
            {/* Current Assignment Info */}
            {report.worker_id && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Current Assignment</h3>
                <p className="text-sm">
                  <span className="font-medium">Worker:</span> {report.assigned_worker?.name || 'Unknown'}
                </p>
                {report.assigned_date && (
                  <p className="text-sm">
                    <span className="font-medium">Assigned on:</span> {format(new Date(report.assigned_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            )}
            
            {/* Feedback Information */}
            {report.feedback_date && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">User Feedback</h3>
                <div className="flex items-center mb-2">
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
                  <p className="text-sm text-gray-700">{report.feedback_text}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Feedback provided on {format(new Date(report.feedback_date), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate('/management/reports')}
            className="btn btn-secondary"
          >
            Back to Reports
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReportDetails