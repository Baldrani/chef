import { prisma } from "./prisma"

export interface CreateUserTripOptions {
  userId: string
  tripName: string
  startDate: Date
  endDate: Date
}

export interface JoinTripAsParticipantOptions {
  userId: string
  tripId: string
  participantName?: string
  cookingPreference?: number
}

/**
 * Creates a new trip and associates it with a user as the creator
 */
export async function createTripForUser({ userId, tripName, startDate, endDate }: CreateUserTripOptions) {
  return await prisma.trip.create({
    data: {
      name: tripName,
      startDate,
      endDate,
      createdBy: userId,
    },
    include: {
      creator: true,
      participants: true,
      mealSlots: true,
    },
  })
}

/**
 * Joins a user to a trip as a participant
 * Creates or links an existing participant record to the user
 */
export async function joinTripAsParticipant({ 
  userId, 
  tripId, 
  participantName, 
  cookingPreference = 0 
}: JoinTripAsParticipantOptions) {
  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  
  if (!user) {
    throw new Error("User not found")
  }

  // Check if user is already a participant in this trip
  const existingParticipant = await prisma.participant.findFirst({
    where: {
      tripId,
      userId,
    },
  })

  if (existingParticipant) {
    return existingParticipant
  }

  // Create new participant linked to the user
  return await prisma.participant.create({
    data: {
      tripId,
      userId,
      name: participantName || user.name || user.email?.split("@")[0] || "Anonymous",
      cookingPreference,
    },
    include: {
      user: true,
      trip: true,
    },
  })
}

/**
 * Gets all trips associated with a user (as creator or participant)
 */
export async function getUserTrips(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      trips: {
        include: {
          participants: true,
          mealSlots: {
            include: {
              assignments: {
                include: {
                  participant: true,
                },
              },
            },
          },
        },
      },
      participants: {
        include: {
          trip: {
            include: {
              participants: true,
              mealSlots: {
                include: {
                  assignments: {
                    include: {
                      participant: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user) {
    return { createdTrips: [], participatingTrips: [] }
  }

  return {
    createdTrips: user.trips,
    participatingTrips: user.participants.map(p => p.trip),
  }
}

/**
 * Checks if a user has access to a trip (as creator or participant)
 */
export async function userHasAccessToTrip(userId: string, tripId: string): Promise<boolean> {
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      OR: [
        { createdBy: userId },
        { participants: { some: { userId } } },
      ],
    },
  })

  return !!trip
}