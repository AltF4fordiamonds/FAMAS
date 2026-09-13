import React, { useState, useEffect } from 'react';
import {
  Route,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  User,
  Calendar,
  Fuel,
  ArrowRight,
  AlertCircle,
  X,
  PlayCircle,
  Flag,
  Trash2,
  Edit2,
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Trip, TripStatus, Driver, Vehicle } from '../types.js';
import { StatusBadge, PlateBadge } from '../components/StatusBadge.js';

export const TripsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isDispatcher = user?.role === 'dispatcher';
  const isDriver = user?.role === 'driver';
  const canCreate = isAdmin || isDispatcher;

  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [updatingTrip, setUpdatingTrip] = useState<Trip | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Trip | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Create Form
  const defaultCreateForm = {
    origin: '',
    destination: '',
    cargo: '',
    deadline: '',
    driverId: '',
    vehicleId: '',
    distance: 0,
    fuelUsed: 0,
  };
  const [createForm, setCreateForm] = useState(defaultCreateForm);

  // Status / Complete Form
  const [statusUpdateForm, setStatusUpdateForm] = useState<{
    status: TripStatus;
    distance: number;
    fuelUsed: number;
  }>({
    status: 'in_progress',
    distance: 0,
    fuelUsed: 0,
  });

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/trips', {
        params: {
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      });
      setTrips(res.data.trips || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    if (!canCreate) return;
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        api.get('/drivers'),
        api.get('/vehicles'),
      ]);
      setDrivers(driversRes.data.drivers || []);
      setVehicles(vehiclesRes.data.vehicles || []);
    } catch (err) {
      console.error('Failed to load form resources', err);
    }
  };

  useEffect(() => {
    fetchTrips();
    fetchResources();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrips();
  };

  const openCreateModal = () => {
    setCreateForm(defaultCreateForm);
    setModalError(null);
    setIsCreateModalOpen(true);
  };

  const openStatusModal = (trip: Trip) => {
    setUpdatingTrip(trip);
    setStatusUpdateForm({
      status:
        trip.status === 'planned'
          ? 'in_progress'
          : trip.status === 'in_progress'
          ? 'completed'
          : trip.status,
      distance: trip.distance || 0,
      fuelUsed: trip.fuelUsed || 0,
    });
    setModalError(null);
    setStatusModalOpen(true);
  };

  const handleCreateTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      await api.post('/trips', {
        origin: createForm.origin,
        destination: createForm.destination,
        cargo: createForm.cargo,
        deadline: createForm.deadline,
        driver: createForm.driverId,
        vehicle: createForm.vehicleId,
        distance: Number(createForm.distance) || 0,
        fuelUsed: Number(createForm.fuelUsed) || 0,
      });
      setIsCreateModalOpen(false);
      fetchTrips();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to dispatch trip');
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingTrip) return;
    setModalLoading(true);
    setModalError(null);

    try {
      await api.put(`/trips/${updatingTrip._id}`, {
        status: statusUpdateForm.status,
        distance: Number(statusUpdateForm.distance),
        fuelUsed: Number(statusUpdateForm.fuelUsed),
      });
      setStatusModalOpen(false);
      setUpdatingTrip(null);
      fetchTrips();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to update trip progress');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!deleteCandidate) return;
    setModalLoading(true);
    setModalError(null);

    try {
      await api.delete(`/trips/${deleteCandidate._id}`);
      setDeleteCandidate(null);
      fetchTrips();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to delete trip');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isDriver ? 'My Assigned Trips' : 'Freight Deliveries & Trip Dispatches'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isDriver
              ? 'Update journey progress, log final distance traveled, and record fuel receipts.'
              : 'Dispatch vehicles, allocate qualified drivers, and monitor commercial routes.'}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch New Trip</span>
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search origin, destination, cargo, driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Trips</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      {/* Trips Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-5 py-3">Route (Origin &rarr; Destination)</th>
                <th className="px-4 py-3">Cargo Description</th>
                <th className="px-4 py-3">Assigned Vehicle</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Distance & Fuel</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    Loading commercial trip logs...
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No trips found matching the specified parameters.
                  </td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                        <span>{t.origin}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{t.destination}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-700 max-w-xs truncate">
                      {t.cargo}
                    </td>
                    <td className="px-4 py-3.5">
                      {t.vehicle ? (
                        <div className="flex items-center gap-2">
                          <PlateBadge plate={t.vehicle.registrationNumber} />
                          <span className="text-[11px] text-slate-500">{t.vehicle.make}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {t.driver ? (
                        <span>
                          {t.driver.firstName} {t.driver.lastName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                      {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={t.status} type="trip" />
                    </td>
                    <td className="px-4 py-3.5 text-[11px] space-y-0.5">
                      <div className="font-mono text-slate-800 font-medium">
                        {t.distance ? `${t.distance.toLocaleString()} km` : '—'}
                      </div>
                      {t.fuelUsed > 0 ? (
                        <div className="text-slate-600 flex items-center gap-1">
                          <Fuel className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{t.fuelUsed} L</span>
                          {t.distance > 0 && (
                            <span className="font-mono text-[10px] text-slate-400">
                              ({((t.fuelUsed / t.distance) * 100).toFixed(1)} L/100km)
                            </span>
                          )}
                        </div>
                      ) : (
                        t.status === 'completed' && (
                          <div className="text-slate-400 text-[10px] italic">0 L recorded</div>
                        )
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Status Update Button: Available for Driver and Admin/Dispatcher */}
                        {t.status !== 'completed' && t.status !== 'cancelled' && (
                          <button
                            onClick={() => openStatusModal(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition-colors"
                            title="Update Journey Status"
                          >
                            {t.status === 'planned' ? (
                              <>
                                <PlayCircle className="w-3.5 h-3.5" />
                                <span>Start Trip</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Complete</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Admin Delete */}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setDeleteCandidate(t);
                              setModalError(null);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete Trip"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Trip Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Dispatch New Commercial Trip</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateTripSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Origin *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rotterdam Port Terminal"
                    value={createForm.origin}
                    onChange={(e) => setCreateForm({ ...createForm, origin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Destination *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frankfurt Logistics Hub"
                    value={createForm.destination}
                    onChange={(e) => setCreateForm({ ...createForm, destination: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Cargo Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automotive Spare Parts, 24 tons palletized"
                  value={createForm.cargo}
                  onChange={(e) => setCreateForm({ ...createForm, cargo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Delivery Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.deadline}
                    onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Estimated Distance (km)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={createForm.distance}
                    onChange={(e) => setCreateForm({ ...createForm, distance: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Assign Driver *
                  </label>
                  <select
                    required
                    value={createForm.driverId}
                    onChange={(e) => setCreateForm({ ...createForm, driverId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    <option value="">Select Qualified Driver...</option>
                    {drivers.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.firstName} {d.lastName} ({d.licenseCategory}) — {d.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Assign Vehicle *
                  </label>
                  <select
                    required
                    value={createForm.vehicleId}
                    onChange={(e) => setCreateForm({ ...createForm, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    <option value="">Select Transport Vehicle...</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.registrationNumber} — {v.make} {v.model} ({v.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {modalLoading ? 'Dispatching...' : 'Dispatch Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trip Status Transition Modal (Driver / Dispatcher / Admin) */}
      {statusModalOpen && updatingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Update Trip: {updatingTrip.origin} &rarr; {updatingTrip.destination}
              </h3>
              <button onClick={() => setStatusModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleStatusUpdateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Update Journey Status
                </label>
                <select
                  value={statusUpdateForm.status}
                  onChange={(e) =>
                    setStatusUpdateForm({
                      ...statusUpdateForm,
                      status: e.target.value as TripStatus,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress (Active Journey)</option>
                  <option value="completed">Completed (Delivered)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Actual Distance Traveled (km)
                </label>
                <input
                  type="number"
                  min={0}
                  value={statusUpdateForm.distance}
                  onChange={(e) =>
                    setStatusUpdateForm({
                      ...statusUpdateForm,
                      distance: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Actual Fuel Consumed (Liters)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={statusUpdateForm.fuelUsed}
                  onChange={(e) =>
                    setStatusUpdateForm({
                      ...statusUpdateForm,
                      fuelUsed: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              {statusUpdateForm.status === 'completed' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] leading-relaxed">
                  <strong>Automatic Workflow:</strong> Marking this trip as completed will automatically release the assigned vehicle and driver back to Available status, and add the distance to the vehicle odometer.
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : 'Apply Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-6">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Delete Trip Record</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete the trip from{' '}
              <strong className="text-slate-900">{deleteCandidate.origin}</strong> to{' '}
              <strong className="text-slate-900">{deleteCandidate.destination}</strong>?
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTrip}
                disabled={modalLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
              >
                {modalLoading ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
