# Changelog

All notable changes to the Chef trip planning application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🐛 Bug Fixes

#### Build System Compatibility
- **Next.js 15 Route Handler Migration**: Updated API route handlers to use new Promise-based params pattern for dynamic segments
- **TypeScript Type Definitions**: Added missing meal time fields (`defaultBreakfastTime`, `defaultLunchTime`, `defaultDinnerTime`) to Trip type in query definitions
- **ICS Calendar Export Fixes**: Resolved multiple issues in calendar export functionality including missing ETag generation, undefined variable references, and timestamp handling
- **Build Process Stabilization**: Fixed all TypeScript compilation errors preventing successful production builds

### ✨ Enhancements

#### Comprehensive SEO Optimization & Landing Page Enhancement
- **Complete SEO Overhaul**: Added enterprise-level search engine optimization with comprehensive metadata, Open Graph, and Twitter Cards
- **Advanced Metadata System**: Dynamic title templates, rich descriptions, strategic keyword targeting for "vacation meal planning", "group cooking", and related terms
- **Social Media Optimization**: Open Graph tags optimized for Facebook/LinkedIn sharing with 1200x630 image specifications and Twitter Card support
- **Structured Data Implementation**: JSON-LD schemas for Organization, WebSite, and SoftwareApplication with detailed feature listings and contact information
- **International SEO**: Hreflang implementation for English/French versions with proper canonical URLs and locale targeting (en_US, fr_FR)
- **Technical SEO Infrastructure**: Dynamic sitemap.xml generation with proper priorities and change frequencies, comprehensive robots.txt with API route protection
- **Performance SEO**: Font preloading optimization, DNS prefetch configuration, theme color meta tags, and mobile-optimized viewport settings
- **Search Visibility**: Optimized meta descriptions highlighting AI-generated grocery lists, smart scheduling algorithm, and free open-source nature
- **Professional Branding**: Author attribution, publisher information, and verification tags for major search engines (Google, Yandex, Yahoo)
- **Landing Page Authority**: Enhanced landing page with better semantic structure, optimized headings hierarchy, and improved content targeting for vacation rental and group trip keywords

#### Complete Localization Migration & Component Architecture Overhaul
- **BREAKING**: All trip pages now fully localized under `app/[locale]/trips/` structure for proper internationalization support
- **Component Modularity**: Large monolithic trip page (1960+ lines) refactored into focused, reusable components
- **Maintainable Architecture**: Trip functionality split into specialized components: `TripHeader`, `StatGrid`, `TabNavigation`, `PlanTab`, `TeamTab`, `RecipesTab`, `GroceriesTab`
- **Enhanced Recipe Management**: Fully restored recipe creation, editing, deletion, and assignment functionality with modal interfaces
- **Advanced Meal Planning**: Interactive meal planning grid with drag-and-drop recipe assignment and quick creation
- **Comprehensive Grocery Management**: Date-based grocery generation, multi-day overview, and auto-serving calculations
- **Improved Developer Experience**: Smaller, focused files easier to understand and modify
- **Future-Ready Structure**: Component architecture supports easy addition of new localized features
- **Backward Compatibility**: Non-localized routes automatically redirect to localized equivalents
- **Performance Optimization**: Reduced bundle size through component splitting and better code organization

