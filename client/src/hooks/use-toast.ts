import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";
import { z } from "zod";

// Constants
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

// Validation schemas
const toastSchema = z.object({
  id: z.string(),
  title: z.custom<React.ReactNode>().optional(),
  description: z.custom<React.ReactNode>().optional(),
  action: z.custom<ToastActionElement>().optional(),
  open: z.boolean().optional(),
  onOpenChange: z.function().args(z.boolean()).optional(),
  variant: z.enum(['default', 'destructive']).optional(),
  duration: z.number().int().positive().optional(),
});

type ToasterToast = z.infer<typeof toastSchema>;

const actionTypeSchema = z.enum([
  'ADD_TOAST',
  'UPDATE_TOAST',
  'DISMISS_TOAST',
  'REMOVE_TOAST',
]);

type ActionType = z.infer<typeof actionTypeSchema>;

const actionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ADD_TOAST'),
    toast: toastSchema,
  }),
  z.object({
    type: z.literal('UPDATE_TOAST'),
    toast: toastSchema.partial(),
  }),
  z.object({
    type: z.literal('DISMISS_TOAST'),
    toastId: z.string().optional(),
  }),
  z.object({
    type: z.literal('REMOVE_TOAST'),
    toastId: z.string().optional(),
  }),
]);

type Action = z.infer<typeof actionSchema>;

const stateSchema = z.object({
  toasts: z.array(toastSchema),
});

type State = z.infer<typeof stateSchema>;

interface ToastResult {
  readonly id: string;
  readonly dismiss: () => void;
  readonly update: (props: Partial<ToasterToast>) => void;
}

interface UseToastResult extends State {
  readonly toast: (props: Omit<ToasterToast, 'id'>) => ToastResult;
  readonly dismiss: (toastId?: string) => void;
}

class ToastError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToastError';
    Object.freeze(this);
  }
}

// Private state
let count = 0;
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

/**
 * Validates the state object
 * @param state - State to validate
 * @throws {ToastError} If state is invalid
 */
function validateState(state: State): void {
  try {
    stateSchema.parse(state);
  } catch (error) {
    throw new ToastError(`Invalid state: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates a toast object
 * @param toast - Toast to validate
 * @throws {ToastError} If toast is invalid
 */
function validateToast(toast: ToasterToast): void {
  try {
    toastSchema.parse(toast);
  } catch (error) {
    throw new ToastError(`Invalid toast: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates a unique ID for toasts
 * @returns A unique string ID
 */
function genId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

/**
 * Adds a toast to the remove queue
 * @param toastId - ID of the toast to remove
 * @throws {ToastError} If toast ID is invalid
 */
const addToRemoveQueue = (toastId: string): void => {
  if (typeof toastId !== 'string' || toastId.length === 0) {
    throw new ToastError('Invalid toast ID');
  }

  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

/**
 * Reducer for managing toast state
 * @param state - Current state
 * @param action - Action to perform
 * @returns New state
 * @throws {ToastError} If state or action is invalid
 */
export const reducer = (state: State, action: Action): State => {
  try {
    // Validate input state and action
    validateState(state);
    actionSchema.parse(action);

    switch (action.type) {
      case 'ADD_TOAST': {
        validateToast(action.toast);
        const newState = {
          ...state,
          toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
        };
        validateState(newState);
        return newState;
      }

      case 'UPDATE_TOAST': {
        const newState = {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === action.toast.id ? { ...t, ...action.toast } : t
          ),
        };
        validateState(newState);
        return newState;
      }

      case 'DISMISS_TOAST': {
        const { toastId } = action;

        if (toastId) {
          addToRemoveQueue(toastId);
        } else {
          state.toasts.forEach((toast) => {
            addToRemoveQueue(toast.id);
          });
        }

        const newState = {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === toastId || toastId === undefined
              ? {
                  ...t,
                  open: false,
                }
              : t
          ),
        };
        validateState(newState);
        return newState;
      }

      case 'REMOVE_TOAST': {
        const newState = action.toastId === undefined
          ? {
              ...state,
              toasts: [],
            }
          : {
              ...state,
              toasts: state.toasts.filter((t) => t.id !== action.toastId),
            };
        validateState(newState);
        return newState;
      }
    }
  } catch (error) {
    console.error('Toast reducer error:', error);
    return state;
  }
};

/**
 * Dispatches an action to update toast state
 * @param action - Action to dispatch
 * @throws {ToastError} If action is invalid
 */
function dispatch(action: Action): void {
  try {
    actionSchema.parse(action);
    memoryState = reducer(memoryState, action);
    listeners.forEach((listener) => {
      listener(memoryState);
    });
  } catch (error) {
    console.error('Toast dispatch error:', error);
  }
}

type Toast = Omit<ToasterToast, 'id'>;

/**
 * Creates and manages a toast notification
 * @param props - Toast properties
 * @returns Object containing toast control functions
 * @throws {ToastError} If toast properties are invalid
 */
function toast(props: Toast): ToastResult {
  try {
    const id = genId();

    const update = (props: Partial<ToasterToast>) => {
      try {
        toastSchema.partial().parse(props);
        dispatch({
          type: 'UPDATE_TOAST',
          toast: { ...props, id },
        });
      } catch (error) {
        console.error('Toast update error:', error);
      }
    };

    const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

    const newToast: ToasterToast = {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
        props.onOpenChange?.(open);
      },
    };

    validateToast(newToast);

    dispatch({
      type: 'ADD_TOAST',
      toast: newToast,
    });

    const result: ToastResult = {
      id,
      dismiss,
      update,
    };

    // Make the result immutable
    return Object.freeze(result);
  } catch (error) {
    console.error('Toast creation error:', error);
    throw new ToastError('Failed to create toast');
  }
}

/**
 * Hook for managing toast notifications
 * @returns Object containing toast state and control functions
 * @throws {ToastError} If state becomes invalid
 */
function useToast(): UseToastResult {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({
      type: 'DISMISS_TOAST',
      toastId,
    }),
  };
}

export { toast };
export { useToast };
