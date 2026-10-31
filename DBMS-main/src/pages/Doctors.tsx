import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/database.types';
import {
  UserRound,
  UserPlus,
  Stethoscope,
  Building2,
  Phone,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';
import { SearchInput } from '../components/ui/SearchInput';

type Doctor = Database['public']['Tables']['doctors']['Row'];
type Department = Database['public']['Tables']['departments']['Row'];

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  const [newDoctor, setNewDoctor] = useState({
    first_name: '',
    last_name: '',
    specialization: '',
    fee: '',
    phone: '',
    dept_id: '',
  });

  const fetchData = async () => {
    const [docRes, depRes] = await Promise.all([
      supabase.from('doctors').select('*').order('doctor_id'),
      supabase.from('departments').select('*').order('dept_name'),
    ]);

    if (docRes.error) toast.error('Failed to load doctors');
    else setDoctors(docRes.data || []);

    if (depRes.error) toast.error('Failed to load departments');
    else setDepartments(depRes.data || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctor.first_name || !newDoctor.last_name || !newDoctor.fee) {
      toast.error('First name, last name, and fee are required');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('doctors').insert([
      {
        first_name: newDoctor.first_name.trim(),
        last_name: newDoctor.last_name.trim(),
        specialization: newDoctor.specialization ? newDoctor.specialization.trim() : null,
        fee: parseFloat(newDoctor.fee),
        phone: newDoctor.phone ? newDoctor.phone.trim() : null,
        dept_id: newDoctor.dept_id ? parseInt(newDoctor.dept_id, 10) : null,
      },
    ]);

    if (error) {
      toast.error('Error adding doctor: ' + error.message);
    } else {
      toast.success('Doctor registered');
      setNewDoctor({
        first_name: '',
        last_name: '',
        specialization: '',
        fee: '',
        phone: '',
        dept_id: '',
      });
      setIsRegisterOpen(false);
      fetchData();
    }
    setIsSubmitting(false);
  };

  const getDeptName = (dept_id: number | null) => {
    if (!dept_id) return '—';
    const dept = departments.find((d) => d.dept_id === dept_id);
    return dept ? dept.dept_name : `Dept #${dept_id}`;
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSearch =
        !searchQuery.trim() ||
        `${doc.first_name} ${doc.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.specialization || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(doc.doctor_id).includes(searchQuery);

      const matchesDept =
        !selectedDeptFilter ||
        (selectedDeptFilter === 'unassigned' ? !doc.dept_id : String(doc.dept_id) === selectedDeptFilter);

      return matchesSearch && matchesDept;
    });
  }, [doctors, searchQuery, selectedDeptFilter]);

  return (
    <PageContainer>
      <PageHeader
        title="Doctors"
        badge={
          <Badge variant="neutral" size="sm">
            {doctors.length} Total
          </Badge>
        }
      >
        <Button
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setIsRegisterOpen(true)}
        >
          Register Doctor
        </Button>
      </PageHeader>

      {/* Filter and Search Controls */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs mb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto flex-1">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name or specialization..."
            className="w-full sm:max-w-xs"
          />

          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="w-full sm:w-auto h-9 text-xs rounded-lg border border-slate-200 bg-white px-3 py-1 text-slate-700"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.dept_id} value={d.dept_id}>
                {d.dept_name}
              </option>
            ))}
            <option value="unassigned">Unassigned</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          {filteredDoctors.length} of {doctors.length} records
        </div>
      </div>

      {/* Doctor Directory Table */}
      <div className="bg-white rounded-lg shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider select-none">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Fee</th>
                <th className="py-3 px-4">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <LoadingState message="Loading..." />
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      icon={UserRound}
                      title="No doctors found"
                      description="No records match your criteria."
                      actionText={searchQuery || selectedDeptFilter ? 'Clear Filters' : 'Register Doctor'}
                      onAction={() => {
                        if (searchQuery || selectedDeptFilter) {
                          setSearchQuery('');
                          setSelectedDeptFilter('');
                        } else {
                          setIsRegisterOpen(true);
                        }
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => {
                  const isHead = departments.some((d) => d.head_doctor_id === doc.doctor_id);
                  return (
                    <tr key={doc.doctor_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        #{doc.doctor_id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        Dr. {doc.first_name} {doc.last_name}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {doc.specialization ? (
                          <div className="flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{doc.specialization}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isHead ? (
                          <Badge variant="hospital" size="sm">
                            Head of Dept
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Attending
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{getDeptName(doc.dept_id)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        ${doc.fee != null ? Number(doc.fee).toFixed(2) : '0.00'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                        {doc.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{doc.phone}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Doctor"
        maxWidth="md"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              type="text"
              required
              placeholder="First name"
              value={newDoctor.first_name}
              onChange={(e) => setNewDoctor({ ...newDoctor, first_name: e.target.value })}
            />
            <Input
              label="Last Name"
              type="text"
              required
              placeholder="Last name"
              value={newDoctor.last_name}
              onChange={(e) => setNewDoctor({ ...newDoctor, last_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Specialization"
              type="text"
              placeholder="e.g. Cardiology"
              value={newDoctor.specialization}
              onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
            />
            <Input
              label="Consultation Fee"
              type="number"
              step="0.01"
              required
              placeholder="e.g. 150.00"
              value={newDoctor.fee}
              onChange={(e) => setNewDoctor({ ...newDoctor, fee: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              placeholder="Contact number"
              value={newDoctor.phone}
              onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
            />
            <Select
              label="Department"
              value={newDoctor.dept_id}
              onChange={(e) => setNewDoctor({ ...newDoctor, dept_id: e.target.value })}
            >
              <option value="">None</option>
              {departments.map((d) => (
                <option key={d.dept_id} value={d.dept_id}>
                  {d.dept_name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRegisterOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
