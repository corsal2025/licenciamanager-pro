import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Area
} from 'recharts';
import { LicenseData, Purchase, PurchaseStatus } from '../types';
import { reportService } from '../services/reportService';
import { TrendingUp, Users, Activity, Calendar, ShoppingCart, FileText } from 'lucide-react';
import { purchaseService } from '../services/purchaseService';

interface AnalyticsDashboardProps {
  licenses: LicenseData[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ licenses }) => {

  // Purchases State
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    purchaseService.getAll(false).then(setPurchases).catch(console.error);
  }, []);

  const totalExpenses = useMemo(() => {
    return purchases
      .filter(p => p.status === PurchaseStatus.APPROVED || p.status === PurchaseStatus.PURCHASED)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [purchases]);

  // 1. Status Distribution
  const statusData = useMemo(() => {
    const counts = licenses.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [licenses]);

  // 2. Category Distribution
  const categoryData = useMemo(() => {
    const counts = licenses.reduce((acc, curr) => {
      const cat = curr.category || 'Sin Clase';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [licenses]);

  // 3. Process Status Distribution
  const processData = useMemo(() => {
    const counts = licenses.reduce((acc, curr) => {
      acc[curr.processStatus] = (acc[curr.processStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [licenses]);

  // 4. Daily Upload Activity (Last 14 days)
  const activityData = useMemo(() => {
    const days = 14;
    const result = new Map<string, number>();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.set(d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }), 0);
    }

    licenses.forEach(l => {
      const dateStr = new Date(l.uploadDate).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
      if (result.has(dateStr)) {
        result.set(dateStr, (result.get(dateStr) || 0) + 1);
      }
    });

    return Array.from(result.entries()).map(([date, count]) => ({ date, count }));
  }, [licenses]);

  // 5. User Productivity (Uploads per User)
  const userProductivityData = useMemo(() => {
    const counts = licenses.reduce((acc, curr) => {
      const user = curr.uploadedBy || 'Desconocido';
      acc[user] = (acc[user] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [licenses]);

  // 6. Predictive Analytics (Linear Regression)
  const projectionData = useMemo(() => {
    // Group by Month (YYYY-MM)
    const months: Record<string, number> = {};
    licenses.forEach(l => {
      const d = new Date(l.uploadDate * 1000); // Assuming seconds
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      months[key] = (months[key] || 0) + 1;
    });

    // Convert to Array sorted by date
    const labels = Object.keys(months).sort();
    const dataPoints = labels.map((label, index) => ({
      x: index,
      y: months[label],
      label
    }));

    if (dataPoints.length < 2) return [];

    // Calculate Regression (y = mx + b)
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((acc, p) => acc + p.x, 0);
    const sumY = dataPoints.reduce((acc, p) => acc + p.y, 0);
    const sumXY = dataPoints.reduce((acc, p) => acc + (p.x * p.y), 0);
    const sumXX = dataPoints.reduce((acc, p) => acc + (p.x * p.x), 0);

    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;

    // Generate Data for Chart (History + 3 Months Projection)
    const result = [];

    // History
    dataPoints.forEach(p => {
      result.push({
        name: p.label,
        actual: p.y,
        trend: (m * p.x + b).toFixed(1)
      });
    });

    // Projection
    for (let i = 1; i <= 3; i++) {
      const nextX = n - 1 + i;
      const nextY = m * nextX + b;
      // Generate label for next month
      const lastDate = new Date(labels[labels.length - 1] + "-02"); // Avoid timezone edge cases
      lastDate.setMonth(lastDate.getMonth() + i);
      const nextLabel = `${lastDate.getFullYear()}-${(lastDate.getMonth() + 1).toString().padStart(2, '0')}`;

      result.push({
        name: nextLabel,
        actual: null,
        trend: Math.max(0, nextY).toFixed(1), // No negative licenses
        isProjection: true
      });
    }

    return result;
  }, [licenses]);

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Panel de Análisis
          </h2>
          <p className="text-gray-500 mt-1">Visualización gráfica de métricas y KPIs</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => reportService.generateMonthlyReport(licenses)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <FileText className="w-4 h-4" /> Exportar Reporte PDF
          </button>
          <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 text-blue-700 font-medium flex items-center">
            Total Registros: {licenses.length}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Tasa de Vigencia</p>
            <p className="text-2xl font-bold text-gray-800">
              {((statusData.find(d => d.name === 'VIGENTE')?.value || 0) / (licenses.length || 1) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Categoría Principal</p>
            <p className="text-2xl font-bold text-gray-800">
              {categoryData[0]?.name || 'N/A'}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Gastos Aprobados</p>
            <p className="text-2xl font-bold text-gray-800">
              ${totalExpenses.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Actividad Reciente</p>
            <p className="text-2xl font-bold text-gray-800">
              {activityData.reduce((acc, curr) => acc + curr.count, 0)} <span className="text-sm font-normal text-gray-400">últimos 14 días</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution - Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-2 text-gray-700 flex items-center gap-2">
            Estado de Licencias
          </h3>
          <p className="text-sm text-gray-500 mb-6">Proporción de licencias vigentes vs vencidas o próximas a vencer.</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution - Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-2 text-gray-700">Distribución por Clase</h3>
          <p className="text-sm text-gray-500 mb-6">Cantidad de licencias agrupadas por su clase (A, B, C, etc).</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Line Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold mb-2 text-gray-700">Actividad de Carga (Últimos 14 días)</h3>
          <p className="text-sm text-gray-500 mb-6">Tendencia diaria de nuevos documentos ingresados al sistema.</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                  name="Licencias Subidas"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Process Status - Horizontal Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold mb-2 text-gray-700">Estado del Proceso Administrativo</h3>
          <p className="text-sm text-gray-500 mb-6">Visualiza en qué etapa se encuentran los documentos (ej. Agenda, Subida a Conaset, etc).</p>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={150} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Licencias" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold mb-2 text-gray-700 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Productividad por Usuario
          </h3>
          <p className="text-sm text-gray-500 mb-6">Cantidad de licencias procesadas y subidas por cada operador del sistema.</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userProductivityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#EC4899" radius={[4, 4, 0, 0]} name="Licencias Procesadas" barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Predictive Analytics Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold mb-2 text-gray-700 text-indigo-700 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Proyección de Demanda (IA Lineal)
          </h3>
          <p className="text-sm text-gray-500 mb-6">Proyección matemática de atenciones para los próximos 3 meses basada en la tendencia histórica actual.</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Bar dataKey="actual" name="Atenciones Reales" barSize={30} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="trend" name="Tendencia / Proyección" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
