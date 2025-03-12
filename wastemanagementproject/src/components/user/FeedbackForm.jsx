import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import  supabase  from '../../lib/supabaseClient'
import toast from 'react-hot-toast'
import { FaStar } from 'react-icons/fa'

const FeedbackForm = () => {
  const { reportId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [feedbackText, setFeedbackText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          navigate('/login')
          return
        }
        
        const { data, error } = await supabase
          .from('waste_reports')
          .select('*')
          .eq('id', reportId)
          .eq('user_id', user.id)
          .single()
          
        if (error) throw error
        
        if (!data) {
          toast.error('Report not found')
          navigate('/my-reports')
          return
        }
        
        setReport(data)
      } catch (error) {
        console.error('Error fetching report:', error)
        toast.error('Error loading report')
        navigate('/my-reports')
      } finally {
        setLoading(false)
      }
    }
    
    fetchReport()
  }, [reportId, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }
    
    setSubmitting(true)
    
    try {
      const { error } = await supabase
        .from('waste_reports')
        .update({
          rating,
          feedback_text: feedbackText,
          feedback_date: new Date().toISOString()
        })
        .eq('id', reportId)
        
      if (error) throw error
      
      toast.success('Feedback submitted successfully!')
      navigate('/my-reports')
    } catch (error) {
      toast.error('Error submitting feedback: ' + error.message)
    } finally {
      setSubmitting(false)
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
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Provide Feedback</h1>
        
        {/* Before and After Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Before Cleaning</h3>
            <img 
              src={report.image_url || 'https://via.placeholder.com/300?text=No+Image'} 
              alt="Before" 
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">After Cleaning</h3>
            <img 
              src={report.cleaned_image_url || 'https://via.placeholder.com/300?text=No+Image'} 
              alt="After" 
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How satisfied are you with the cleaning service?
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                >
                  <FaStar 
                    className={`text-2xl ${
                      star <= (hover || rating) 
                        ? 'text-yellow-400' 
                        : 'text-gray-300'
                    }`} 
                  />
                </button>
              ))}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          </div>
          
          {/* Feedback Text */}
          <div>
            <label htmlFor="feedbackText" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Comments (Optional)
            </label>
            <textarea
              id="feedbackText"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Share your thoughts about the cleaning service..."
              rows={4}
              className="input"
            />
          </div>
          
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn btn-primary flex justify-center"
            >
              {submitting ? (
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
              ) : (
                'Submit Feedback'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FeedbackForm