#### Revolutionary ICS Calendar Export v2.1
- **🌍 Intelligent Timezone Support**: Automatic timezone detection from trip location with proper VTIMEZONE blocks for accurate local time display
- **📍 Enhanced Event Details**: Location information, meal categories, priority levels, and comprehensive dietary restriction integration
- **⏰ Smart Duration Management**: Meal-specific durations (Breakfast: 1h, Lunch: 1.5h, Dinner: 2h) for realistic scheduling
- **🌐 Full Internationalization**: Calendar events automatically translated based on user's browser language (English/French)
- **⚡ Performance & Caching**: HTTP caching with ETags, HEAD method support, and 5-minute cache control for optimal performance
- **👥 Advanced Attendee Management**: Participant roles (Cook/Helper) included in attendee properties with proper RSVP handling
- **🔔 Multi-Level Reminders**: 24-hour planning reminder + 1-hour preparation reminder for better meal coordination
- **📊 Calendar Preview Modal**: Interactive preview interface with event details, participant info, and copy calendar URL functionality
- **🎨 Enhanced UI**: New calendar preview button, improved export experience with proper filename encoding
- **🗄️ Database Schema**: Added trip location and timezone fields for comprehensive geographical support
- **📦 Dependencies**: Added date-fns-tz for robust timezone handling across all calendar applications
- **🔧 Technical Improvements**: Better VTIMEZONE generation, improved date formatting, and enhanced error handling

#### Modern Homepage Redesign
- **NEW**: Complete homepage makeover with modern, engaging design
- **Enhanced Hero Section**: Large gradient headlines, animated blob backgrounds, and trust indicators
- **Interactive Feature Cards**: Emoji icons, hover animations, and staggered entrance effects
- **How It Works Section**: Step-by-step visual guide with numbered circles and animated icons
- **Social Proof Elements**: Trust indicators highlighting free, open-source, and privacy-focused nature
- **Professional Footer**: Multi-column layout with product links, support resources, and legal pages
- **Call-to-Action Sections**: Multiple conversion points with gradient backgrounds and compelling copy
- **Responsive Design**: Fully optimized for all screen sizes with improved mobile experience
- **Modern UI Elements**: Glassmorphism effects, gradient text, and smooth micro-interactions

#### Improved Button Component System
- **NEW**: Reusable `Button` component with TypeScript support and comprehensive variant system
- **Button Variants**: Primary, Secondary, Success, Warm, Danger, and Ghost variants with consistent styling
- **Size Options**: Small (sm), Medium (md), and Large (lg) sizes with proper scaling
- **Enhanced UX Features**: Loading states with animated spinners, icon support, and disabled states
- **Link Integration**: Seamless support for both internal Next.js routing and external links
- **Improved Accessibility**: Proper focus management, keyboard navigation, and ARIA attributes
- **Modern Design**: Updated button styles with improved gradients, shadows, and hover animations
- **Auth Pages Redesign**: Complete visual overhaul of sign-in and error pages with modern styling

### 🔥 Major Features

#### User Account Integration & Trip Association
- **BREAKING**: Anonymous participant creation is now disabled - all users must authenticate
- **Trip Association Flow**: Authenticated users can associate their accounts with existing participants via shared links
- **Smart Participant Selection**: `/associate/[token]` route shows available unassociated participants for account linking
- **Modal Participant Creation**: Clean modal interface for authenticated users to create new participants when none are available
- **Authentication-Required Workflow**: All shared trip links now redirect through authentication flow
- **Database Constraints**: Added unique constraint ensuring one participant per user per trip (`@@unique([tripId, userId])`)
- **Admin Panel Renamed**: "Admin" section renamed to "Trips" throughout the application for clarity

#### Participant-User Association Management  
- **Disassociation API**: New `/api/participants/[participantId]/disassociate` endpoint for removing user associations
- **Admin Disassociation Interface**: Trip admin panel includes participant management section with visual association status
- **Permission-Based Access**: Only trip creators or associated users can disassociate participants
- **Visual Association Status**: Color-coded indicators showing which participants are linked to user accounts
- **User Details Display**: Shows associated user names and emails in participant management
- **One-Click Disassociation**: Red X button with confirmation dialog for easy user unlinking

#### Participant Profile Management
- **Complete Profile Editing**: Participants can now update their information including name, email, and dietary restrictions
- **Cooking Preference Editor**: Interactive slider to set cooking preferences from "Really dislikes" (-2) to "Loves cooking" (+2)
- **Availability Date Management**: Visual calendar interface to select which trip days they're available
- **Smart Date Selection**: Shows all trip dates with easy "Select All" / "Clear All" options
- **Real-time Validation**: Form validation with proper error handling and user feedback
- **Automatic Schedule Impact**: Changes immediately affect future schedule generation

