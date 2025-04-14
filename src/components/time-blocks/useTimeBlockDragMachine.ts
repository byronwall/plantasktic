"use client";

import { useReducer } from "react";

// --- State Types ---
type IdleState = { type: "idle"; button?: number };

type DragNewState = {
  type: "drag_new";
  startTime: Date;
  currentTime: Date;
};

type DragExistingState = {
  type: "drag_existing";
  blockId: string;
  initialStartTime: Date;
  initialEndTime: Date;
  startOffset: { x: number; y: number }; // Offset within the block where drag started
  initialMousePosition: { x: number; y: number }; // Absolute mouse position when drag started
  currentMousePosition: { x: number; y: number }; // Current absolute mouse position
  totalMovement: number;
  shouldDuplicate: boolean;
};

type ResizeBlockState = {
  type: "resize_block_top" | "resize_block_bottom";
  blockId: string;
  initialStartTime: Date;
  initialEndTime: Date;
  currentMousePosition: { x: number; y: number }; // Current absolute mouse position
};

export type DragMachineState =
  | IdleState
  | DragNewState
  | DragExistingState
  | ResizeBlockState;

// --- Action Types ---
type StartNewAction = {
  type: "START_NEW";
  payload: { startTime: Date };
};

type StartExistingAction = {
  type: "START_EXISTING";
  payload: {
    blockId: string;
    initialStartTime: Date;
    initialEndTime: Date;
    startOffset: { x: number; y: number };
    initialMousePosition: { x: number; y: number };
    isControlPressed: boolean;
  };
};

type StartResizeAction = {
  type: "START_RESIZE";
  payload: {
    blockId: string;
    edge: "top" | "bottom";
    initialStartTime: Date;
    initialEndTime: Date;
    initialMousePosition: { x: number; y: number };
  };
};

type MoveAction = {
  type: "MOVE";
  payload: {
    time?: Date;
    mousePosition?: { x: number; y: number };
    isControlPressed?: boolean;
  };
};

type EndAction = { type: "END"; payload?: { button?: number } };
type CancelAction = { type: "CANCEL" };
type UpdateControlKeyAction = { type: "UPDATE_CONTROL"; payload: boolean };

type DragMachineAction =
  | StartNewAction
  | StartExistingAction
  | StartResizeAction
  | MoveAction
  | EndAction
  | CancelAction
  | UpdateControlKeyAction;

// --- Reducer ---
const initialState: DragMachineState = { type: "idle" };

const dragMachineReducer = (
  state: DragMachineState,
  action: DragMachineAction,
): DragMachineState => {
  let nextState: DragMachineState;

  switch (action.type) {
    case "START_NEW":
      if (state.type === "idle") {
        nextState = {
          type: "drag_new",
          startTime: action.payload.startTime,
          currentTime: action.payload.startTime,
        };
      } else {
        nextState = state;
      }
      break;

    case "START_EXISTING":
      if (state.type === "idle") {
        nextState = {
          type: "drag_existing",
          blockId: action.payload.blockId,
          initialStartTime: action.payload.initialStartTime,
          initialEndTime: action.payload.initialEndTime,
          startOffset: action.payload.startOffset,
          initialMousePosition: action.payload.initialMousePosition,
          currentMousePosition: action.payload.initialMousePosition,
          totalMovement: 0,
          shouldDuplicate: action.payload.isControlPressed,
        };
      } else {
        nextState = state;
      }
      break;

    case "START_RESIZE":
      if (state.type === "idle") {
        nextState = {
          type:
            action.payload.edge === "top"
              ? "resize_block_top"
              : "resize_block_bottom",
          blockId: action.payload.blockId,
          initialStartTime: action.payload.initialStartTime,
          initialEndTime: action.payload.initialEndTime,
          currentMousePosition: action.payload.initialMousePosition,
        };
      } else {
        nextState = state;
      }
      break;

    case "MOVE":
      switch (state.type) {
        case "drag_new":
          if (!action.payload.time) {
            nextState = state;
            break;
          }
          nextState = {
            ...state,
            currentTime: action.payload.time,
          };
          break;
        case "drag_existing": {
          if (!action.payload.mousePosition) {
            nextState = state;
            break;
          }
          const dx =
            action.payload.mousePosition.x - state.currentMousePosition.x;
          const dy =
            action.payload.mousePosition.y - state.currentMousePosition.y;
          const newMovement =
            state.totalMovement + Math.sqrt(dx * dx + dy * dy);
          nextState = {
            ...state,
            currentMousePosition: action.payload.mousePosition,
            totalMovement: newMovement,
            shouldDuplicate:
              action.payload.isControlPressed ?? state.shouldDuplicate,
          };
          break;
        }
        case "resize_block_top":
        case "resize_block_bottom":
          if (!action.payload.mousePosition) {
            nextState = state;
            break;
          }
          nextState = {
            ...state,
            currentMousePosition: action.payload.mousePosition,
          };
          break;
        default:
          nextState = state;
      }
      break;

    case "UPDATE_CONTROL":
      if (state.type === "drag_existing") {
        nextState = {
          ...state,
          shouldDuplicate: action.payload,
        };
      } else {
        nextState = state;
      }
      break;

    case "END":
    case "CANCEL":
      nextState = {
        type: "idle",
        button: action.type === "END" ? action.payload?.button : undefined,
      };
      break;

    default:
      nextState = state;
  }

  return nextState;
};

// --- Hook Implementation ---
export const useTimeBlockDragMachine = () => {
  const [state, dispatch] = useReducer(dragMachineReducer, initialState);

  // Action dispatchers
  const startNew = (startTime: Date) =>
    dispatch({ type: "START_NEW", payload: { startTime } });

  const startExisting = (payload: StartExistingAction["payload"]) =>
    dispatch({ type: "START_EXISTING", payload });

  const startResize = (payload: StartResizeAction["payload"]) =>
    dispatch({ type: "START_RESIZE", payload });

  const move = ({
    time,
    mousePosition,
    isControlPressed,
  }: {
    time?: Date;
    mousePosition?: { x: number; y: number };
    isControlPressed?: boolean;
  }) =>
    dispatch({
      type: "MOVE",
      payload: { time, mousePosition, isControlPressed },
    });

  const end = (payload?: EndAction["payload"]) =>
    dispatch({ type: "END", payload });

  const cancel = () => dispatch({ type: "CANCEL" });

  const updateControlKey = (isPressed: boolean) =>
    dispatch({ type: "UPDATE_CONTROL", payload: isPressed });

  // State selectors/helpers (optional but convenient)
  const isIdle = state.type === "idle";
  const isCreating = state.type === "drag_new";
  const isMoving = state.type === "drag_existing";
  const isResizing =
    state.type === "resize_block_top" || state.type === "resize_block_bottom";

  return {
    state,
    startNew,
    startExisting,
    startResize,
    move,
    end,
    cancel,
    updateControlKey,
    // Helpers
    isIdle,
    isCreating,
    isMoving,
    isResizing,
  };
};
