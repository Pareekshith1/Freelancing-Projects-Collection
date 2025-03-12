import React, { useState } from 'react'
import supabase  from '../../lib/supabaseClient'
import toast from 'react-hot-toast'
import { FaCamera, FaSpinner, FaTrash } from 'react-icons/fa'

const ImageUpload = ({ onImageUploaded, existingImage = null }) => {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(existingImage)

  const uploadImage = async (file) => {
    try {
      setUploading(true)

      // Create a unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `waste-reports/${fileName}`

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      const publicUrl = data.publicUrl

      // Set preview and call the callback
      setPreview(publicUrl)
      onImageUploaded(publicUrl)
      toast.success('Image uploaded successfully')
    } catch (error) {
      toast.error('Error uploading image: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }
    const file = e.target.files[0]
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed')
      return
    }
    
    uploadImage(file)
  }

  const handleCameraCapture = () => {
    // Create a file input element
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' // Use the back camera on mobile devices
    
    // Handle file selection
    input.onchange = handleFileChange
    
    // Trigger the file input
    input.click()
  }

  const removeImage = () => {
    setPreview(null)
    onImageUploaded(null)
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-64 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
          >
            <FaTrash />
          </button>
        </div>
      ) : (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center h-64 bg-gray-50 cursor-pointer"
          onClick={handleCameraCapture}
        >
          {uploading ? (
            <FaSpinner className="animate-spin text-4xl text-primary-500 mb-2" />
          ) : (
            <FaCamera className="text-4xl text-gray-400 mb-2" />
          )}
          <p className="text-sm text-gray-500">
            {uploading ? 'Uploading...' : 'Click to take a photo or upload an image'}
          </p>
        </div>
      )}
    </div>
  )
}

export default ImageUpload