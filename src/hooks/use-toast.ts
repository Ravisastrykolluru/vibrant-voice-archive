
import * as React from "react";
import {
  type ToastActionElement,
  type ToastProps,
} from "@/components/ui/toast";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: string;
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: string;
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
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
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

// Create a context for toast state management
const ToastContext = React.createContext<{
  toasts: ToasterToast[];
  dispatch: React.Dispatch<Action>;
}>({
  toasts: [],
  dispatch: () => null
});

// Create the provider for the toast context
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = React.useReducer(reducer, { toasts: [] });

  React.useEffect(() => {
    return () => {
      toastTimeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, dispatch }}>
      {children}
    </ToastContext.Provider>
  );
};

// Initialize the provider at the module level for global access
const [state, dispatch] = { toasts: [] as ToasterToast[], dispatch: (action: Action) => {
  const { Provider, Consumer } = ToastContext;
  const provider = document.querySelector('[data-toast-provider="true"]');
  
  if (provider) {
    const providerInstance = React.createRef<{ dispatch: React.Dispatch<Action> }>();
    React.render(<Consumer>{(ctx) => {
      if (providerInstance.current) {
        providerInstance.current.dispatch = ctx.dispatch;
      }
      return null;
    }}</Consumer>, provider);
    
    if (providerInstance.current) {
      providerInstance.current.dispatch(action);
    }
  }
} };

export const useToast = () => {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const toast = React.useCallback(
    ({ ...props }: Omit<ToasterToast, "id">) => {
      const id = genId();

      context.dispatch({
        type: "ADD_TOAST",
        toast: {
          ...props,
          id,
          open: true,
          onOpenChange: (open) => {
            if (!open) context.dispatch({ type: "DISMISS_TOAST", toastId: id });
          },
        },
      });

      return {
        id: id,
        dismiss: () => context.dispatch({ type: "DISMISS_TOAST", toastId: id }),
        update: (props: Omit<ToasterToast, "id">) =>
          context.dispatch({
            type: "UPDATE_TOAST",
            toast: { ...props, id },
          }),
      };
    },
    [context.dispatch]
  );

  return {
    toast,
    toasts: context.toasts,
    dismiss: (toastId?: string) => context.dispatch({ type: "DISMISS_TOAST", toastId }),
  };
};

// Create a separate toast function for direct use
export const toast = ({ ...props }: Omit<ToasterToast, "id">) => {
  const id = genId();

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dispatch({ type: "DISMISS_TOAST", toastId: id });
      },
    },
  });

  return {
    id: id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
    update: (props: Omit<ToasterToast, "id">) =>
      dispatch({
        type: "UPDATE_TOAST",
        toast: { ...props, id },
      }),
  };
};
