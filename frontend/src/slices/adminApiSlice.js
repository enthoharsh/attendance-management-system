import { apiSlice } from './apiSlice';

const ADMIN_URL = '/api/admin';

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTeamAttendance: builder.query({
      query: () => ({
        url: `${ADMIN_URL}/team-attendance`,
      }),
      providesTags: ['Attendance'],
    }),
    validateAttendance: builder.mutation({
      query: ({ id, data }) => ({
        url: `${ADMIN_URL}/attendance/${id}/validate`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Attendance'],
    }),
    getAllUsers: builder.query({
      query: () => ({
        url: `${ADMIN_URL}/users`,
      }),
      providesTags: ['Users'],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `${ADMIN_URL}/users/${id}/role`,
        method: 'PUT',
        body: { role },
      }),
      invalidatesTags: ['Users'],
    }),
    assignManager: builder.mutation({
      query: ({ id, managerId }) => ({
        url: `${ADMIN_URL}/users/${id}/manager`,
        method: 'PUT',
        body: { managerId },
      }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const {
  useGetTeamAttendanceQuery,
  useValidateAttendanceMutation,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useAssignManagerMutation,
} = adminApiSlice;