#### Smart Scheduling Algorithm v2.1 - Hybrid Approach
- **BREAKING**: Completely rebuilt the meal assignment algorithm with sophisticated multi-factor optimization
- **Availability-Based Equity**: Assignments now proportional to participant presence (someone there 2 days vs 10 days gets fair workload distribution)
- **Strategic Skill Matching**: Algorithm pairs cooking enthusiasts (+1,+2 preference) with reluctant cooks (-1,-2) for balanced teams
- **Advanced Temporal Spacing**: Exponential scoring system prevents consecutive assignments and optimizes rest periods (ideal 3-5 day spacing)
- **Global Optimization**: Evaluates all possible team combinations using weighted scoring instead of greedy local decisions
- **Assignment Limits**: Hard caps prevent cooking enthusiasts from being over-assigned (max 60% of total meals)
- **Hybrid Mode Toggle**: "Equal Participation" checkbox allows users to prioritize fairness over skill matching
- **Enhanced Equity Penalties**: Dramatically increased penalties for over-assignment to ensure fair distribution
- **Detailed Logging**: Console output shows decision reasoning and final equity statistics

#### Enhanced Meal Planning Interface
- **Inline Recipe Creation**: Users can now type new recipe names directly in meal planning interface without modal dialogs
- **Streamlined Assignment Flow**: "Create New Recipe" section appears first, with existing recipes below
- **Keyboard Support**: Press Enter in recipe input to instantly create and assign
- **Real-time Feedback**: Toast notifications and loading states for better UX

#### Restored Meal Creation Functionality  
- **Meal Addition in Plan Tab**: Added meal creation interface back to the main Plan tab after schedule tab removal
- **Visual Design**: Green gradient section with clear "Add New Meals" interface
- **Pending Meal Display**: Shows queued meals before saving with human-readable format
- **Smart Save Button**: Dynamic button text showing meal count and loading states

#### Trip Administration Enhancements
- **Meal Removal**: Added ability to delete entire meal slots from trip admin page
- **Confirmation Dialogs**: Safety prompts before permanent meal deletion
- **Real-time Updates**: Automatic refresh of meal lists after changes
- **Visual Feedback**: Clear trash icons and hover effects for deletion actions

### 🛠️ Technical Improvements

#### Data Fetching Architecture Migration
- **BREAKING**: Migrated from manual fetch patterns to TanStack Query v5 for all data operations
- **Centralized Query Management**: All API interactions now go through `/lib/queries.ts` with standardized patterns
- **Automatic Cache Management**: Intelligent query invalidation, request deduplication, and background refetching
- **Enhanced Developer Experience**: Built-in loading states, error handling, and optimistic updates
- **Performance Improvements**: Reduced redundant API calls and improved user experience through smart caching
- **Type Safety**: Full TypeScript support for all query and mutation operations
- **Standard Hooks**: Complete set of query hooks (`useTrips`, `useParticipants`, `useMealSlots`) and mutation hooks (`useUpdateTrip`, `useAssociateParticipant`)
- **Provider Integration**: TanStack Query client properly configured with 5-minute stale time and intelligent retry logic

#### Authentication & Association API
- **GET /api/invites/[token]/participants**: New endpoint to retrieve unassociated participants for a specific invitation
- **POST /api/invites/[token]/associate**: Secure endpoint for associating authenticated users with existing participants  
- **POST /api/participants/[participantId]/disassociate**: Admin endpoint for removing user-participant associations
- **Enhanced Participants API**: Added user relationship data to participant queries for association status
- **Session-Based Security**: All association operations require valid NextAuth sessions
- **Transaction Safety**: User-participant associations use database transactions for consistency

