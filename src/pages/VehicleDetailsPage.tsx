import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Truck,
  ArrowLeft,
  Calendar,
  Wrench,
  Fuel,
  Gauge,
  Shield,
  FileCheck,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  User,
  Phone,
  Route,
  Clock,
  X,
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { Vehicle, Repair } from '../types.js';
import { StatusBadge, PlateBadge } from '../components/StatusBadge.js';

export const VehicleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Repair Modal state
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
  const [repairForm, setRepairForm] = useState({
    description: '',
    cost: 0,
    serviceProvider: '',
    repairDate: new Date().toISOString().split('T')[0],
    mileage: 0,
    notes: '',
  });
  const [repairModalLoading, setRepairModalLoading] = useState(false);
  const [repairModalError, setRepairModalError] = useState<string | null>(null);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/vehicles/${id}`);
      setVehicle(res.data.vehicle);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchVehicleDetails();
    }
  }, [id]);

  const openAddRepairModal = () => {
    setEditingRepair(null);
    setRepairForm({
      description: '',
      cost: 450,
      serviceProvider: '',
      repairDate: new Date().toISOString().split('T')[0],
      mileage: vehicle?.currentMileage || 0,
      notes: '',
    });
    setRepairModalError(null);
    setIsRepairModalOpen(true);
  };

  const openEditRepairModal = (repair: Repair) => {
    setEditingRepair(repair);
    setRepairForm({
      description: repair.description,
      cost: repair.cost,
      serviceProvider: repair.serviceProvider,
      repairDate: repair.repairDate
        ? new Date(repair.repairDate).toISOString().split('T')[0]
        : '',
      mileage: repair.mileage || 0,
      notes: repair.notes || '',
    });
    setRepairModalError(null);
    setIsRepairModalOpen(true);
  };

  const handleSaveRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setRepairModalLoading(true);
    setRepairModalError(null);

    const payload = {
      description: repairForm.description,
      cost: Number(repairForm.cost),
      serviceProvider: repairForm.serviceProvider,
      repairDate: repairForm.repairDate,
      mileage: Number(repairForm.mileage),
      notes: repairForm.notes,
    };

    try {
      if (editingRepair) {
        await api.put(`/repairs/${editingRepair._id}`, payload);
      } else {
        await api.post(`/vehicles/${id}/repairs`, payload);
      }
      setIsRepairModalOpen(false);
      setEditingRepair(null);
      fetchVehicleDetails();
    } catch (err: any) {
      setRepairModalError(err.response?.data?.message || 'Failed to save repair log');
    } finally {
      setRepairModalLoading(false);
    }
  };

  const handleDeleteRepair = async (repairId: string) => {
    if (!window.confirm('Are you sure you want to delete this repair record?')) return;
    try {
      await api.delete(`/repairs/${repairId}`);
      fetchVehicleDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete repair');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-xs font-medium">
        Loading vehicle specification and maintenance logs...
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
        <p className="font-bold">{error || 'Vehicle not found'}</p>
        <Link to="/vehicles" className="text-blue-600 font-semibold mt-2 inline-block">
          &larr; Back to Vehicles
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/vehicles"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                {vehicle.make} {vehicle.model}
              </h2>
              <PlateBadge plate={vehicle.registrationNumber} />
              <StatusBadge status={vehicle.status} type="vehicle" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Year {vehicle.year} • Fleet Asset ID: {vehicle._id}
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={openAddRepairModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Log Repair / Service</span>
          </button>
        )}
      </div>

      {/* Specifications & Document Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Technical Specs */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Gauge className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Vehicle Metrics
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Current Odometer:</span>
              <span className="font-bold text-slate-900 font-mono">
                {vehicle.currentMileage?.toLocaleString()} km
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Fuel Type:</span>
              <span className="font-semibold text-slate-800 capitalize">{vehicle.fuelType}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Rated Consumption:</span>
              <span className="font-semibold text-slate-800">
                {vehicle.fuelConsumption} L/100km
              </span>
            </div>
            {(() => {
              const completedWithFuel = (vehicle.recentTrips || []).filter(
                (t: any) => t.status === 'completed' && t.distance > 0 && t.fuelUsed > 0
              );
              const distSum = completedWithFuel.reduce((acc: number, t: any) => acc + (t.distance || 0), 0);
              const fuelSum = completedWithFuel.reduce((acc: number, t: any) => acc + (t.fuelUsed || 0), 0);
              const actualAvg = distSum > 0 ? Number(((fuelSum / distSum) * 100).toFixed(1)) : null;

              if (actualAvg === null) return null;

              const isOverRated = actualAvg > vehicle.fuelConsumption;
              return (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Actual Trip Avg:</span>
                  <span
                    className={`font-semibold font-mono ${
                      isOverRated ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                    title={`Calculated from ${completedWithFuel.length} completed trip(s)`}
                  >
                    {actualAvg} L/100km
                  </span>
                </div>
              );
            })()}
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Total Maintenance Cost:</span>
              <span className="font-bold text-emerald-700 font-mono">
                ${(vehicle.totalRepairCost || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Technical Inspection Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Technical Inspection
              </h3>
            </div>
            {vehicle.inspectionStatus && (
              <StatusBadge
                status={vehicle.inspectionStatus.status}
                type="doc"
                daysRemaining={vehicle.inspectionStatus.daysRemaining}
              />
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Valid Until:</span>
              <span className="font-bold text-slate-900 text-sm">
                {vehicle.technicalInspection?.validUntil
                  ? new Date(vehicle.technicalInspection.validUntil).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Not specified'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed pt-2">
              Statutory roadworthiness certificate required for continuous commercial transport
              operation.
            </p>
          </div>
        </div>

        {/* Insurance Policy Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Insurance Coverage
              </h3>
            </div>
            {vehicle.insuranceStatus && (
              <StatusBadge
                status={vehicle.insuranceStatus.status}
                type="doc"
                daysRemaining={vehicle.insuranceStatus.daysRemaining}
              />
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Carrier:</span>
              <span className="font-semibold text-slate-900">{vehicle.insurance?.provider || 'Allianz'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Policy Number:</span>
              <span className="font-mono text-slate-800">{vehicle.insurance?.policyNumber || 'POL-99120'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expires:</span>
              <span className="font-bold text-slate-900">
                {vehicle.insurance?.validUntil
                  ? new Date(vehicle.insurance.validUntil).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Repair & Maintenance History Section (Section 23 in Requirements) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Repair & Maintenance History</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Service center interventions, parts replacements, and associated operational expenses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600">
              Total Invoiced:{' '}
              <strong className="text-emerald-700 font-bold">
                ${(vehicle.totalRepairCost || 0).toLocaleString()}
              </strong>
            </span>
            {isAdmin && (
              <button
                onClick={openAddRepairModal}
                className="text-xs bg-white hover:bg-slate-100 text-blue-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs transition-colors"
              >
                + Add Record
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-4 py-3">Description & Service Notes</th>
                <th className="px-4 py-3">Service Provider</th>
                <th className="px-4 py-3">Odometer</th>
                <th className="px-4 py-3">Cost ($)</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(!vehicle.repairs || vehicle.repairs.length === 0) ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    No repair or maintenance records registered for this vehicle yet.
                  </td>
                </tr>
              ) : (
                vehicle.repairs.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 font-mono font-medium text-slate-600">
                      {new Date(r.repairDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      <p className="font-semibold text-slate-900">{r.description}</p>
                      {r.notes && <p className="text-[11px] text-slate-500 mt-0.5">{r.notes}</p>}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.serviceProvider}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {r.mileage ? `${r.mileage.toLocaleString()} km` : '—'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                      ${r.cost.toLocaleString()}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditRepairModal(r)}
                            className="p-1 text-slate-400 hover:text-amber-600 rounded"
                            title="Edit Repair"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRepair(r._id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete Repair"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Repair Modal */}
      {isRepairModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingRepair ? 'Edit Repair Record' : `Log Repair for ${vehicle.registrationNumber}`}
              </h3>
              <button
                onClick={() => setIsRepairModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {repairModalError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {repairModalError}
              </div>
            )}

            <form onSubmit={handleSaveRepair} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Repair Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brake pad overhaul, oil & filter change..."
                  value={repairForm.description}
                  onChange={(e) => setRepairForm({ ...repairForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Cost ($ USD) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={repairForm.cost}
                    onChange={(e) => setRepairForm({ ...repairForm, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Date of Repair *
                  </label>
                  <input
                    type="date"
                    required
                    value={repairForm.repairDate}
                    onChange={(e) => setRepairForm({ ...repairForm, repairDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Service Provider / Garage *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EuroFleet Service Center"
                    value={repairForm.serviceProvider}
                    onChange={(e) => setRepairForm({ ...repairForm, serviceProvider: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Vehicle Mileage (km)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={repairForm.mileage}
                    onChange={(e) => setRepairForm({ ...repairForm, mileage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Technician Notes & Diagnostics
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional observations, warranty info, replaced part IDs..."
                  value={repairForm.notes}
                  onChange={(e) => setRepairForm({ ...repairForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRepairModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={repairModalLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {repairModalLoading ? 'Saving...' : editingRepair ? 'Update Repair' : 'Save Repair Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
