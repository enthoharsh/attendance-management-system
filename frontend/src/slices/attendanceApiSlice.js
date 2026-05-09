import { apiSlice } from './apiSlice';

const ATTENDANCE_URL = '/api/attendance';

export const attendanceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    punchIn: builder.mutation({
      query: (formData) => ({
        url: `${ATTENDANCE_URL}/punch-in`,
        method: 'POST',
        body: formData, 
      }),
      invalidatesTags: ['Attendance'],
    }),
    punchOut: builder.mutation({
      query: (formData) => ({
        url: `${ATTENDANCE_URL}/punch-out`,
        method: 'PUT',
        body: formData, 
      }),
      invalidatesTags: ['Attendance'],
    }),
    getMyAttendance: builder.query({
      query: () => ({
        url: `${ATTENDANCE_URL}/my-records`,
        method: 'GET',
      }),
      providesTags: ['Attendance'],
    }),
  }),
});

export const {
  usePunchInMutation,
  usePunchOutMutation,
  useGetMyAttendanceQuery,
} = attendanceApiSlice;
