import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import  supabase  from '../../lib/supabaseClient'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { FaMapMarkerAlt, FaCalendarAlt, FaImage, FaCheck, FaSpinner } from 'react-icons/fa'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
})

const TaskDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [cleanedImageUrl, setCleanedImageUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [location, setLocation] = useState(null)

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          navigate('/login')
          return
        }
        
        const { data, error } = await supabase
          .from('waste_reports')
          .select('*')
          .eq('id', id)
          .eq('worker_id', user.id)
          .single()
          
        if (error) throw error
        
        if (!data) {
          toast.error('Task not found or not assigned to you')
          navigate('/worker/tasks')
          return
        }
        
        setTask(data)
        setStatus(data.status)
        setNotes(data.worker_notes || '')
        setCleanedImageUrl(data.cleaned_image_url || '')
        
        // Parse location from PostgreSQL POINT format
        console.log("Task Location Data:", data.location);

        if (data.location && data.location.coordinates) {
          const [lon, lat] = data.location.coordinates; // Extract lon & lat directly
          setLocation([lat, lon]); // Leaflet expects [latitude, longitude]
        } else {
          console.error("Invalid location format:", data.location);
        }
        
      } catch (error) {
        console.error('Error fetching task:', error)
        toast.error('Error loading task details')
        navigate('/worker/tasks')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTask()
  }, [id, navigate])

  const handleStatusUpdate = async (e) => {
    e.preventDefault()
    
    if (status === 'completed' && !cleanedImageUrl) {
      toast.error('Please upload an image of the cleaned area')
      return
    }
    
    setUpdating(true)
    
    try {
      const updates = {
        status,
        worker_notes: notes,
        updated_at: new Date().toISOString()
      }
      
      if (status === 'in_progress' && task.status === 'assigned') {
        updates.started_at = new Date().toISOString()
      }
      
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString()
        updates.cleaned_image_url = cleanedImageUrl
      }
      
      const { error } = await supabase
        .from('waste_reports')
        .update(updates)
        .eq('id', id)
        
      if (error) throw error
      
      toast.success('Task status updated successfully')
      
      // Refresh task data
      const { data, error: refreshError } = await supabase
        .from('waste_reports')
        .select('*')
        .eq('id', id)
        .single()
        
      if (refreshError) throw refreshError
      setTask(data)
    } catch (error) {
      toast.error('Error updating task: ' + error.message)
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(task.status)}`}>
            {getStatusText(task.status)}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Task Information */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Task Information</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Title</p>
                    <p className="font-medium">{task.title || 'Waste Cleanup Task'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Waste Type</p>
                    <p className="font-medium capitalize">{task.waste_type || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p>{task.description || 'No description provided'}</p>
                  </div>
                  
                  <div className="flex items-center">
                    <FaCalendarAlt className="text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Date Reported</p>
                      <p className="font-medium">{format(new Date(task.created_at), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  
                  {task.assigned_date && (
                    <div className="flex items-center">
                      <FaCalendarAlt className="text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">Date Assigned</p>
                        <p className="font-medium">{format(new Date(task.assigned_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  )}
                  
                  {task.address && (
                    <div className="flex items-start">
                      <FaMapMarkerAlt className="text-gray-400 mr-2 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p>{task.address}</p>
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
                  src={task.image_url || 'https://via.placeholder.com/400x300?text=No+Image'} 
                  alt="Waste" 
                  className="w-full h-64 object-cover rounded"
                />
              </div>
            </div>
          </div>
          
          {/* Worker Actions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Update Status</h2>
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
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              {/* Worker Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="input"
                  placeholder="Add notes about this task..."
                />
              </div>
              
              {/* Cleaned Image Upload (for completed status) */}
              {status === 'completed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Image of Cleaned Area
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
                        <FaCheck />
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
                    'Update Status'
                  )}
                </button>
              </div>
            </form>
            
            {/* Location Map */}
            {location && (
              <div className="mt-6">
                <h3 className="text-md font-semibold text-gray-900 mb-2">Location</h3>
                <div className="h-64 rounded-lg overflow-hidden border border-gray-300">
                  <MapContainer
                    center={location}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={location} />
                  </MapContainer>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate('/worker/tasks')}
            className="btn btn-secondary"
          >
            Back to Tasks
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskDetails