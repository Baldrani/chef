# Architecture Overview

This document describes the system architecture, database design, and core algorithms of the Chef application.

## System Overview

Chef is a Next.js 15 application for managing cooking assignments and meal planning for group trips. It uses PostgreSQL with Prisma ORM, supports internationalization (i18n) with English and French locales, and includes an intelligent scheduling system that balances cooking assignments based on participant preferences and availability.

## Database Schema (Prisma)

Core entities with their relationships:

### Core Entities
- **Trip**: Main container with date range, participants, meal slots, recipes, and invites
- **Participant**: Trip members with cooking preferences (-2 to +2 scale) and availability dates
- **MealSlot**: Individual meal instances (breakfast/lunch/dinner) on specific dates
- **Assignment**: Links participants to meal slots with roles (COOK/HELPER)
- **Recipe**: Meal recipes with serving information, linked to meal slots
- **Invite**: Token-based invitation system with expiration and usage limits

### Relationships
- Trip has many Participants, MealSlots, Recipes, and Invites
- Participant belongs to Trip, has many Assignments and Availabilities
- MealSlot belongs to Trip, has many Assignments and RecipeAssignments
- Assignment links Participant to MealSlot with role (COOK/HELPER)
- Recipe belongs to Trip, has many RecipeAssignments to MealSlots

## Scheduling Algorithm (lib/scheduler.ts)

### Algorithm v2.1 - Hybrid Approach

Intelligent assignment system with multi-factor optimization:

#### Core Features
- **Availability-Based Equity**: Assignments proportional to participant presence
- **Strategic Skill Matching**: Pairs cooking enthusiasts with reluctant cooks
- **Advanced Temporal Spacing**: Prevents consecutive assignments (3-5 day optimal spacing)
- **Assignment Limits**: Hard caps prevent over-assignment (max 60% of total meals)
- **Hybrid Mode Toggle**: User can prioritize equality over skill matching

#### Scoring System
- **Skill Complementarity** (20-40%): Rewards balanced teams with mixed preferences
- **Equity Scoring** (35-60%): Heavy bonuses for fair distribution, penalties for over-assignment
- **Temporal Spacing** (20-25%): Exponential rewards for proper rest periods

#### Algorithm Phases
1. **Participant Analysis**: Calculate equity metrics and assignment limits
2. **Team Generation**: Create all possible combinations for each meal
3. **Optimized Selection**: Score and select best teams using weighted factors
4. **Database Persistence**: Atomic transaction updates

#### Configuration Options
- `maxCooksPerMeal` (1-6): Maximum cooks per meal
- `maxHelpersPerMeal` (0-6): Maximum helpers per meal
- `prioritizeEqualParticipation` (boolean): Toggle between balanced and equality modes
- `autoAssignRecipes` (boolean): Automatically assign recipes to meals
- `recipesPerMeal` (1-5): Number of recipes per meal slot

## API Design

### RESTful Architecture
Following Next.js App Router conventions with proper HTTP methods:

- **GET**: Read operations (list, retrieve)
- **POST**: Create operations
- **PUT/PATCH**: Update operations  
- **DELETE**: Remove operations

### Resource Structure
- `/api/trips` - Trip management
- `/api/participants` - Participant CRUD
- `/api/meals/[mealSlotId]` - Meal operations
- `/api/recipes/[recipeId]` - Recipe management
- `/api/schedule/generate` - Algorithm execution
- `/api/invites/[token]` - Invitation system

### Data Validation
- **Zod schemas** for all API request validation
- **Type safety** with TypeScript interfaces
- **Error handling** with proper HTTP status codes
- **Transaction safety** for complex operations

## Performance Considerations

### Database Optimization
- **Indexed queries** on frequently accessed fields
- **Relationship loading** with Prisma includes
- **Transaction batching** for atomic operations
- **Connection pooling** via @neondatabase/serverless

### Frontend Performance  
- **Next.js App Router** for optimal loading
- **Code splitting** for reduced bundle size
- **Optimistic updates** for better UX
- **Caching strategies** for API responses

### Algorithm Efficiency
- **Combinatorial limits** (max 50 team candidates per meal)
- **Early termination** for invalid team combinations
- **Memory optimization** through smart object copying
- **Logging** for performance monitoring and debugging