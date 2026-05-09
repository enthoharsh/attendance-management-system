import { useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { MapPin, Camera, LogOut, CheckCircle2, Clock, PlusCircle } from 'lucide-react';
import {
  useGetMyAttendanceQuery,
  usePunchInMutation,
  usePunchOutMutation,
} from '../slices/attendanceApiSlice';
import {
  useGetMyOvertimeRequestsQuery,
  useRequestOvertimeMutation,
} from '../slices/overtimeApiSlice';
import { logout } from '../slices/authSlice';
import { apiSlice } from '../slices/apiSlice';
import { dataURItoBlob } from '../utils/dataURItoBlob';

const Dashboard = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: attendanceRecords, isLoading: recordsLoading, refetch: refetchAttendance } = useGetMyAttendanceQuery();
  const { data: otRequests, isLoading: otLoading, refetch: refetchOt } = useGetMyOvertimeRequestsQuery();

  const [punchIn, { isLoading: isPunchingIn }] = usePunchInMutation();
  const [punchOut, { isLoading: isPunchingOut }] = usePunchOutMutation();
  const [requestOT, { isLoading: isRequestingOT }] = useRequestOvertimeMutation();

  const [showCamera, setShowCamera] = useState(false);
  const [actionType, setActionType] = useState('');
  const [geoError, setGeoError] = useState('');
  const [actionError, setActionError] = useState('');

  const [showOTModal, setShowOTModal] = useState(false);
  const [otAttendanceId, setOtAttendanceId] = useState(null);
  const [otHours, setOtHours] = useState('');
  const [otReason, setOtReason] = useState('');

  const webcamRef = useRef(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysRecord = attendanceRecords?.find((r) => r.date === todayStr);

  const hasPunchedIn = !!todaysRecord;
  const hasPunchedOut = !!(todaysRecord && todaysRecord.punchOut?.time);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(apiSlice.util.resetApiState());
    navigate('/login');
  };

  const startAction = (type) => {
    setActionError('');
    setGeoError('');
    setActionType(type);
    setShowCamera(true);
  };

  const captureAndSubmit = useCallback(async () => {
    setActionError('');
    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      setActionError('Failed to capture selfie. Please try again.');
      return;
    }

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const blob = dataURItoBlob(imageSrc);

          const formData = new FormData();
          formData.append('selfie', blob, 'selfie.jpg');
          formData.append('lat', latitude);
          formData.append('lng', longitude);

          if (actionType === 'in') {
            await punchIn(formData).unwrap();
          } else {
            await punchOut(formData).unwrap();
          }

          setShowCamera(false);
          refetchAttendance();
        } catch (err) {
          setActionError(err?.data?.message || 'Action failed. Are you within the office radius?');
        }
      },
      (error) => {
        setGeoError('Please allow location access to punch in/out.');
      },
      { enableHighAccuracy: true }
    );
  }, [webcamRef, actionType, punchIn, punchOut, refetchAttendance]);

  const handleOTSubmit = async (e) => {
    e.preventDefault();
    try {
      await requestOT({
        attendanceId: otAttendanceId,
        hoursRequested: Number(otHours),
        reason: otReason,
      }).unwrap();
      setShowOTModal(false);
      setOtHours('');
      setOtReason('');
      refetchOt();
    } catch (err) {
      alert(err?.data?.message || 'Failed to request overtime');
    }
  };

  const hasOTRequest = (attendanceId) => {
    return otRequests?.some((req) => req.attendanceId?._id === attendanceId);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Attendance Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Hello, {userInfo?.name}</span>
            {userInfo?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Admin Dashboard
              </button>
            )}
            {userInfo?.role === 'manager' && (
              <button
                onClick={() => navigate('/manager')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Manager Dashboard
              </button>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold text-gray-900">Today's Status</h2>
            <p className="text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex space-x-4">
            {!hasPunchedIn ? (
              <button
                onClick={() => startAction('in')}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
              >
                <MapPin className="h-5 w-5 mr-2" />
                Punch In
              </button>
            ) : !hasPunchedOut ? (
              <button
                onClick={() => startAction('out')}
                className="flex items-center px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors shadow-md"
              >
                <Clock className="h-5 w-5 mr-2" />
                Punch Out
              </button>
            ) : (
              <div className="flex items-center px-6 py-3 bg-green-50 text-green-700 rounded-lg font-medium border border-green-200">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Shift Completed
              </div>
            )}
          </div>
        </div>

        {showCamera && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Camera className="h-5 w-5 mr-2 text-gray-600" />
                Capture Live Selfie
              </h3>

              <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-video mb-4">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                  videoConstraints={{ facingMode: "user" }}
                />
              </div>

              {(geoError || actionError) && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                  {geoError || actionError}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCamera(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={captureAndSubmit}
                  disabled={isPunchingIn || isPunchingOut}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isPunchingIn || isPunchingOut ? 'Processing...' : `Confirm Punch ${actionType === 'in' ? 'In' : 'Out'}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {showOTModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Request Overtime</h3>
              <form onSubmit={handleOTSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours Requested</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={otHours}
                    onChange={(e) => setOtHours(e.target.value)}
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    required
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={otReason}
                    onChange={(e) => setOtReason(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowOTModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRequestingOT}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isRequestingOT ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recent Attendance</h3>
            </div>

            <div className="overflow-x-auto">
              {recordsLoading ? (
                <div className="p-6 text-center text-gray-500">Loading records...</div>
              ) : attendanceRecords && attendanceRecords.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Punch In</th>
                      <th className="px-6 py-4 font-medium">Punch Out</th>
                      <th className="px-6 py-4 font-medium">Hours</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendanceRecords.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50 transition-colors">
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
                        <td className="px-6 py-4 text-right">
                          {record.status === 'completed' && !hasOTRequest(record._id) ? (
                            <button
                              onClick={() => {
                                setOtAttendanceId(record._id);
                                setShowOTModal(true);
                              }}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center justify-end"
                            >
                              <PlusCircle className="h-3 w-3 mr-1" /> OT Request
                            </button>
                          ) : hasOTRequest(record._id) ? (
                            <span className="text-xs text-gray-500">OT Requested</span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray-500">No attendance records found.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">My OT Requests</h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto max-h-[500px]">
              {otLoading ? (
                <div className="text-center text-gray-500">Loading requests...</div>
              ) : otRequests && otRequests.length > 0 ? (
                <div className="space-y-4">
                  {otRequests.map(req => (
                    <div key={req._id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-900">{req.attendanceId?.date}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${req.status === 'approved' ? 'bg-green-100 text-green-800' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600"><span className="font-medium">Hours:</span> {req.hoursRequested}</p>
                      <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Reason:</span> {req.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-4">No overtime requests made.</div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
