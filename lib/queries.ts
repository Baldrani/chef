import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { apiRequest } from "./api-client"

// Query Keys - centralized for consistency
export const queryKeys = {
  trips: ['trips'] as const,
  trip: (tripId: string) => ['trips', tripId] as const,
  participants: (tripId: string) => ['participants', tripId] as const,
  mealSlots: (tripId: string) => ['mealSlots', tripId] as const,
  inviteInfo: (token: string) => ['inviteInfo', token] as const,
  unassociatedParticipants: (token: string) => ['unassociatedParticipants', token] as const,
}

// Types
type Trip = {
  id: string
  name: string
  startDate: string
  endDate: string
  createdBy?: string
  defaultBreakfastTime?: string
  defaultLunchTime?: string
  defaultDinnerTime?: string
}

type Participant = {
  id: string
  name: string
  email?: string
  cookingPreference: number
  dietaryRestrictions?: string
  tripId: string
  user?: {
    id: string
    name: string
    email: string
  } | null
}

type MealSlot = {
  id: string
  date: string
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER'
  assignments: Array<{
    participant: Participant
    role: 'COOK' | 'HELPER'
  }>
  recipes?: Array<{
    recipe: {
      id: string
      title: string
    }
  }>
}

// Utility function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  return response.json()
}

// Query Hooks
export function useTrips() {
  return useQuery({
    queryKey: queryKeys.trips,
    queryFn: async () => {
      const response = await apiRequest('/api/trips')
      return handleApiResponse<Trip[]>(response)
    },
  })
}

export function useTrip(tripId: string) {
  return useQuery({
    queryKey: queryKeys.trip(tripId),
    queryFn: async () => {
      const response = await apiRequest(`/api/trips/${tripId}`)
      return handleApiResponse<Trip>(response)
    },
    enabled: !!tripId,
  })
}

export function useParticipants(tripId: string) {
  return useQuery({
    queryKey: queryKeys.participants(tripId),
    queryFn: async () => {
      const response = await apiRequest(`/api/participants?tripId=${tripId}`)
      return handleApiResponse<Participant[]>(response)
    },
    enabled: !!tripId,
  })
}

export function useMealSlots(tripId: string) {
  return useQuery({
    queryKey: queryKeys.mealSlots(tripId),
    queryFn: async () => {
      const response = await apiRequest(`/api/trips/${tripId}/schedule`)
      return handleApiResponse<MealSlot[]>(response)
    },
    enabled: !!tripId,
  })
}

export function useInviteInfo(token: string) {
  return useQuery({
    queryKey: queryKeys.inviteInfo(token),
    queryFn: async () => {
      const response = await apiRequest(`/api/invites/${token}`)
      return handleApiResponse<{ trip: Trip }>(response)
    },
    enabled: !!token,
  })
}

export function useUnassociatedParticipants(token: string) {
  return useQuery({
    queryKey: queryKeys.unassociatedParticipants(token),
    queryFn: async () => {
      const response = await apiRequest(`/api/invites/${token}/participants`)
      return handleApiResponse<{ participants: Participant[] }>(response)
    },
    enabled: !!token,
  })
}

// Mutation Hooks
export function useUpdateTrip() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: string; data: Partial<Trip> }) => {
      const response = await apiRequest(`/api/trips/${tripId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return handleApiResponse<Trip>(response)
    },
    onSuccess: (updatedTrip) => {
      // Update the specific trip cache
      queryClient.setQueryData(queryKeys.trip(updatedTrip.id), updatedTrip)
      // Invalidate trips list to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.trips })
      toast.success('Trip updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update trip')
    },
  })
}

export function useAssociateParticipant() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ token, participantId }: { token: string; participantId: string }) => {
      const response = await apiRequest(`/api/invites/${token}/associate`, {
        method: 'POST',
        body: JSON.stringify({ participantId }),
      })
      return handleApiResponse<Participant>(response)
    },
    onSuccess: (result, { token }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.unassociatedParticipants(token) })
      queryClient.invalidateQueries({ queryKey: queryKeys.participants(result.tripId) })
      toast.success('Successfully associated with participant')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to associate participant')
    },
  })
}

export function useDisassociateParticipant() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (participantId: string) => {
      const response = await apiRequest(`/api/participants/${participantId}/disassociate`, {
        method: 'POST',
      })
      return handleApiResponse<{ success: boolean; participant: Participant }>(response)
    },
    onSuccess: (result) => {
      // Invalidate participants query for this trip
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.participants(result.participant.tripId) 
      })
      toast.success('User disassociated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disassociate user')
    },
  })
}

export function useCreateParticipant() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      token, 
      data 
    }: { 
      token: string
      data: {
        name: string
        email?: string
        cookingPreference: number
        availability: string[]
      }
    }) => {
      const response = await apiRequest(`/api/invites/${token}/accept`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return handleApiResponse<Participant>(response)
    },
    onSuccess: (participant, { token }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.unassociatedParticipants(token) })
      queryClient.invalidateQueries({ queryKey: queryKeys.participants(participant.tripId) })
      toast.success('Participant created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create participant')
    },
  })
}

export function useAssignParticipantToMeal() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      mealSlotId, 
      participantId, 
      role 
    }: { 
      mealSlotId: string
      participantId: string
      role: 'COOK' | 'HELPER'
    }) => {
      const response = await apiRequest(`/api/meals/${mealSlotId}/participants/${participantId}`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      })
      return handleApiResponse<unknown>(response)
    },
    onSuccess: () => {
      // We need to get the tripId to invalidate the right query
      // For now, invalidate all meal slot queries (can be optimized later)
      queryClient.invalidateQueries({ 
        queryKey: ['mealSlots'],
        type: 'all'
      })
      toast.success('Participant assigned successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign participant')
    },
  })
}

export function useRemoveParticipantFromMeal() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      mealSlotId, 
      participantId 
    }: { 
      mealSlotId: string
      participantId: string
    }) => {
      const response = await apiRequest(`/api/meals/${mealSlotId}/participants/${participantId}`, {
        method: 'DELETE',
      })
      return handleApiResponse<unknown>(response)
    },
    onSuccess: () => {
      // Invalidate all meal slot queries
      queryClient.invalidateQueries({ 
        queryKey: ['mealSlots'],
        type: 'all'
      })
      toast.success('Assignment removed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove assignment')
    },
  })
}

export function useDeleteMeal() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (mealSlotId: string) => {
      const response = await apiRequest(`/api/meals/${mealSlotId}`, {
        method: 'DELETE',
      })
      return handleApiResponse<unknown>(response)
    },
    onSuccess: () => {
      // Invalidate all meal slot queries
      queryClient.invalidateQueries({ 
        queryKey: ['mealSlots'],
        type: 'all'
      })
      toast.success('Meal removed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove meal')
    },
  })
}