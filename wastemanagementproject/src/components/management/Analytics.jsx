import React, { useState, useEffect } from 'react'
import  supabase  from '../../lib/supabaseClient'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { FaChartBar, FaMapMarkerAlt, FaCalendarAlt, FaStar } from 'react-icons/fa'

const Analytics = () => {
  const [timeframe, setTimeframe] = useState('week')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0
  })
  const [wasteTypes, setWasteTypes] = useState([])
  const [topLocations, setTopLocations] = useState([])
  const [averageRating, setAverageRating] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  const fetchAnalytics = async () => {
    setLoading(true)
    
    try {
      // Calculate date range based on timeframe
      let startDate
      const endDate = new Date()
      
      if (timeframe === 'week') {
        startDate = subDays(new Date(), 7)
      } else if (timeframe === 'month') {
        startDate = startOfMonth(new Date())
      } else if (timeframe === 'year') {
        startDate = new Date(new Date().getFullYear(), 0, 1) // January 1st of current year
      }
      
      // Format dates for Supabase query
      const formattedStartDate = startDate.toISOString()
      const formattedEndDate = endDate.toISOString()
      
      // Fetch reports within date range
      const { data: reports, error } = await supabase
        .from('waste_reports')
        .select('*')
        .gte('created_at', formattedStartDate)
        .lte('created_at', formattedEndDate)
        
      if (error) throw error
      
      // Calculate stats
      const total = reports.length
      const pending = reports.filter(r => r.status === 'pending').length
      const assigned = reports.filter(r => r.status === 'assigned').length
      const inProgress = reports.filter(r => r.status === 'in_progress').length
      const completed = reports.filter(r => r.status === 'completed').length
      const rejected = reports.filter(r => r.status === 'rejected').length
      
      setStats({
        total,
        pending,
        assigned,
        inProgress,
        completed,
        rejected
      })
      
      // Calculate waste types distribution
      const wasteTypesCount = {}
      reports.forEach(report => {
        const type = report.waste_type || 'unknown'
        wasteTypesCount[type] = (wasteTypesCount[type] || 0) + 1
      })
      
      const wasteTypesArray = Object.entries(wasteTypesCount).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize
        count,
        percentage: Math.round((count / total) * 100) || 0
      }))
      
      setWasteTypes(wasteTypesArray.sort((a, b) => b.count - a.count))
      
      // Calculate top locations
      const locationsCount = {}
      reports.forEach(report => {
        if (report.address) {
          // Extract city or area from address
          const addressParts = report.address.split(',')
          const location = addressParts.length > 1 ? addressParts[addressParts.length - 2].trim() : report.address
          locationsCount[location] = (locationsCount[location] || 0) + 1
        }
      })
      
      const locationsArray = Object.entries(locationsCount).map(([location, count]) => ({
        location,
        count
      }))
      
      setTopLocations(locationsArray.sort((a, b) => b.count - a.count).slice(0, 5))
      
      // Calculate average rating
      const completedWithRating = reports.filter(r => r.status === 'completed' && r.rating)
      const totalRating = completedWithRating.reduce((sum, report) => sum + report.rating, 0)
      const avgRating = completedWithRating.length > 0 ? (totalRating / completedWithRating.length).toFixed(1) : 0
      
      setAverageRating(avgRating)
      
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusPercentage = (statusCount) => {
    return stats.total > 0 ? Math.round((statusCount / stats.total) * 100) : 0
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">Analytics Dashboard</h1>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                timeframe === 'week' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                timeframe === 'month' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeframe('year')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                timeframe === 'year' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              This Year
            </button>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Reports</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-yellow-800">Pending</p>
            <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
            <p className="text-xs text-yellow-600">{getStatusPercentage(stats.pending)}% of total</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-blue-800">Assigned</p>
            <p className="text-2xl font-bold text-blue-800">{stats.assigned}</p>
            <p className="text-xs text-blue-600">{getStatusPercentage(stats.assigned)}% of total</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-purple-800">In Progress</p>
            <p className="text-2xl font-bold text-purple-800">{stats.inProgress}</p>
            <p className="text-xs text-purple-600">{getStatusPercentage(stats.inProgress)}% of total</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-green-800">Completed</p>
            <p className="text-2xl font-bold text-green-800">{stats.completed}</p>
            <p className="text-xs text-green-600">{getStatusPercentage(stats.completed)}% of total</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-red-800">Rejected</p>
            <p className="text-2xl font-bold text-red-800">{stats.rejected}</p>
            <p className="text-xs text-red-600">{getStatusPercentage(stats.rejected)}% of total</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Waste Types Distribution */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <FaChartBar className="text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold">Waste Types</h2>
            </div>
            
            {wasteTypes.length > 0 ? (
              <div className="space-y-4">
                {wasteTypes.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.type}</span>
                      <span className="font-medium">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary-600 h-2.5 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </div>
          
          {/* Top Locations */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <FaMapMarkerAlt className="text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold">Top Locations</h2>
            </div>
            
            {topLocations.length > 0 ? (
              <div className="space-y-3">
                {topLocations.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{item.location}</span>
                    <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {item.count} reports
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No location data available</p>
            )}
          </div>
          
          {/* User Satisfaction */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <FaStar className="text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold">User Satisfaction</h2>
            </div>
            
            <div className="flex flex-col items-center justify-center py-4">
              <div className="text-5xl font-bold text-primary-600 mb-2">{averageRating}</div>
              <div className="flex mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg 
                    key={star}
                    className={`w-6 h-6 ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                Average rating from {stats.completed} completed reports
              </p>
            </div>
          </div>
        </div>
        
        {/* Time Period Info */}
        <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
          <FaCalendarAlt className="mr-2" />
          <span>
            {timeframe === 'week' && 'Showing data for the last 7 days'}
            {timeframe === 'month' && 'Showing data for the current month'}
            {timeframe === 'year' && 'Showing data for the current year'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Analytics