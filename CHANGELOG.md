# Changelog

All notable changes to the Chef trip planning application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 🔥 Major Features

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

#### Participant Management API Enhancement
- **PUT /api/participants/[id]**: New endpoint for updating participant profiles
- **Comprehensive Updates**: Support for all participant fields including availability dates
- **Transaction Safety**: Atomic updates ensure data consistency
- **Zod Validation**: Robust input validation with proper error messages
- **Type Safety**: Full TypeScript support for all participant operations

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