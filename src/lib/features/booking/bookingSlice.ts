import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BookingState {
  service: string; // Quitamos el null
  professional: string; // Quitamos el null
  date: string | null;
  time: string | null;
  status: 'idle' | 'loading' | 'success' | 'failed';
}

const initialState: BookingState = {
  service: "Entrenamiento Personalizado", // Valor fijo por defecto
  professional: "Pamela", // Valor fijo por defecto
  date: null,
  time: null,
  status: 'idle',
};

export const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setService: (state, action: PayloadAction<string>) => {
      state.service = action.payload;
    },
    setProfessional: (state, action: PayloadAction<string>) => {
      state.professional = action.payload;
    },
    setDateTime: (state, action: PayloadAction<{ date: string; time: string }>) => {
      if (action.payload.date) state.date = action.payload.date;
      if (action.payload.time) state.time = action.payload.time;
    },
    resetBooking: (state) => {
      state.date = null;
      state.time = null;
      state.status = 'idle';
      // Mantenemos servicio y profesional fijos
    },
  },
});

export const { setService, setDateTime, setProfessional, resetBooking } = bookingSlice.actions;
export default bookingSlice.reducer;