#### Route Structure & Localization
- **Localized Association Route**: `/[locale]/associate/[token]` properly integrated with i18n routing system
- **Middleware Updates**: Added `/associate` path to public routes for authentication handling
- **Route Generation**: All association routes properly generated in Next.js build system
- **Navigation Integration**: Trip navigation updated from `/admin` to `/trips` across all components

#### Participant Management API Enhancement
- **PUT /api/participants/[id]**: New endpoint for updating participant profiles
- **Comprehensive Updates**: Support for all participant fields including availability dates
- **Transaction Safety**: Atomic updates ensure data consistency
- **Zod Validation**: Robust input validation with proper error messages
- **Type Safety**: Full TypeScript support for all participant operations

#### Database Schema Updates
- **User-Participant Association Constraint**: Added `@@unique([tripId, userId])` to prevent multiple participants per user per trip
- **Enhanced Participant Queries**: Include user relationship data for association status display
- **Email Field Support**: Optional email field in participant creation API for new participant modal
- **Migration Required**: `add-unique-user-per-trip-constraint` migration needed for database constraint
- **Added Participant.email**: Optional email field for ICS export and future user linking
- **Added Participant.dietaryRestrictions**: Optional field for allergies and dietary requirements
- **Migration Applied**: `20250819200341_add_participant_email_dietary_restrictions`
- **Future-Ready**: Supports upcoming Google account integration while maintaining editing flexibility

#### Documentation Structure Overhaul
- **Organized Documentation**: Split monolithic CLAUDE.md into focused, maintainable files
- **Separation of Concerns**: Each documentation file has a single, clear responsibility
- **Better Navigation**: Main CLAUDE.md now serves as index to specialized documentation
- **Improved Maintainability**: Easier to update specific aspects without affecting other documentation

#### New Documentation Structure
- **docs/development.md**: Development setup, commands, libraries, and workflows
- **docs/architecture.md**: System design, database schema, and algorithm details
- **docs/coding-standards.md**: Code quality rules and documentation requirements
- **docs/api-reference.md**: Comprehensive API endpoint documentation
- **CLAUDE.md**: Concise overview and navigation hub

#### Algorithm Architecture
- **Multi-Phase Processing**: 
  1. Participant analysis and equity calculations
  2. Team combination generation and scoring  
  3. Optimized assignment selection
  4. Database persistence and statistics
- **Scoring System**: Weighted factors for skill (40%), equity (35%), and temporal spacing (25%)
- **Performance Optimization**: Limited team candidate generation to prevent combinatorial explosion
- **Type Safety**: Enhanced TypeScript types for new algorithm structures

#### API Enhancements
- **Recipe Creation**: Enhanced `/api/recipes` endpoint supports direct meal slot assignment via `mealSlotId` parameter
- **Meal Deletion**: Robust meal removal with automatic cleanup of assignments and recipes
- **Error Handling**: Improved error messages and validation across all endpoints

#### Database Integration
- **Transaction Safety**: All schedule operations wrapped in database transactions
- **Relationship Management**: Automatic cleanup of related assignments and recipes
- **Performance**: Optimized queries with proper joins and indexing considerations

### 🐛 Bug Fixes

#### Authentication & Route Issues  
- **Fixed 404 errors**: Moved `/associate/[token]` route to proper localized folder structure `/[locale]/associate/[token]`
- **Fixed anonymous access**: Blocked anonymous participant creation by redirecting all `/join/[token]` requests to authentication flow
- **Fixed route conflicts**: Resolved middleware routing conflicts with new association paths
- **Fixed TypeScript errors**: Resolved null/undefined user association checks in admin interface
- **Fixed missing dependencies**: Added proper React hook dependencies for participant loading functions

#### Database Schema Issues
- **CRITICAL**: Fixed missing Participant.email field causing "Unknown argument 'email'" error
- **CRITICAL**: Fixed missing Participant.dietaryRestrictions field in database schema
- Fixed Prisma validation errors when updating participant profiles
- Added proper database migration for new participant fields

