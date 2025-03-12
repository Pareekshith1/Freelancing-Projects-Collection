import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../../lib/supabaseClient'
import toast from 'react-hot-toast'
import { FaMapMarkerAlt, FaCamera } from 'react-icons/fa'
import ImageUpload from '../shared/ImageUpload'
import LocationPicker from '../shared/LocationPicker'
import debounce from 'lodash.debounce' // Import debounce to prevent excessive requests

const wasteTypes = [
  { id: 'household', name: 'Household Waste' },
  { id: 'construction', name: 'Construction Debris' },
  { id: 'green', name: 'Green Waste' },
  { id: 'electronic', name: 'Electronic Waste' },
  { id: 'hazardous', name: 'Hazardous Materials' },
  { id: 'other', name: 'Other' }
]

const ReportWaste = () => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [wasteType, setWasteType] = useState('household')
  const [imageUrl, setImageUrl] = useState(null)
  const [location, setLocation] = useState(null)
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    
    getUser()
  }, [])

  // Reverse Geocoding Function
  const fetchAddress = async (lat, lon) => {
    if (!lat || !lon) return; // Prevent unnecessary calls

    try {
      const response = await fetch(
        `https://us1.locationiq.com/v1/reverse.php?key=pk.7974a86409bbdb1cd23af05156fcd5b4&lat=${lat}&lon=${lon}&format=json`
      )
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)

      const data = await response.json()
      if (data && data.display_name) {
        setAddress(data.display_name)
      } else {
        setAddress("Address not found")
      }
    } catch (error) {
      console.error('Error fetching address:', error)
      setAddress("Failed to fetch address")
    }
  }

  // Debounced function to prevent excessive API calls
  const debouncedFetchAddress = debounce(fetchAddress, 1000)

  useEffect(() => {
    if (location) {
      debouncedFetchAddress(location[0], location[1])
    }
  }, [location]) // Runs only when `location` changes

  const handleLocationSelect = (coordinates) => {
    setLocation(coordinates)
  }

  const handleImageUploaded = (url) => {
    setImageUrl(url)
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!imageUrl) {
      toast.error('Please upload an image of the waste');
      return;
    }
  
    if (!location) {
      toast.error('Please select a location on the map');
      return;
    }
  
    setLoading(true);
  
    try {
      const { data, error } = await supabase
        .from('waste_reports')
        .insert([
          {
            user_id: userId,
            title,
            description,
            waste_type: wasteType,
            image_url: imageUrl,
            location: `POINT(${location[1]} ${location[0]})`,
            address,
            status: 'pending',
            created_at: new Date().toISOString(),
          }
        ])
        .select();
  
      if (error) throw error;
  
      toast.success('Waste report submitted successfully!');
      
      // Reset form after successful submission
      setTitle('');
      setDescription('');
      setWasteType('household');
      setImageUrl(null);
      setLocation(null);
      setAddress('');
      
      navigate('/my-reports');
    } catch (error) {
      toast.error('Error submitting report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Report Waste</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the waste"
              required
              className="input"
            />
          </div>
          
          {/* Waste Type */}
          <div>
            <label htmlFor="wasteType" className="block text-sm font-medium text-gray-700 mb-1">
              Waste Type
            </label>
            <select
              id="wasteType"
              value={wasteType}
              onChange={(e) => setWasteType(e.target.value)}
              className="input"
            >
              {wasteTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more details about the waste and its surroundings"
              rows={4}
              className="input"
            />
          </div>
          
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <FaCamera className="mr-1" />
                <span>Photo of Waste</span>
              </div>
            </label>
            <ImageUpload onImageUploaded={handleImageUploaded} />
          </div>
          
          {/* Location Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <FaMapMarkerAlt className="mr-1" />
                <span>Location</span>
              </div>
            </label>
            <LocationPicker onLocationSelect={handleLocationSelect} />
            
            {address && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                <p className="font-medium">Selected Address:</p>
                <p className="text-gray-600">{address}</p>
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <div>
            <button type="submit" disabled={loading} className="w-full btn btn-primary">
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReportWaste;
