'use client'

import { useEffect, useState, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload, Paperclip, X } from 'lucide-react'

// Define the structure of a Habit
interface Habit {
  id: string
  title: string
  description: string
  type: 'Personal' | 'Shareable'
  category: {
    id: string
    name: string
    icon: string
  }
}

export default function TrackPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<Set<string>>(new Set())
  
  // State to hold selected files, mapping habit.id -> File
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File }>({})
  
  // State for image preview URLs, mapping habit.id -> URL
  const [previews, setPreviews] = useState<{ [key: string]: string }>({})

  const router = useRouter()

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken')
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  // Fetch all habits for the user
  const fetchHabits = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/habits/?page=1&limit=20', { headers: getAuthHeaders() })
      if (!res.ok) {
        if (res.status === 401) router.push('/auth')
        else toast.error('Failed to fetch habits')
        return
      }
      const data = await res.json()
      setHabits(data.habits || [])
    } catch (err) {
      console.error(err)
      toast.error('Error fetching habits')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHabits()
    // Cleanup object URLs on unmount to prevent memory leaks
    return () => {
      Object.values(previews).forEach(URL.revokeObjectURL)
    }
  }, [])

  // Handle file selection and create a preview
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, habitId: string) => {
    const file = e.target.files?.[0]
    if (file) {
      if (previews[habitId]) URL.revokeObjectURL(previews[habitId])
      setSelectedFiles(prev => ({ ...prev, [habitId]: file }))
      setPreviews(prev => ({ ...prev, [habitId]: URL.createObjectURL(file) }))
    }
  }

  // Clear the selected file and its preview for a specific habit
  const clearFileSelection = (habitId: string) => {
    if (previews[habitId]) URL.revokeObjectURL(previews[habitId])
    const newFiles = { ...selectedFiles }; delete newFiles[habitId]
    const newPreviews = { ...previews }; delete newPreviews[habitId]
    setSelectedFiles(newFiles)
    setPreviews(newPreviews)
  }
  
  // Upload to Cloudinary
  const uploadImage = async (file: File): Promise<string | null> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error("Cloudinary environment variables are not set. Check your .env.local file and restart the server.");
      toast.error("Image upload is not configured correctly.");
      return null;
    }
    const data = new FormData()
    data.append('file', file)
    data.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET!)

    try {
      toast.info('Uploading image...')
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: data }
      )
      const resData = await res.json()
      if (!res.ok || resData.error) throw new Error(resData.error?.message || 'Cloudinary upload failed')
      
      toast.success('Image uploaded!')
      return resData.secure_url
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Upload failed')
      return null
    }
  }

  // Handle completion logic
  const handleComplete = async (habit: Habit) => {
    if (processing.has(habit.id)) return
    
    const file = selectedFiles[habit.id];
    if (habit.type === 'Shareable' && !file) {
      toast.error('Please select an image to share.')
      return
    }

    setProcessing(prev => new Set(prev).add(habit.id))

    try {
      let imageUrl: string | undefined

      if (habit.type === 'Shareable' && file) {
        const uploadedUrl = await uploadImage(file)
        if (!uploadedUrl) return // Upload failed, toast is shown in uploadImage
        imageUrl = uploadedUrl
      }

      const res = await fetch(`/api/habits/${habit.id}/complete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ publishAsAtom: habit.type === 'Shareable', image: imageUrl }),
      })

      if (!res.ok) {
         const errorData = await res.json();
         throw new Error(errorData.message || 'Completion failed');
      }

      toast.success(`'${habit.title}' marked as done!`)
      clearFileSelection(habit.id) // Clear selection on success
      await fetchHabits()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to complete habit')
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev); newSet.delete(habit.id)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 max-w-3xl mx-auto space-y-4">
      {habits.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No habits yet. Add some on the dashboard!</p>
          </CardContent>
        </Card>
      ) : (
        habits.map((habit) => (
          <Card key={habit.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{habit.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{habit.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
                   <Badge variant="secondary">{habit.category.name}</Badge>
                   <Badge variant={habit.type === 'Shareable' ? 'default' : 'outline'}>{habit.type}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {habit.type === 'Shareable' ? (
                <div className="space-y-4">
                  {previews[habit.id] ? (
                    <div className="relative group w-full aspect-video rounded-md overflow-hidden border">
                      <img src={previews[habit.id]} alt="Preview" className="w-full h-full object-cover"/>
                      <div className="absolute top-2 right-2">
                        <Button 
                          size="icon" 
                          variant="destructive" 
                          className="h-7 w-7 opacity-70 group-hover:opacity-100 transition-opacity"
                          onClick={() => clearFileSelection(habit.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor={`file-upload-${habit.id}`} className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                      <Paperclip className="h-6 w-6 text-gray-400" />
                      <span className="mt-2 text-sm text-gray-600">Click to upload proof</span>
                      <input id={`file-upload-${habit.id}`} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, habit.id)} />
                    </label>
                  )}
                  
                  <Button
                    onClick={() => handleComplete(habit)}
                    disabled={processing.has(habit.id) || !selectedFiles[habit.id]}
                    className="w-full"
                  >
                    {processing.has(habit.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <> <Upload className="h-4 w-4 mr-2" /> Share & Complete </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleComplete(habit)}
                  disabled={processing.has(habit.id)}
                  className="w-full"
                >
                  {processing.has(habit.id) ? ( <Loader2 className="h-4 w-4 animate-spin" /> ) : 'Mark as Done' }
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}