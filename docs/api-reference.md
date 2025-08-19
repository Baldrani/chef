# API Reference

This document provides comprehensive reference for all API endpoints in the Chef application.

## Authentication

All API endpoints require proper authentication through NextAuth.js session management.

## Base URL

Development: `http://localhost:3000/api`
Production: `https://your-domain.com/api`

## Endpoints Overview

### Trip Management

#### GET /api/trips
Get all trips for the authenticated user.

**Response:**
```json
[
  {
    "id": "string",
    "name": "string", 
    "startDate": "ISO date",
    "endDate": "ISO date",
    "description": "string",
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
]
```

#### POST /api/trips
Create a new trip.

**Request Body:**
```json
{
  "name": "string",
  "startDate": "ISO date",
  "endDate": "ISO date", 
  "description": "string (optional)"
}
```

#### GET /api/trips/[tripId]
Get specific trip details.

#### PUT /api/trips/[tripId]
Update trip information.

#### DELETE /api/trips/[tripId]
Delete a trip and all associated data.

### Participant Management

#### GET /api/participants?tripId=string
Get all participants for a trip.

#### POST /api/participants
Create a new participant.

**Request Body:**
```json
{
  "tripId": "string",
  "name": "string",
  "email": "string (optional)",
  "cookingPreference": "number (-2 to +2)",
  "dietaryRestrictions": "string (optional)"
}
```

#### PUT /api/participants/[participantId]
Update participant information.

#### DELETE /api/participants/[participantId] 
Remove participant from trip.

### Meal Slot Management

#### GET /api/trips/[tripId]/meals
Get all meal slots for a trip.

#### POST /api/trips/[tripId]/meals
Create new meal slots.

**Request Body:**
```json
{
  "date": "ISO date",
  "mealTypes": ["BREAKFAST", "LUNCH", "DINNER"]
}
```

#### GET /api/meals/[mealSlotId]
Get specific meal slot details with assignments.

#### DELETE /api/meals/[mealSlotId]
Delete meal slot and all assignments.

### Assignment Management

#### POST /api/meals/[mealSlotId]/participants/[participantId]
Assign participant to meal slot.

**Request Body:**
```json
{
  "role": "COOK" | "HELPER"
}
```

#### DELETE /api/meals/[mealSlotId]/participants/[participantId]
Remove participant assignment from meal slot.

### Recipe Management

#### GET /api/recipes?tripId=string
Get all recipes for a trip.

#### POST /api/recipes
Create a new recipe.

**Request Body:**
```json
{
  "tripId": "string",
  "title": "string",
  "notes": "string (optional)",
  "mealSlotId": "string (optional)" // Auto-assign to meal
}
```

#### PUT /api/recipes/[recipeId]
Update recipe information.

#### DELETE /api/recipes/[recipeId]
Delete recipe.

#### POST /api/meals/[mealSlotId]/recipes/[recipeId]
Assign recipe to meal slot.

#### DELETE /api/meals/[mealSlotId]/recipes/[recipeId]
Remove recipe from meal slot.

### Schedule Generation

#### POST /api/schedule/generate
Run the intelligent scheduling algorithm.

**Request Body:**
```json
{
  "tripId": "string",
  "maxCooksPerMeal": "number (1-6, default: 2)",
  "maxHelpersPerMeal": "number (0-6, default: 0)",
  "avoidConsecutive": "boolean (default: true)",
  "autoAssignRecipes": "boolean (default: false)",
  "recipesPerMeal": "number (1-5, default: 1)",
  "prioritizeEqualParticipation": "boolean (default: false)"
}
```

**Response:**
```json
{
  "ok": true,
  "assignedParticipants": "number",
  "addedRecipeAssignments": "number",
  "stats": [
    {
      "name": "string",
      "targetAssignments": "number",
      "finalAssignments": "number", 
      "presenceRatio": "number"
    }
  ]
}
```

### Invitation System

#### GET /api/trips/[tripId]/invites
Get all invites for a trip.

#### POST /api/trips/[tripId]/invites
Create trip invitation.

**Request Body:**
```json
{
  "email": "string (optional)",
  "expiresAt": "ISO date (optional)",
  "maxUses": "number (optional)"
}
```

#### GET /api/invites/[token]
Get invitation details by token.

#### POST /api/invites/[token]/accept
Accept invitation and join trip.

**Request Body:**
```json
{
  "name": "string",
  "email": "string (optional)",
  "cookingPreference": "number (-2 to +2)"
}
```

### Day Management  

#### DELETE /api/trips/[tripId]/day/[date]/clear
Clear all meal slots for a specific date.

### Schedule Export

#### GET /api/trips/[tripId]/schedule
Get trip schedule data.

#### GET /api/trips/[tripId]/schedule/ics
Export schedule as iCalendar (.ics) file.

## Error Responses

All endpoints return consistent error formats:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized
- **403**: Forbidden  
- **404**: Not Found
- **500**: Internal Server Error

## Rate Limiting

API endpoints are subject to rate limiting to ensure fair usage and system stability.

## Data Validation

All API endpoints use Zod schemas for request validation. Invalid requests will return 400 status with validation error details.