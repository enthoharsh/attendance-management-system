import { apiSlice } from './apiSlice';

const OVERTIME_URL = '/api/overtime';

export const overtimeApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    requestOvertime: builder.mutation({
      query: (data) => ({
        url: `${OVERTIME_URL}/request`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Overtime'],
    }),
    getMyOvertimeRequests: builder.query({
      query: () => ({
        url: `${OVERTIME_URL}/my-requests`,
      }),
      providesTags: ['Overtime'],
    }),
    getTeamOvertimeRequests: builder.query({
      query: () => ({
        url: `${OVERTIME_URL}/team-requests`,
      }),
      providesTags: ['Overtime'],
    }),
    reviewOvertime: builder.mutation({
      query: ({ id, data }) => ({
        url: `${OVERTIME_URL}/${id}/review`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Overtime'],
    }),
  }),
});

export const {
  useRequestOvertimeMutation,
  useGetMyOvertimeRequestsQuery,
  useGetTeamOvertimeRequestsQuery,
  useReviewOvertimeMutation,
} = overtimeApiSlice;
