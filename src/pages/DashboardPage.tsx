import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Users,
  Route,
  Wrench,
  AlertTriangle,
  Clock,
  Fuel,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api.js';
import { DashboardStats } from '../types.js';
import { StatusBadge, PlateBadge } from '../components/StatusBadge.js';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/dashboard/stats');
      setStats(res.data.stats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Loading fleet operational analytics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-xl">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-600" />
          <div>
            <h3 className="font-bold text-sm">Dashboard Error</h3>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { vehicles, drivers, trips, repairs, expirations, recentTrips, charts } = stats;

  return (
    <div className="space-y-6">
      {/* Expiration Banner if there are critical or expired documents */}
      {expirations.count > 0 && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Action Required: {expirations.count} Vehicle Document(s) Approaching Expiration
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Technical inspection or insurance policies require scheduled renewal.
              </p>
            </div>
          </div>
          <Link
            to="/notifications"
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-3 py-1.5 rounded-lg shrink-0 self-start sm:self-auto transition-colors"
          >
            <span>Review Expirations</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vehicles Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Fleet Vehicles
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{vehicles.total}</span>
            <span className="text-xs text-slate-500 font-medium">total units</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 text-center text-xs">
            <div>
              <span className="text-emerald-600 font-bold block">{vehicles.available}</span>
              <span className="text-[10px] text-slate-400">Available</span>
            </div>
            <div>
              <span className="text-blue-600 font-bold block">{vehicles.inUse}</span>
              <span className="text-[10px] text-slate-400">In Use</span>
            </div>
            <div>
              <span className="text-amber-600 font-bold block">{vehicles.maintenance}</span>
              <span className="text-[10px] text-slate-400">Service</span>
            </div>
          </div>
        </div>

        {/* Drivers Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Drivers
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{drivers.total}</span>
            <span className="text-xs text-slate-500 font-medium">registered</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs px-2">
            <span className="text-slate-600">
              Assigned: <strong className="text-blue-600 font-bold">{drivers.assigned}</strong>
            </span>
            <span className="text-slate-600">
              Available: <strong className="text-emerald-600 font-bold">{drivers.available}</strong>
            </span>
          </div>
        </div>

        {/* Trips Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Trips & Deliveries
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Route className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{trips.active}</span>
            <span className="text-xs text-purple-600 font-bold uppercase">In Progress</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs px-2">
            <span className="text-slate-600">
              Planned: <strong className="text-purple-700">{trips.planned}</strong>
            </span>
            <span className="text-slate-600">
              Completed: <strong className="text-emerald-700">{trips.completed}</strong>
            </span>
          </div>
        </div>

        {/* Total Repairs Cost */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Maintenance Costs
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ${repairs.totalCost.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">total expenses</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs px-2">
            <span className="text-slate-600 flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-slate-400" />
              {trips.totalDistance.toLocaleString()} km
            </span>
            <span className="text-slate-600">
              Avg: <strong>{trips.avgConsumption || '28.5'} L/100km</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet Status Donut Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Fleet Operational Status</h3>
          <p className="text-xs text-slate-500 mb-4">Current availability distribution</p>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.fleetStatusChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {charts.fleetStatusChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} vehicles`, 'Count']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-auto pt-2 border-t border-slate-100 text-xs">
            {charts.fleetStatusChart.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600">{item.name}:</span>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Repairs Cost Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Maintenance & Repair Expense Trend</h3>
              <p className="text-xs text-slate-500">Service center cost history ($ USD)</p>
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-medium">
              Past 6 Months
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyRepairData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Cost']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Aggregated repair invoices & scheduled overhauls</span>
            <span className="font-semibold text-slate-700">Total: ${repairs.totalCost.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Expirations and Active Trips Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Expiration Watchlist */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-800">Document Expirations Watchlist</h3>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              &le; 30 Days Warning
            </span>
          </div>

          <div className="p-4 flex-1">
            {expirations.list.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                All vehicle inspection and insurance documents are currently valid.
              </div>
            ) : (
              <div className="space-y-3">
                {expirations.list.map((item) => (
                  <div
                    key={item.vehicle._id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <PlateBadge plate={item.vehicle.registrationNumber} />
                        <span className="font-semibold text-xs text-slate-800">
                          {item.vehicle.make} {item.vehicle.model}
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {item.expirations.map((exp, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500">{exp.type}:</span>
                            <span
                              className={`font-semibold ${
                                exp.isExpired
                                  ? 'text-rose-600'
                                  : exp.daysRemaining <= 7
                                  ? 'text-rose-600 font-bold'
                                  : 'text-amber-600'
                              }`}
                            >
                              {exp.isExpired
                                ? `EXPIRED (${Math.abs(exp.daysRemaining)} days ago)`
                                : `Expires in ${exp.daysRemaining} days`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Link
                      to={`/vehicles/${item.vehicle._id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0"
                    >
                      View &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Fleet Deliveries / Trips */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800">Recent Trips & Dispatches</h3>
            </div>
            <Link to="/trips" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
              View All
            </Link>
          </div>

          <div className="p-4 flex-1">
            {recentTrips.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                No trips recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentTrips.map((trip) => (
                  <div
                    key={trip._id}
                    className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={trip.status} type="trip" />
                        <span className="font-semibold text-xs text-slate-900">
                          {trip.origin} &rarr; {trip.destination}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Cargo: {trip.cargo} | Driver: {trip.driver?.firstName} {trip.driver?.lastName} | Vehicle: {trip.vehicle?.make} ({trip.vehicle?.registrationNumber})
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {trip.distance} km
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
