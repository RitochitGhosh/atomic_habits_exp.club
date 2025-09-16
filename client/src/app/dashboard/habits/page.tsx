'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Plus,
    Edit3,
    Trash2,
    Calendar,
    Clock,
    Target,
    Filter,
    Loader2,
    Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Category {
    id: string
    name: string
    icon: string
    isDefault: boolean
    userId?: string | null
    _count?: {
        habits: number
    }
}

interface Habit {
    id: string
    title: string
    description?: string | null
    category: {
        id: string
        name: string
        icon: string
    }
    type: 'Personal' | 'Shareable'
    occurrence: 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'once_weekly' | 'biweekly' | 'twice_weekly'
    slot: 'Morning' | 'Afternoon' | 'Evening' | 'Night'
    startDate: string
    endDate?: string | null
    isActive: boolean
    _count?: {
        completions: number
        atoms: number
    }
}

const OCCURRENCE_OPTIONS = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'weekdays', label: 'Weekdays' },
    { value: 'weekends', label: 'Weekends' },
    { value: 'once_weekly', label: 'Once Weekly' },
    { value: 'biweekly', label: 'Biweekly' },
    { value: 'twice_weekly', label: 'Twice Weekly' }
]

const SLOT_OPTIONS = [
    { value: 'Morning', label: 'Morning', icon: '🌅' },
    { value: 'Afternoon', label: 'Afternoon', icon: '☀️' },
    { value: 'Evening', label: 'Evening', icon: '🌆' },
    { value: 'Night', label: 'Night', icon: '🌙' }
]

const TYPE_OPTIONS = [
    { value: 'Personal', label: 'Personal', description: 'Private habit, only visible to you' },
    { value: 'Shareable', label: 'Shareable', description: 'Can be shared publicly when completed' }
]

