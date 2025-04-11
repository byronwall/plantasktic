# TimeBlock Mouse Event System

## Current Implementation Overview

The TimeBlock system implements a complex mouse event handling system that supports:

1. **Creating new time blocks** by dragging on an empty area
2. **Moving existing time blocks** by dragging them
3. **Resizing time blocks** by dragging their top or bottom edges
4. **Duplicating blocks** by holding Ctrl/Cmd while dragging
5. **Showing hover indicators** for precise time positioning

## Key Components

### 1. `useTimeBlockMouseEvents` Hook

This is the main hook that manages all time block interactions with a state machine design. It tracks:

- Current drag state (idle, creating, moving, resizing)
- Mouse position
- Modifier keys (Ctrl/Cmd for duplication)

### 2. `TimeBlock` Component

Individual time block UI component with handlers for:

- Detecting drag start on a block
- Detecting resize operations on the top/bottom edges
- Preventing event propagation to the underlying grid

### 3. `WeeklyCalendar` Component

Main calendar view that:

- Uses the `useTimeBlockMouseEvents` hook
- Renders drag previews during operations
- Shows time indicators and guidelines
- Handles finalization of drag operations

### 4. `getTimeFromGridPosition` Utility

Converts pixel coordinates to time positions with:

- Day calculation based on x-position
- Hour/minute calculation based on y-position
- Snapping to configured time intervals

## Core Event Flow

1. **Mouse Down**:

   - On empty grid: Start creating a new block
   - On a block: Start dragging or resizing based on cursor position

2. **Mouse Move**:

   - Updates the current drag/resize preview
   - Shows time indicators for precise positioning
   - Handles boundary conditions and clipping

3. **Mouse Up**:

   - Finalizes the operation based on the current state
   - Creates, moves, or resizes blocks
   - If movement was minimal, shows edit dialog instead

4. **Key Events**:
   - Ctrl/Cmd key detection for duplication
   - Escape key for canceling operations

## State Management

The system uses a state machine pattern with the following states:

1. **idle**: No active drag operation
2. **drag_new**: Creating a new time block
3. **drag_existing**: Moving an existing time block
4. **resize_block_top**: Resizing from the top edge
5. **resize_block_bottom**: Resizing from the bottom edge

## Challenges in Current Implementation

1. Significant code duplication across different drag states
2. Complex position calculations repeated in multiple places
3. Intertwined rendering and event logic
4. High coupling between components
5. Many special cases for boundary handling

## Proposed Refactoring Approach

### 1. Separate Time-Positioning Logic

Create a dedicated positioning system with these components:

#### `TimePositionContext`

A context provider that encapsulates all positioning logic:

```tsx
<TimePositionContext
  startHour={6}
  endHour={20}
  snapMinutes={15}
  numberOfDays={7}
  weekStart={weekStart}
  blockHeight={64}
>
  {/* Calendar components */}
</TimePositionContext>
```

#### `useTimePosition` Hook

A hook that provides position conversion utilities:

```tsx
const {
  timeToPosition, // Convert time to grid position
  positionToTime, // Convert grid position to time
  isInBounds, // Check if a position is within calendar bounds
  snapTime, // Snap a time to the configured intervals
} = useTimePosition();
```

### 2. Extract State Machine Logic

Create a dedicated state machine for drag operations:

#### `useTimeBlockDragMachine` Hook

A hook built with a proper state machine library (like XState) that:

```tsx
const {
  state, // Current state with all data
  start, // Start a drag operation
  move, // Update drag position
  end, // End drag operation
  cancel, // Cancel operation
  isCreating, // Helper methods for checking state
  isMoving,
  isResizing,
} = useTimeBlockDragMachine();
```

### 3. Create Specialized UI Components

#### `BlockPreview` Component

A pure presentation component for showing block previews:

```tsx
<BlockPreview
  startTime={previewStart}
  endTime={previewEnd}
  title="New Block"
  color="#3b82f6"
  isClipped={false}
  isDuplicating={false}
/>
```

#### `TimeIndicator` Component

For showing time guides and positions:

```tsx
<TimeIndicator
  position={mousePosition}
  type="current" | "start" | "end"
/>
```

### 4. Extract Event Handlers to Custom Hooks

#### `useTimeBlockCreation` Hook

A hook specifically for creating new blocks:

```tsx
const { handleGridMouseDown } = useTimeBlockCreation();
```

#### `useTimeBlockDrag` Hook

A hook for dragging existing blocks:

```tsx
const { handleBlockMouseDown } = useTimeBlockDrag(blockId);
```

#### `useTimeBlockResize` Hook

A hook for resizing operations:

```tsx
const { handleResizeStart } = useTimeBlockResize(blockId);
```

### 5. Create an Action System

Decouple state transitions from mutation effects:

```tsx
const timeBlockActions = {
  createBlock: (startTime, endTime) => {
    /* mutation logic */
  },
  moveBlock: (blockId, newStart, newEnd, duplicate) => {
    /* mutation logic */
  },
  resizeBlock: (blockId, newStart, newEnd) => {
    /* mutation logic */
  },
};
```

### 6. Simplify WeeklyCalendar Component

Remove most direct DOM event handling, delegating to the hooks:

```tsx
<CalendarGrid
  onMouseDown={handleGridMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleDragEnd}
  onMouseLeave={handleDragCancel}
>
  {blocks.map((block) => (
    <TimeBlock
      key={block.id}
      block={block}
      onDragStart={handleBlockDragStart}
      onResizeStart={handleBlockResizeStart}
    />
  ))}
  {state.type !== "idle" && <DragPreview state={state} />}
  <TimeIndicators state={state} mousePosition={mousePosition} />
</CalendarGrid>
```

