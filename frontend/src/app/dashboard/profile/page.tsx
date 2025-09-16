// src/app/dashboard/profile/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// A simple component to fetch the current user's ID and redirect.
export default function MyProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserAndRedirect = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          router.replace('/auth')
          return
        }

        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user?.id) {
            // Redirect to the dynamic page with the user's ID
            router.replace(`/dashboard/profile/${data.user.id}`)
          } else {
            router.replace('/auth')
          }
        } else {
           router.replace('/auth')
        }
      } catch (error) {
        console.error('Failed to fetch current user for redirect:', error)
        router.replace('/auth')
      }
    }

    fetchUserAndRedirect()
  }, [router])

  // Display a loader while we determine the redirect URL
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )
}