export default function HabitsPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [habits, setHabits] = useState<Habit[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [_, setExpandedCategories] = useState<Set<string>>(new Set())

    // Dialog states
    const [showCategoryDialog, setShowCategoryDialog] = useState(false)
    const [showHabitDialog, setShowHabitDialog] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null)

    // Form states
    const [categoryForm, setCategoryForm] = useState({ name: '', icon: '' })
    const [habitForm, setHabitForm] = useState({
        title: '',
        description: '',
        categoryId: '',
        type: 'Personal' as 'Personal' | 'Shareable',
        occurrence: 'daily' as string,
        slot: 'Morning' as string,
        startDate: new Date(),
        endDate: undefined as Date | undefined
    })

    // Loading states
    const [submitting, setSubmitting] = useState(false)
    const [deletingCategory, setDeletingCategory] = useState<string | null>(null)
    const [deletingHabit, setDeletingHabit] = useState<string | null>(null)

    const router = useRouter()

    const getAuthHeaders = () => {
        const token = localStorage.getItem('accessToken')
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    }

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories/', {
                headers: getAuthHeaders()
            })

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/auth')
                    return
                }
                throw new Error('Failed to fetch categories')
            }

            const data = await response.json()
            const categoriesData = data.categories || []
            setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        } catch (error) {
            console.error('Categories fetch error:', error)
            toast.error('Failed to load categories')
        }
    }

    const fetchHabits = async (categoryId?: string) => {
        try {
            let url = '/api/habits/'
            const params = new URLSearchParams()

            if (categoryId) {
                params.append('categoryId', categoryId)
            }

            if (params.toString()) {
                url += `?${params.toString()}`
            }

            const response = await fetch(url, {
                headers: getAuthHeaders()
            })

            if (!response.ok) {
                throw new Error('Failed to fetch habits')
            }

            const data = await response.json()
            const habitsData = data.habits || []
            setHabits(Array.isArray(habitsData) ? habitsData : [])
        } catch (error) {
            console.error('Habits fetch error:', error)
            toast.error('Failed to load habits')
        }
    }

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            await fetchCategories()
            await fetchHabits()
            setLoading(false)
        }

        loadData()
    }, [])

    useEffect(() => {
        if (selectedCategory) {
            fetchHabits(selectedCategory)
        } else {
            fetchHabits()
        }
    }, [selectedCategory])

    const handleCreateCategory = async () => {
        if (!categoryForm.name.trim() || !categoryForm.icon.trim()) {
            toast.error('Please fill in all fields')
            return
        }

        setSubmitting(true)
        try {
            const response = await fetch('/api/categories/', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: categoryForm.name.trim(),
                    icon: categoryForm.icon.trim()
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to create category')
            }

            const data = await response.json()
            setCategories(prev => [...prev, data.category])
            setCategoryForm({ name: '', icon: '' })
            setShowCategoryDialog(false)
            toast.success('Category created successfully')
        } catch (error) {
            console.error('Create category error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to create category')
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdateCategory = async () => {
        if (!editingCategory || !categoryForm.name.trim() || !categoryForm.icon.trim()) {
            toast.error('Please fill in all fields')
            return
        }

        setSubmitting(true)
        try {
            const response = await fetch(`/api/categories/${editingCategory.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: categoryForm.name.trim(),
                    icon: categoryForm.icon.trim()
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to update category')
            }

            const data = await response.json()
            setCategories(prev => prev.map(cat =>
                cat.id === editingCategory.id ? data.category : cat
            ))
            setCategoryForm({ name: '', icon: '' })
            setEditingCategory(null)
            setShowCategoryDialog(false)
            toast.success('Category updated successfully')
        } catch (error) {
            console.error('Update category error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to update category')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteCategory = async (categoryId: string) => {
        setDeletingCategory(categoryId)
        try {
            const response = await fetch(`/api/categories/${categoryId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to delete category')
            }

            setCategories(prev => prev.filter(cat => cat.id !== categoryId))
            if (selectedCategory === categoryId) {
                setSelectedCategory(null)
            }
            toast.success('Category deleted successfully')
        } catch (error) {
            console.error('Delete category error:', error)
            toast.error(error instanceof Error ? error.message : 'Cannot delete category with existing habits')
        } finally {
            setDeletingCategory(null)
        }
    }

    const handleCreateHabit = async () => {
        if (!habitForm.title.trim() || !habitForm.categoryId) {
            toast.error('Please fill in all required fields')
            return
        }

        setSubmitting(true)
        try {
            const payload = {
                title: habitForm.title.trim(),
                description: habitForm.description.trim() || undefined,
                categoryId: habitForm.categoryId,
                type: habitForm.type,
                occurrence: habitForm.occurrence,
                slot: habitForm.slot,
                startDate: habitForm.startDate.toISOString(),
                endDate: habitForm.endDate?.toISOString() || undefined
            }

            const response = await fetch('/api/habits/', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to create habit')
            }

            const data = await response.json()
            setHabits(prev => [...prev, data.habit])
            resetHabitForm()
            setShowHabitDialog(false)
            toast.success('Habit created successfully')
        } catch (error) {
            console.error('Create habit error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to create habit')
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdateHabit = async () => {
        if (!editingHabit || !habitForm.title.trim()) {
            toast.error('Please fill in all required fields')
            return
        }

        setSubmitting(true)
        try {
            const payload = {
                title: habitForm.title.trim(),
                description: habitForm.description.trim() || undefined,
                categoryId: habitForm.categoryId,
                type: habitForm.type,
                occurrence: habitForm.occurrence,
                slot: habitForm.slot,
                startDate: habitForm.startDate.toISOString(),
                endDate: habitForm.endDate?.toISOString() || undefined
            }

            const response = await fetch(`/api/habits/${editingHabit.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to update habit')
            }

            const data = await response.json()
            setHabits(prev => prev.map(habit =>
                habit.id === editingHabit.id ? data.habit : habit
            ))
            resetHabitForm()
            setEditingHabit(null)
            setShowHabitDialog(false)
            toast.success('Habit updated successfully')
        } catch (error) {
            console.error('Update habit error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to update habit')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteHabit = async (habitId: string) => {
        setDeletingHabit(habitId)
        try {
            const response = await fetch(`/api/habits/${habitId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to delete habit')
            }

            setHabits(prev => prev.filter(habit => habit.id !== habitId))
            toast.success('Habit deleted successfully')
        } catch (error) {
            console.error('Delete habit error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to delete habit')
        } finally {
            setDeletingHabit(null)
        }
    }

    const resetHabitForm = () => {
        setHabitForm({
            title: '',
            description: '',
            categoryId: '',
            type: 'Personal',
            occurrence: 'daily',
            slot: 'Morning',
            startDate: new Date(),
            endDate: undefined
        })
    }

    const openEditCategory = (category: Category) => {
        setEditingCategory(category)
        setCategoryForm({ name: category.name, icon: category.icon })
        setShowCategoryDialog(true)
    }

    const openEditHabit = (habit: Habit) => {
        setEditingHabit(habit)
        setHabitForm({
            title: habit.title,
            description: habit.description || '',
            categoryId: habit.category.id,
            type: habit.type,
            occurrence: habit.occurrence,
            slot: habit.slot,
            startDate: new Date(habit.startDate),
            endDate: habit.endDate ? new Date(habit.endDate) : undefined
        })
        setShowHabitDialog(true)
    }

    const toggleCategoryExpansion = (categoryId: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev)
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId)
            } else {
                newSet.add(categoryId)
            }
            return newSet
        })
    }

    const filteredHabits = selectedCategory
        ? habits.filter(habit => habit.category.id === selectedCategory)
        : habits

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Habits</h1>
                        <p className="text-gray-600">Manage your categories and habits</p>
                    </div>
                    <div className="flex space-x-3">
                        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline" onClick={() => {
                                    setEditingCategory(null)
                                    setCategoryForm({ name: '', icon: '' })
                                }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Category
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingCategory ? 'Edit Category' : 'Create New Category'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {editingCategory ? 'Update your category details' : 'Add a new category to organize your habits'}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="category-name">Category Name</Label>
                                        <Input
                                            id="category-name"
                                            value={categoryForm.name}
                                            onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., Fitness, Learning, Health"
                                            maxLength={50}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="category-icon">Icon (Emoji or Text)</Label>
                                        <Input
                                            id="category-icon"
                                            value={categoryForm.icon}
                                            onChange={(e) => setCategoryForm(prev => ({ ...prev, icon: e.target.value }))}
                                            placeholder="e.g., 💪, 📚, 🏃"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                                        disabled={submitting}
                                    >
                                        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        {editingCategory ? 'Update Category' : 'Create Category'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={showHabitDialog} onOpenChange={setShowHabitDialog}>
                            <DialogTrigger asChild>
                                <Button onClick={() => {
                                    setEditingHabit(null)
                                    resetHabitForm()
                                }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Habit
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingHabit ? 'Edit Habit' : 'Create New Habit'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {editingHabit ? 'Update your habit details' : 'Set up a new habit to track your progress'}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    <div>
                                        <Label htmlFor="habit-title">Habit Title*</Label>
                                        <Input
                                            id="habit-title"
                                            value={habitForm.title}
                                            onChange={(e) => setHabitForm(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder="e.g., Morning workout, Read 30 minutes"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="habit-description">Description</Label>
                                        <Textarea
                                            id="habit-description"
                                            value={habitForm.description}
                                            onChange={(e: any) => setHabitForm(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Optional description of your habit"
                                            rows={2}
                                        />
                                    </div>

                                    <div>
                                        <Label>Category*</Label>
                                        <Select value={habitForm.categoryId} onValueChange={(value: any) =>
                                            setHabitForm(prev => ({ ...prev, categoryId: value }))
                                        }>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map(category => (
                                                    <SelectItem key={category.id} value={category.id}>
                                                        <span className="mr-2">{category.icon}</span>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Habit Type</Label>
                                        <Select value={habitForm.type} onValueChange={(value: 'Personal' | 'Shareable') =>
                                            setHabitForm(prev => ({ ...prev, type: value }))
                                        }>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TYPE_OPTIONS.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        <div>
                                                            <div className="font-medium">{option.label}</div>
                                                            <div className="text-xs text-gray-500">{option.description}</div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Occurrence</Label>
                                        <Select value={habitForm.occurrence} onValueChange={(value: any) =>
                                            setHabitForm(prev => ({ ...prev, occurrence: value }))
                                        }>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {OCCURRENCE_OPTIONS.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Time Slot</Label>
                                        <Select value={habitForm.slot} onValueChange={(value: any) =>
                                            setHabitForm(prev => ({ ...prev, slot: value }))
                                        }>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SLOT_OPTIONS.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        <span className="mr-2">{option.icon}</span>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Start Date*</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left">
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    {format(habitForm.startDate, 'PPP')}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={habitForm.startDate}
                                                    onSelect={(date: Date | undefined) =>
                                                        date && setHabitForm(prev => ({ ...prev, startDate: date }))
                                                    }
                                                    initialFocus
                                                    required={false}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div>
                                        <Label>End Date (Optional)</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left">
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    {habitForm.endDate ? format(habitForm.endDate, 'PPP') : 'No end date'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={habitForm.endDate}
                                                    onSelect={(date: Date | undefined) => setHabitForm(prev => ({ ...prev, endDate: date }))}
                                                    disabled={(date: Date) => date < habitForm.startDate}
                                                    initialFocus
                                                />
                                                <div className="p-3 border-t">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setHabitForm(prev => ({ ...prev, endDate: undefined }))}
                                                        className="w-full"
                                                    >
                                                        Clear End Date
                                                    </Button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowHabitDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={editingHabit ? handleUpdateHabit : handleCreateHabit}
                                        disabled={submitting}
                                    >
                                        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        {editingHabit ? 'Update Habit' : 'Create Habit'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Categories Sidebar */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center">
                                    <Filter className="h-5 w-5 mr-2" />
                                    Categories
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="space-y-1">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${!selectedCategory ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">All Habits</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {habits.length}
                                            </Badge>
                                        </div>
                                    </button>
                                    {categories.map(category => (
                                        <div key={category.id}>
                                            <div className={`flex items-center hover:bg-gray-50 ${selectedCategory === category.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                                                }`}>
                                                <button
                                                    onClick={() => setSelectedCategory(category.id)}
                                                    className="flex-1 text-left px-4 py-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <span>{category.icon}</span>
                                                            <span className="font-medium">{category.name}</span>
                                                        </div>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {category._count?.habits || 0}
                                                        </Badge>
                                                    </div>
                                                </button>
                                                {!category.isDefault && (
                                                    <div className="flex items-center px-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => openEditCategory(category)}
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            <Edit3 className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDeleteCategory(category.id)}
                                                            disabled={deletingCategory === category.id}
                                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                        >
                                                            {deletingCategory === category.id ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-3 w-3" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Habits List */}
                    <div className="lg:col-span-3">
                        {filteredHabits.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                    <h3 className="font-semibold text-gray-900 mb-2">No habits yet</h3>
                                    <p className="text-gray-600 mb-4">
                                        {selectedCategory
                                            ? 'No habits found in this category. Create your first habit!'
                                            : 'Start building healthy habits by creating your first one.'
                                        }
                                    </p>
                                    <Button onClick={() => setShowHabitDialog(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Your First Habit
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {filteredHabits.map(habit => (
                                    <Card key={habit.id}>
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-3">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-lg">{habit.category.icon}</span>
                                                            <h3 className="font-semibold text-lg">{habit.title}</h3>
                                                        </div>
                                                        <Badge variant={habit.isActive ? 'default' : 'secondary'}>
                                                            {habit.isActive ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                        <Badge variant="outline">
                                                            {habit.type}
                                                        </Badge>
                                                    </div>

                                                    {habit.description && (
                                                        <p className="text-gray-600 mb-3">{habit.description}</p>
                                                    )}

                                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                        <div className="flex items-center space-x-1">
                                                            <Clock className="h-4 w-4" />
                                                            <span>{OCCURRENCE_OPTIONS.find(o => o.value === habit.occurrence)?.label}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <span>{SLOT_OPTIONS.find(s => s.value === habit.slot)?.icon}</span>
                                                            <span>{habit.slot}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <Calendar className="h-4 w-4" />
                                                            <span>
                                                                {format(new Date(habit.startDate), 'MMM d, yyyy')}
                                                                {habit.endDate && ` - ${format(new Date(habit.endDate), 'MMM d, yyyy')}`}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {habit._count && (
                                                        <div className="flex items-center space-x-4 mt-3">
                                                            <div className="flex items-center space-x-1 text-sm text-green-600">
                                                                <Check className="h-4 w-4" />
                                                                <span>{habit._count.completions || 0} completions</span>
                                                            </div>
                                                            {habit.type === 'Shareable' && habit._count.atoms !== undefined && (
                                                                <div className="flex items-center space-x-1 text-sm text-blue-600">
                                                                    <Target className="h-4 w-4" />
                                                                    <span>{habit._count.atoms} atoms shared</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openEditHabit(habit)}
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDeleteHabit(habit.id)}
                                                        disabled={deletingHabit === habit.id}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        {deletingHabit === habit.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}