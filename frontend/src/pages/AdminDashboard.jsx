import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle, XCircle, Eye, CheckCircle2, UserCog } from 'lucide-react';
import {
  useGetTeamAttendanceQuery,
  useValidateAttendanceMutation,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useAssignManagerMutation,
} from '../slices/adminApiSlice';
import {
  useGetTeamOvertimeRequestsQuery,
  useReviewOvertimeMutation,
} from '../slices/overtimeApiSlice';
import { logout } from '../slices/authSlice';

import { apiSlice } from '../slices/apiSlice';

const AdminDashboard = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('attendance');

  const { data: records, isLoading: attLoading, refetch: refetchAtt } = useGetTeamAttendanceQuery();
  const [validateAttendance, { isLoading: isValidating }] = useValidateAttendanceMutation();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [remarks, setRemarks] = useState('');

  const { data: otRequests, isLoading: otLoading, refetch: refetchOt } = useGetTeamOvertimeRequestsQuery();
  const [reviewOT, { isLoading: isReviewingOT }] = useReviewOvertimeMutation();

  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useGetAllUsersQuery(undefined, {
    skip: userInfo?.role !== 'admin'
  });
  const [updateRole] = useUpdateUserRoleMutation();
  const [assignManager] = useAssignManagerMutation();

  const handleLogout = () => {
    dispatch(logout());
    dispatch(apiSlice.util.resetApiState());
    navigate('/login');
  };

  const handleValidate = async (status) => {
    try {
      await validateAttendance({
        id: selectedRecord._id,
        data: { status, remarks },
      }).unwrap();
      setSelectedRecord(null);
      setRemarks('');
      refetchAtt();
    } catch (err) {
      alert(err?.data?.message || 'Failed to validate attendance');
    }
  };

  const handleOTReview = async (id, status) => {
    try {
      await reviewOT({
        id,
        data: { status },
      }).unwrap();
      refetchOt();
    } catch (err) {
      alert(err?.data?.message || 'Failed to review OT request');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateRole({ id: userId, role: newRole }).unwrap();
      refetchUsers();
    } catch (err) {
      alert(err?.data?.message || 'Failed to update role');
    }
  };

  const handleManagerChange = async (userId, newManagerId) => {
    try {
      await assignManager({ id: userId, managerId: newManagerId || null }).unwrap();
      refetchUsers();
    } catch (err) {
      alert(err?.data?.message || 'Failed to assign manager');
    }
  };

  const managers = usersData?.filter(u => u.role === 'manager') || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            {userInfo?.role === 'admin' ? 'Admin Dashboard' : 'Manager Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {userInfo?.name} ({userInfo?.role})
            </span>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              My Attendance
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

        <div className="flex space-x-4 mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            className={`pb-3 px-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'attendance'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('attendance')}
          >
            Daily Attendance Reports
          </button>
          <button
            className={`pb-3 px-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'overtime'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('overtime')}
          >
            Overtime Requests
          </button>
          {userInfo?.role === 'admin' && (
            <button
              className={`pb-3 px-4 font-medium text-sm transition-colors whitespace-nowrap flex items-center ${activeTab === 'users'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              onClick={() => setActiveTab('users')}
            >
              <UserCog className="w-4 h-4 mr-2" />
              User Management
            </button>
          )}
        </div>

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Team Attendance Records</h3>
            </div>

            <div className="overflow-x-auto">
              {attLoading ? (
                <div className="p-6 text-center text-gray-500">Loading records...</div>
              ) : records && records.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                      <th className="px-6 py-4 font-medium">Employee</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Punch In</th>
                      <th className="px-6 py-4 font-medium">Punch Out</th>
                      <th className="px-6 py-4 font-medium">Hours</th>
                      <th className="px-6 py-4 font-medium">Validation</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{record.userId?.name}</div>
                          <div className="text-xs text-gray-500">{record.userId?.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{record.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(record.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {record.punchOut?.time
                            ? new Date(record.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {record.workingHours ? `${record.workingHours} hrs` : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.validation?.status === 'valid' ? 'bg-green-100 text-green-800' :
                            record.validation?.status === 'invalid' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                            {record.validation?.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedRecord(record);
                              setRemarks(record.validation?.remarks || '');
                            }}
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray-500">No records found for your team.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'overtime' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Overtime Requests</h3>
            </div>

            <div className="overflow-x-auto">
              {otLoading ? (
                <div className="p-6 text-center text-gray-500">Loading requests...</div>
              ) : otRequests && otRequests.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                      <th className="px-6 py-4 font-medium">Employee</th>
                      <th className="px-6 py-4 font-medium">Attendance Date</th>
                      <th className="px-6 py-4 font-medium">Reg. Hours</th>
                      <th className="px-6 py-4 font-medium">OT Hours Req.</th>
                      <th className="px-6 py-4 font-medium w-1/4">Reason</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {otRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{req.userId?.name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{req.attendanceId?.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{req.attendanceId?.workingHours} hrs</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{req.hoursRequested} hrs</td>
                        <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${req.status === 'approved' ? 'bg-green-100 text-green-800' :
                            req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                            {req.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {req.status === 'pending' ? (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleOTReview(req._id, 'approved')}
                                disabled={isReviewingOT}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Approve"
                              >
                                <CheckCircle2 className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleOTReview(req._id, 'rejected')}
                                disabled={isReviewingOT}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Reject"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray-500">No overtime requests found.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && userInfo?.role === 'admin' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">User Management & Hierarchy</h3>
            </div>

            <div className="overflow-x-auto">
              {usersLoading ? (
                <div className="p-6 text-center text-gray-500">Loading users...</div>
              ) : usersData && usersData.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                      <th className="px-6 py-4 font-medium">User Details</th>
                      <th className="px-6 py-4 font-medium w-48">Role Assignment</th>
                      <th className="px-6 py-4 font-medium w-64">Manager Assignment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usersData.map((user) => {
                      const isSelf = user._id === userInfo._id;
                      const isAdmin = user.role === 'admin';
                      const isManager = user.role === 'manager';

                      return (
                        <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {user.name}
                              {isSelf && <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">You</span>}
                            </div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            {isSelf ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                ADMIN (Non-editable)
                              </span>
                            ) : (
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="employee">Employee</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isAdmin || isManager ? (
                              <span className="text-sm text-gray-400 italic">
                                {isAdmin ? 'Admins cannot have managers' : 'Managers cannot have managers'}
                              </span>
                            ) : (
                              <select
                                value={user.managerId?._id || ''}
                                onChange={(e) => handleManagerChange(user._id, e.target.value)}
                                className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">-- No Manager --</option>
                                {managers.map(m => (
                                  <option key={m._id} value={m._id}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray-500">No users found.</div>
              )}
            </div>
          </div>
        )}

        {/* Validation Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 text-gray-900 border-b pb-2">
                Review Attendance - {selectedRecord.userId?.name}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Punch In Image</h4>
                  <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200 aspect-video">
                    <img
                      src={selectedRecord.punchIn.selfieUrl}
                      alt="Punch In Selfie"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 break-all">
                    Location: {selectedRecord.punchIn.location?.lat}, {selectedRecord.punchIn.location?.lng}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Punch Out Image</h4>
                  {selectedRecord.punchOut?.time ? (
                    <>
                      <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200 aspect-video">
                        <img
                          src={selectedRecord.punchOut.selfieUrl}
                          alt="Punch Out Selfie"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500 break-all">
                        Location: {selectedRecord.punchOut.location?.lat}, {selectedRecord.punchOut.location?.lng}
                      </p>
                    </>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 border-dashed rounded-lg flex items-center justify-center h-full min-h-[150px] text-gray-400">
                      Not Punched Out Yet
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Validation Remarks (Required for rejection)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Enter remarks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                ></textarea>

                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="px-4 py-2 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleValidate('invalid')}
                    disabled={isValidating || !remarks.trim()}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Mark Invalid
                  </button>
                  <button
                    onClick={() => handleValidate('valid')}
                    disabled={isValidating}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Valid
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
