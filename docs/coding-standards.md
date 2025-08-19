# Coding Standards & Documentation Rules

This document defines coding standards, documentation requirements, and development best practices for the Chef project.

## Documentation Requirements

### CHANGELOG Updates
**MANDATORY**: Always update `CHANGELOG.md` when making significant changes to the codebase.

#### Required Updates:
- **New Features**: Any new functionality, UI components, or API endpoints
- **Breaking Changes**: Algorithm changes, API modifications, or workflow updates
- **Bug Fixes**: Corrections to existing functionality or user-reported issues
- **Performance Improvements**: Optimizations, algorithm enhancements, or speed improvements
- **UI/UX Changes**: Interface modifications, new workflows, or user experience improvements

#### Update Process:
1. **Before coding**: Read existing CHANGELOG to understand version history
2. **During development**: Document changes as you make them
3. **Before completion**: Ensure all changes are properly categorized and documented
4. **Use semantic versioning**: Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format

#### Categories to Use:
- `🔥 Major Features` - Significant new functionality
- `🛠️ Technical Improvements` - Architecture, performance, code quality
- `🐛 Bug Fixes` - Problem resolution and corrections
- `🎯 User Experience Improvements` - UI/UX enhancements
- `📈 Performance Improvements` - Speed and optimization gains

#### Example Entry Format:
```markdown
#### Feature Name
- **Description**: Brief explanation of the change
- **Impact**: How it affects users or the system
- **Technical Details**: Implementation specifics if relevant
```

## Code Quality Standards

### TypeScript Requirements
- **Strict mode enabled**: No `any` types unless absolutely necessary
- **Explicit return types** for public functions and API endpoints
- **Proper interface definitions** for all data structures
- **Generic types** where appropriate for reusability

### Code Organization
- **Single responsibility principle**: One concern per file/function
- **Consistent naming conventions**: camelCase for variables, PascalCase for components
- **Clear file structure**: Group related functionality together
- **Import organization**: External libraries first, then internal imports

### Error Handling
- **Comprehensive try-catch blocks** for async operations
- **Proper error types** with meaningful messages
- **User-friendly error states** in UI components
- **Logging** for debugging and monitoring

### Performance Guidelines
- **Minimize re-renders** with proper React hooks usage
- **Optimize database queries** with appropriate includes and selects
- **Use TypeScript strict mode** to catch errors early
- **Implement proper caching** where applicable

## API Development Standards

### Request Validation
- **Zod schemas** for all API endpoints
- **Proper HTTP status codes** (200, 201, 400, 404, 500, etc.)
- **Consistent error response format**
- **Input sanitization** for security

### Database Operations
- **Use transactions** for multi-table operations
- **Implement proper error rollback**
- **Optimize queries** with indexes and relationships
- **Handle connection errors** gracefully

### Security Practices
- **Never log sensitive data** (passwords, tokens, etc.)
- **Validate all inputs** before database operations
- **Use proper authentication** checks
- **Implement CORS** correctly

## UI/UX Standards

### Component Design
- **Consistent design language** across all components
- **Accessibility compliance** (ARIA labels, keyboard navigation)
- **Responsive design** for all screen sizes
- **Loading states** for async operations

### User Experience
- **Clear error messages** that guide users to solutions
- **Confirmation dialogs** for destructive actions
- **Toast notifications** for user feedback
- **Intuitive navigation** and information architecture

### Styling Guidelines
- **Tailwind CSS** for consistent styling
- **Component-scoped styles** when needed
- **Design system** adherence
- **Mobile-first** responsive design

## Testing Requirements

### Test Coverage
- **Unit tests** for utility functions and algorithms
- **Integration tests** for API endpoints
- **Component tests** for React components
- **End-to-end tests** for critical user flows

### Test Quality
- **Descriptive test names** that explain the scenario
- **Proper mocking** of external dependencies
- **Edge case coverage** for error conditions
- **Performance testing** for complex algorithms

## Git and Version Control

### Commit Standards
- **Clear, descriptive commit messages**
- **Atomic commits** (one logical change per commit)
- **Reference issues/tickets** where applicable
- **Follow conventional commit** format when possible

### Branch Strategy
- **Feature branches** for new development
- **Descriptive branch names** (feature/meal-scheduling, fix/participant-availability)
- **Clean commit history** before merging
- **Code review** for all changes

## Documentation Standards

### Code Documentation
- **JSDoc comments** for public functions
- **README updates** for new features
- **Architecture diagrams** for complex systems
- **API documentation** for endpoints

### User Documentation
- **Feature documentation** for new capabilities
- **Migration guides** for breaking changes
- **Troubleshooting guides** for common issues
- **Installation instructions** kept up to date

**Note**: These standards ensure high-quality, maintainable code and comprehensive project documentation.