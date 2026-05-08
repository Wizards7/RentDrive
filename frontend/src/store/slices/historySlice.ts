import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/src/store";

interface HistoryState {
  selectedTripId: string | null;
}

const initialState: HistoryState = {
  selectedTripId: null,
};

export const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    selectTrip(state, action: PayloadAction<string | null>) {
      state.selectedTripId = action.payload;
    },
  },
});

export const { selectTrip } = historySlice.actions;
export const selectSelectedTripId = (s: RootState) => s.history.selectedTripId;
