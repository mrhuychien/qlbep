'use client';

// Rút gọn từ shadcn/ui — chỉ giữ phần app dùng thật.
import * as React from 'react';
import type { ToastActionElement, ToastProps } from './toast';

const GIOI_HAN = 3;
const TU_TAT_MS = 3500;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

let dem = 0;
function nextId() {
  dem = (dem + 1) % Number.MAX_SAFE_INTEGER;
  return String(dem);
}

type State = { toasts: ToasterToast[] };

const listeners: Array<(s: State) => void> = [];
let memoryState: State = { toasts: [] };

function setState(next: State) {
  memoryState = next;
  listeners.forEach((l) => l(memoryState));
}

const heNgo = new Map<string, ReturnType<typeof setTimeout>>();

function henXoa(id: string) {
  if (heNgo.has(id)) return;
  heNgo.set(
    id,
    setTimeout(() => {
      heNgo.delete(id);
      setState({ toasts: memoryState.toasts.filter((t) => t.id !== id) });
    }, 200),
  );
}

function dong(id?: string) {
  setState({
    toasts: memoryState.toasts.map((t) => (id === undefined || t.id === id ? { ...t, open: false } : t)),
  });
  if (id) henXoa(id);
  else memoryState.toasts.forEach((t) => henXoa(t.id));
}

export function toast({ ...props }: Omit<ToasterToast, 'id'>) {
  const id = nextId();
  const t: ToasterToast = {
    ...props,
    id,
    open: true,
    onOpenChange: (open: boolean) => {
      if (!open) dong(id);
    },
  };
  setState({ toasts: [t, ...memoryState.toasts].slice(0, GIOI_HAN) });
  setTimeout(() => dong(id), TU_TAT_MS);
  return { id, dismiss: () => dong(id) };
}

/** Tiện dụng: toastOk('Đã lưu đơn') */
export const toastOk = (title: string, description?: string) =>
  toast({ title, description, variant: 'success' });

/** Lỗi phải nói CÁI GÌ → LÀM GÌ, không chỉ "Có lỗi xảy ra". */
export const toastLoi = (title: string, description?: string) =>
  toast({ title, description, variant: 'destructive' });

export function useToast() {
  const [state, setLocal] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setLocal);
    return () => {
      const i = listeners.indexOf(setLocal);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);

  return { ...state, toast, dismiss: dong };
}
