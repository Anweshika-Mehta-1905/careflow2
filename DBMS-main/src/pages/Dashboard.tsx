import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Users,
  Bed,
  Calendar,
  Activity,
  ArrowRight,
  Clock,
  Stethoscope,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function Dashboard() {
  const [stats, setStats] = useState({
    patients: 0,
    activeAdmissions: 0,
    appointmentsToday: 0,
    isOnline: true,
  });
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [activeAdmissionsList, setActiveAdmissionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        const today = new Date().toISOString().split('T')[0];

        const [patCountRes, admCountRes, apptCountRes, todayApptsRes, activeAdmsRes] =
          await Promise.all([
            supabase.from('patients').select('*', { count: 'exact', head: true }),
            supabase.from('admissions').select('*', { count: 'exact', head: true }).is('discharge_date', null),
            supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appt_date', today),
            supabase
              .from('appointments')
              .select('*, doctors(*), patients(*)')
              .eq('appt_date', today)
              .order('time_slot')
              .limit(5),
            supabase
              .from('admissions')
              .select('*, patients(*), rooms_beds(*), doctors(*)')
              .is('discharge_date', null)
              .order('admission_date', { ascending: false })
              .limit(5),
          ]);

        if (isMounted) {
          setStats({
            patients: patCountRes.count || 0,
            activeAdmissions: admCountRes.count || 0,
            appointmentsToday: apptCountRes.count || 0,
            isOnline: !patCountRes.error,
          });

          if (!todayApptsRes.error && todayApptsRes.data) {
            setTodayAppointments(todayApptsRes.data);
          }
          if (!activeAdmsRes.error && activeAdmsRes.data) {
            setActiveAdmissionsList(activeAdmsRes.data);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        if (isMounted) setLoading(false);
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const kpis = [
    {
      title: 'Total Patients',
      value: stats.patients,
      icon: Users,
    },
    {
      title: 'Active Admissions',
      value: stats.activeAdmissions,
      icon: Bed,
    },
    {
      title: "Today's Appointments",
      value: stats.appointmentsToday,
      icon: Calendar,
    },
    {
      title: 'System Status',
      value: stats.isOnline ? 'Operational' : 'Offline',
      icon: Activity,
    },
  ];

  return (
    <PageContainer>
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Overview</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/appointments">
            <Button variant="outline" size="sm">
              Appointments
            </Button>
          </Link>
          <Link to="/admissions">
            <Button variant="primary" size="sm">
              Admit Patient
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {loading ? '—' : kpi.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Operational Split: Today's Appointments & Active Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Consultations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle>Today's Appointments</CardTitle>
            <Link to="/appointments">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {todayAppointments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
                No appointments scheduled for today.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {todayAppointments.map((appt) => (
                  <div key={appt.appointment_id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {appt.patients?.first_name} {appt.patients?.last_name}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Stethoscope className="w-3 h-3 text-emerald-600" />
                        Dr. {appt.doctors?.first_name} {appt.doctors?.last_name}
                      </p>
                    </div>
                    <Badge variant="info" size="sm">
                      <Clock className="w-3 h-3" />
                      {appt.time_slot}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Inpatients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle>Current Inpatients</CardTitle>
            <Link to="/admissions">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Manage
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {activeAdmissionsList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
                No active inpatient admissions.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeAdmissionsList.map((adm) => (
                  <div key={adm.admission_id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {adm.patients?.first_name} {adm.patients?.last_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Room {adm.rooms_beds?.room_no} • {adm.rooms_beds?.ward_type}
                      </p>
                    </div>
                    <Badge variant="success" size="sm" dot>
                      Admitted
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