### 7. Keyboard Event Management

Extract keyboard handling to a dedicated hook:

```tsx
const { isControlPressed, isShiftPressed } = useKeyModifiers([
  "Control",
  "Shift",
]);
```

## Benefits of the Proposed Approach

1. **Reduced complexity** through clear separation of concerns
2. **Improved testability** with isolated state management
3. **Enhanced maintainability** through smaller, focused components
4. **Better reusability** of positioning and conversion logic
5. **Simplified rendering logic** with specialized preview components
6. **More predictable state transitions** using a proper state machine

## Implementation Strategy

1. First extract the positioning system without changing behavior
2. Introduce the state machine as a wrapper around existing state
3. Create the specialized UI components using the current rendering logic
4. Extract the mutation logic to separate action creators
5. Refactor the individual operation hooks
6. Update the WeeklyCalendar to use the new system
7. Add tests for each independent component

This approach allows for incremental refactoring while maintaining the existing functionality throughout the process.

## Plans

Here is a detailed, phased plan for implementing the refactoring:

### Phase 1: Isolate Positioning Logic

1. **Create `TimePositionContext` and `useTimePosition` Hook**:

   - Define the `TimePositionContext` provider, encapsulating configuration like `startHour`, `endHour`, `snapMinutes`, `numberOfDays`, `weekStart`, and `blockHeight`.
   - Implement the `useTimePosition` hook with functions: `timeToPosition`, `positionToTime`, `isInBounds`, `snapTime`, and other relevant geometry calculations. Ensure these functions use context values.

2. **Integrate Positioning System**:
   - Wrap the main calendar component with `TimePositionContext.Provider`.
   - Replace existing pixel/time conversion, snapping, and boundary checks (in `useTimeBlockMouseEvents`, `WeeklyCalendar`, `TimeBlock`, etc.) with calls to `useTimePosition` functions.
   - **Verification**: Test all interactions (creating, moving, resizing, hover indicators) to ensure positioning and snapping remain unchanged.

### Phase 2: Introduce State Management

3. **Implement `useTimeBlockDragMachine` Hook**:

   - Create the hook using `useReducer` or `useState` initially to manage states (`idle`, `drag_new`, `drag_existing`, `resize_block_top`, `resize_block_bottom`) and associated data.
   - Expose state and transition functions (`start`, `move`, `end`, `cancel`).

4. **Integrate State Machine into `useTimeBlockMouseEvents`**:
   - Modify `useTimeBlockMouseEvents` to consume `useTimeBlockDragMachine`.
   - Replace internal state variables with the machine's state.
   - Update event handlers (`handleMouseDown`, `handleMouseMove`, `handleMouseUp`) to call machine transition functions.
   - **Verification**: Test all drag/resize operations, ensuring correct state transitions and visual feedback.

### Phase 3: Refactor UI Components and Actions

5. **Create `BlockPreview` Component**:

   - Implement a presentational `BlockPreview` component accepting props (`startTime`, `endTime`, `title`, `color`, etc.).
   - Update `WeeklyCalendar` to use `<BlockPreview />`, passing data from the state machine.

6. **Create `TimeIndicator` Component**:

   - Implement a presentational `TimeIndicator` component (`position`, `type` props).
   - Update `WeeklyCalendar` to use `<TimeIndicator />` for time guides, using mouse position and state data.

7. **Extract Mutation Logic (`timeBlockActions`)**:
   - Create `timeBlockActions` (object or hook) with functions: `createBlock`, `moveBlock`, `resizeBlock` encapsulating mutation calls.
   - Modify `useTimeBlockMouseEvents` finalization logic (`handleMouseUp`) to call these action functions.
   - **Verification**: Confirm creating, moving, and resizing blocks correctly saves data post-operation.

### Phase 4: Specialize Event Initiation

8. **Create `useTimeBlockCreation` Hook**:

   - Extract the logic for starting a "create new block" operation into this hook.
   - Use `useTimeBlockDragMachine.start` with `drag_new`.
   - Update the grid's `onMouseDown` handler.

9. **Create `useTimeBlockDrag` Hook**:

   - Extract the logic for starting a "drag existing block" operation (accepting `blockId`) into this hook.
   - Use `useTimeBlockDragMachine.start` with `drag_existing`.
   - Update the `TimeBlock` drag handle `onMouseDown`.

10. **Create `useTimeBlockResize` Hook**:
    - Extract the logic for starting a resize (accepting `blockId`, direction) into this hook.
    - Use `useTimeBlockDragMachine.start` with `resize_block_top`/`resize_block_bottom`.
    - Update `TimeBlock` resize handles' `onMouseDown`.
    - **Verification**: Ensure initiating creates, drags, and resizes works correctly via appropriate element interactions.

### Phase 5: Final Cleanup and Keyboard Handling

11. **Simplify `WeeklyCalendar`**:

    - Remove remaining event initiation logic moved to specialized hooks.
    - Ensure `WeeklyCalendar` focuses on rendering and delegates core interaction logic (`onMouseMove`, `onMouseUp`, `onMouseLeave`) to `useTimeBlockMouseEvents`.

12. **Create `useKeyModifiers` Hook**:

    - Implement `useKeyModifiers` to track key states ('Control', 'Shift', 'Meta').
    - Replace direct `event.ctrlKey`/`event.metaKey` checks with state from this hook.
    - **Verification**: Test duplication (Ctrl/Cmd + Drag) and other modifier-key behavior.

13. **(Optional) Refine State Machine**:

    - Consider migrating `useTimeBlockDragMachine` to XState if complexity warrants it.

14. **Add Tests**:
    - Write unit/integration tests for new hooks and components.
