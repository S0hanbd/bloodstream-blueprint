import { useState, useEffect } from "react";

export interface AppStoreState {
  bloodGroup: string;
  searchQuery: string;
  selectedDonorId: string | null;
}

const initialState: AppStoreState = {
  bloodGroup: "ALL",
  searchQuery: "",
  selectedDonorId: null,
};

let globalState: AppStoreState = { ...initialState };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function useAppStore() {
  const [state, setState] = useState<AppStoreState>(globalState);

  useEffect(() => {
    const listener = () => setState(globalState);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setBloodGroup = (bloodGroup: string) => {
    globalState = { ...globalState, bloodGroup };
    notify();
  };

  const setSearchQuery = (searchQuery: string) => {
    globalState = { ...globalState, searchQuery };
    notify();
  };

  const setSelectedDonorId = (selectedDonorId: string | null) => {
    globalState = { ...globalState, selectedDonorId };
    notify();
  };

  const resetFilters = () => {
    globalState = { ...globalState, bloodGroup: "ALL", searchQuery: "" };
    notify();
  };

  return {
    ...state,
    setBloodGroup,
    setSearchQuery,
    setSelectedDonorId,
    resetFilters,
  };
}
