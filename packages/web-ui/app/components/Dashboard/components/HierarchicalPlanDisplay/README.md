# HierarchicalPlanDisplay Component

A refactored React component for displaying hierarchical execution plans with
improved modularity, maintainability, and reusability.

## 📁 Structure

```
HierarchicalPlanDisplay/
├── index.tsx                    # Main component
├── constants.ts                 # Shared constants and types
├── exports.ts                   # Component exports
├── components/                  # Sub-components
│   ├── StatusBadge.tsx         # Status display badge
│   ├── ActionDetails.tsx       # Action detail tags
│   ├── StepItem.tsx            # Individual step display
│   ├── CurrentActionDisplay.tsx # Current action indicator
│   ├── SubPlanItem.tsx         # Sub-plan card component
│   ├── PlanHeader.tsx          # Plan header with metadata
│   └── EmptyState.tsx          # Empty state display
└── hooks/
    └── usePlanData.ts          # Custom hooks for data processing
```

## 🔧 Key Improvements

### 1. **Component Decomposition**

- **Before**: Single 400+ line monolithic component
- **After**: 8 focused, single-responsibility components

### 2. **Better Separation of Concerns**

- **UI Logic**: Separated into individual components
- **Business Logic**: Extracted into custom hooks
- **Constants**: Centralized in dedicated file
- **Types**: Properly imported and typed

### 3. **Improved Maintainability**

- Each component has a single responsibility
- Shared logic extracted into reusable hooks
- Consistent styling through constants
- Better error handling and type safety

### 4. **Enhanced Reusability**

- Components can be used independently
- Custom hooks can be reused across components
- Configurable props for different use cases

## 🧩 Components

### `HierarchicalPlanDisplay` (Main)

The root component that orchestrates all sub-components.

**Props:**

- `hierarchicalPlan: HierarchicalPlan` - The plan data
- `onSubPlanClick?: (index: number, subPlan: SubPlan) => void` - Click handler

### `StatusBadge`

Displays status with consistent styling and icons.

**Props:**

- `status: string` - Status to display

### `ActionDetails`

Shows action information with contextual tags.

**Props:**

- `step: ExecutionStep` - Step with action details
- `size?: 'small' | 'medium'` - Display size

### `StepItem`

Individual step display with status and details.

**Props:**

- `step: ExecutionStep` - Step data
- `isActive?: boolean` - Whether step is currently active

### `CurrentActionDisplay`

Highlighted display of currently executing action.

**Props:**

- `subPlan: SubPlan` - Current sub-plan
- `subPlanIndex: number` - Index of current sub-plan
- `totalSubPlans: number` - Total number of sub-plans

### `SubPlanItem`

Interactive sub-plan card with expandable steps.

**Props:**

- `subPlan: SubPlan` - Sub-plan data
- `index: number` - Sub-plan index
- `isActive: boolean` - Whether sub-plan is active
- `onClick: () => void` - Click handler

### `PlanHeader`

Header section with plan metadata and progress.

**Props:**

- `hierarchicalPlan: HierarchicalPlan` - Plan data
- `completedSubPlans: number` - Completed count
- `totalSubPlans: number` - Total count

### `EmptyState`

Fallback component when no plan is available.

**Props:**

- `message?: string` - Custom empty state message

## 🎣 Custom Hooks

### `useCurrentAction(hierarchicalPlan)`

Returns current action information or null if none active.

**Returns:**

```typescript
{
  subPlan: SubPlan;
  currentStep?: ExecutionStep;
  subPlanIndex: number;
} | null
```

### `usePlanProgress(hierarchicalPlan)`

Calculates progress statistics for the plan.

**Returns:**

```typescript
{
  completedSubPlans: number;
  totalSubPlans: number;
  progressPercentage: number;
}
```

## 🎨 Constants

### Status Configuration

- `STATUS_COLORS`: Color mapping for different statuses
- `STATUS_ICONS`: Icon mapping for statuses
- `STEP_STATUS_ICONS`: Step-specific status icons

### Common Styles

- Centralized color palette
- Consistent spacing values
- Standard border radius values

## 📦 Usage

```tsx
import { HierarchicalPlanDisplay } from './components/HierarchicalPlanDisplay';

function MyComponent() {
  const handleSubPlanClick = (index: number, subPlan: SubPlan) => {
    console.log('Sub-plan clicked:', index, subPlan);
  };

  return (
    <HierarchicalPlanDisplay
      hierarchicalPlan={myPlan}
      onSubPlanClick={handleSubPlanClick}
    />
  );
}
```

## 🔍 Individual Component Usage

```tsx
// Use components independently
import {
  StatusBadge,
  ActionDetails,
} from './components/HierarchicalPlanDisplay/exports';

function MyCustomComponent() {
  return (
    <div>
      <StatusBadge status='running' />
      <ActionDetails step={myStep} size='small' />
    </div>
  );
}
```

## 🎯 Benefits of Refactoring

1. **Maintainability**: Easier to understand, modify, and debug
2. **Testability**: Each component can be tested in isolation
3. **Reusability**: Components can be reused in other contexts
4. **Performance**: Better optimization potential with smaller components
5. **Developer Experience**: Clearer code structure and better IntelliSense
6. **Scalability**: Easy to add new features without affecting existing code

## 🚀 Future Enhancements

- Add unit tests for each component
- Implement memo optimization for performance
- Add accessibility improvements (ARIA labels, keyboard navigation)
- Create Storybook stories for component documentation
- Add theme support for different color schemes