#### Scheduling Issues
- Fixed equity calculation not considering participant availability windows
- Resolved consecutive assignment detection using actual dates instead of slot indices  
- Corrected skill weighting to properly incentivize strategic team composition
- Fixed edge cases with single-participant availability on specific days
- **MAJOR**: Fixed cooking enthusiasts being over-assigned due to skill preference weighting
- Added hard assignment limits to prevent any participant from cooking more than their fair share
- Enhanced equity penalties to ensure balanced distribution regardless of cooking preferences

#### UI/UX Fixes
- Resolved loss of meal creation functionality when schedule tab was removed
- Fixed recipe assignment flow being too complex for quick meal planning
- Corrected meal removal not being available from trip administration
- Fixed inconsistent loading states and error handling across interfaces
- **MAJOR**: Fixed missing participant profile editing - users can now update cooking preferences and availability
- Added proper form validation and error handling for participant updates
- Improved participant page layout with clear edit/view modes

#### Data Consistency
- Ensured proper cleanup of orphaned assignments when meals are deleted
- Fixed recipe assignments not being properly linked to new meals
- Corrected availability date calculations for equity metrics
- Resolved timezone issues in temporal spacing calculations

### 🎯 User Experience Improvements

#### Streamlined Authentication Flow
- **Unified Entry Point**: All shared trip links now go through consistent authentication-first flow
- **Smart Participant Selection**: Visual participant cards with cooking preferences and user association status
- **Fallback Options**: "Create new participant instead" option when no existing participants match
- **Context-Aware Navigation**: Proper sign-in redirects maintain original invitation context
- **Modal Interface**: Clean, focused modal for new participant creation with availability calendar
- **Visual Feedback**: Loading states and success/error messaging throughout association process

#### Enhanced Admin Experience  
- **Participant Management Dashboard**: Dedicated section showing all participants with association status
- **Visual Association Status**: Color-coded indicators (green dot for associated, gray for unassociated)
- **User Information Display**: Shows linked user names and email addresses for associated participants
- **Quick Disassociation**: One-click user unlinking with confirmation dialogs
- **Permission-Based Actions**: Disassociation buttons only appear for authorized users (trip creator or associated user)
- **Consistent Naming**: "Admin" renamed to "Trips" throughout navigation for clarity

#### Smart Navigation & Tab Persistence  
- **Tab-Aware Back Links**: Back navigation from participant pages now preserves the previously viewed tab
- **URL Parameter Integration**: Trip tabs are now persisted in URL for shareable links and proper browser history
- **SessionStorage Fallback**: Tab state maintained even when navigating without URL parameters
- **Seamless Navigation**: Edit participant → Back button returns to the exact tab you were viewing (Team, Recipes, etc.)
- **Browser History Support**: Proper back/forward button behavior with tab state preservation

#### Workflow Optimization
- **Faster Recipe Assignment**: Reduced from 3+ clicks to direct typing and Enter key
- **Logical Information Architecture**: Plan tab now contains both meal creation and viewing
- **Intuitive Admin Controls**: Clear deletion options with appropriate safety measures
- **Responsive Feedback**: Loading states and notifications for all major actions

#### Interface Polish
- **Consistent Design Language**: All new features match existing visual style
- **Accessibility**: Proper ARIA labels, keyboard navigation, and focus management
- **Mobile Responsive**: New interfaces work seamlessly across device sizes
- **Visual Hierarchy**: Clear section separation and information prioritization

### 🧪 Testing & Quality

#### Algorithm Validation
- Comprehensive test coverage for scheduling logic
- Edge case handling for various participant availability scenarios
- Performance benchmarking for large groups and long trips
- Validation of equity calculations and temporal spacing

#### Integration Testing
- End-to-end workflow testing for meal planning process
- API endpoint testing for all CRUD operations
- Database transaction testing for consistency
- Cross-browser compatibility validation

