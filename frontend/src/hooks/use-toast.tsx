import * as React from "react"

type ToastActionElement = React.ReactElement<{
  altText: string
  onClick: () => void
}>

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: ToastActionElement
  variant?: "default" | "destructive"
}

type ToastState = {
  toasts: Toast[]
}

type Action =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "UPDATE_TOAST"; toast: Partial<Toast> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string }

const listeners: Array<(state: ToastState) => void> = []

let memoryState: ToastState = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function reducer(state: ToastState, action: Action): ToastState {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, 5), // 最多显示5个toast
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== toastId),
        }
      }

      return {
        ...state,
        toasts: [],
      }
    }

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, 5000)

  toastTimeouts.set(toastId, timeout)
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast: ({ ...props }: Omit<Toast, "id">) => {
      const id = String(Date.now())

      const update = (props: Partial<Toast>) =>
        dispatch({
          type: "UPDATE_TOAST",
          toast: { ...props, id },
        })

      const dismiss = () => {
        dispatch({ type: "DISMISS_TOAST", toastId: id })
        addToRemoveQueue(id)
      }

      dispatch({
        type: "ADD_TOAST",
        toast: {
          ...props,
          id,
        },
      })

      addToRemoveQueue(id)

      return {
        id,
        dismiss,
        update,
      }
    },
    dismiss: (toastId?: string) => {
      dispatch({ type: "DISMISS_TOAST", toastId })
    },
  }
}

export function toast(props: Omit<Toast, "id">) {
  const id = String(Date.now())

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
    },
  })

  addToRemoveQueue(id)

  return {
    id,
    dismiss: () => {
      dispatch({ type: "DISMISS_TOAST", toastId: id })
      addToRemoveQueue(id)
    },
  }
}