### 📈 Performance Improvements

#### Scheduling Performance
- **Optimized Combinatorics**: Limited team candidate generation to top 50 options per meal
- **Efficient Database Operations**: Batched queries and transaction optimization
- **Memory Usage**: Reduced object copying and improved garbage collection
- **Caching Strategy**: Smart caching of participant calculations across meal slots

#### Frontend Optimization
- **Reduced API Calls**: Consolidated meal planning operations
- **Optimistic Updates**: UI updates before server confirmation where safe
- **Code Splitting**: Dynamic imports for admin-only functionality
- **Bundle Size**: Removed unused dependencies and optimized imports

---

## Previous Versions

### [1.0.0] - Initial Release
- Basic trip management with participants and meals
- Simple recipe assignment system
- Grocery list generation
- Multi-language support (English/French)
- Basic scheduling algorithm with cooking preferences
- Invite system for trip participants

---

## Migration Guide

### Upgrading to TanStack Query Architecture

**BREAKING CHANGE**: All data fetching has been migrated from manual fetch patterns to TanStack Query.

#### Required Changes for Contributors
1. **Import Changes**: Replace manual fetch calls with TanStack Query hooks from `/lib/queries.ts`
2. **Component Updates**: Remove useState loading/error states in favor of built-in query states
3. **Mutation Handling**: Use mutation hooks instead of try/catch blocks with manual error handling
4. **Cache Management**: Leverage automatic query invalidation instead of manual refetch functions

#### Migration Example
```typescript
// ❌ Old Pattern - Manual fetch with useState
const [trips, setTrips] = useState([])
const [loading, setLoading] = useState(false)

useEffect(() => {
  const loadTrips = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/trips')
      const data = await response.json()
      setTrips(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  loadTrips()
}, [])

// ✅ New Pattern - TanStack Query
import { useTrips } from '@/lib/queries'

const { data: trips = [], isLoading, error } = useTrips()
```

### Upgrading to Authentication-Required Participant Management

**BREAKING CHANGE**: Anonymous participant creation has been disabled. All users must now authenticate before joining trips.

#### Required Database Migration
```bash
npx prisma migrate dev --name add-unique-user-per-trip-constraint
```

#### User Workflow Changes
1. **Shared Links**: All `/join/[token]` links now redirect to `/associate/[token]` requiring authentication
2. **Participant Creation**: Users must sign in before creating participants (Google OAuth required)
3. **Account Linking**: Existing unassociated participants can be claimed by authenticated users
4. **Admin Management**: Trip creators can now see and manage user-participant associations

#### API Changes
- **New Endpoints**: `/api/invites/[token]/participants`, `/api/invites/[token]/associate`, `/api/participants/[id]/disassociate`
- **Enhanced Responses**: Participant queries now include user relationship data
- **Session Requirements**: All association operations require authenticated sessions

#### Navigation Updates
- **Admin → Trips**: All references to "Admin" panel renamed to "Trips"
- **New Routes**: `/[locale]/associate/[token]` for authenticated participant selection

### Upgrading to v2.0 Scheduling Algorithm

The new scheduling algorithm is backward compatible but produces different (better) results:

1. **Participant Setup**: Ensure all participants have:
   - Cooking preferences set (-2 to +2 scale)
   - Availability dates configured for fair equity calculations
   
2. **Expected Changes**: 
   - More equitable distribution based on actual availability
   - Better skill balancing in teams
   - Improved temporal spacing between assignments
   
3. **New Features**:
   - Console logging shows scheduling decisions (check server logs)
   - Detailed statistics in API responses
   - Better handling of edge cases (single-participant days, etc.)

### UI Workflow Changes

1. **Meal Creation**: Now located in Plan tab instead of separate Schedule tab
2. **Recipe Assignment**: Can type new recipes directly instead of modal-only creation
3. **Meal Deletion**: Available from Trip Admin page for better organization

No breaking API changes - all existing integrations continue to work.