import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../types/database.types';
import {
  Building2,
  Plus,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingState';
import { EmptyState } from '../components/ui/EmptyState';

type Department = Database['public']['Tables']['departments']['Row'];
type Doctor = Database['public']['Tables']['doctors']['Row'];

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingDeptId, setUpdatingDeptId] = useState<number | null>(null);

  const [newDept, setNewDept] = useState({ dept_name: '', floor: '' });

  const fetchData = async () => {
    const [deptRes, docRes] = await Promise.all([
      supabase.from('departments').select('*').order('dept_id'),
      supabase.from('doctors').select('*').order('first_name'),
    ]);

    if (deptRes.error) toast.error('Failed to load departments');
    else setDepartments(deptRes.data || []);

    if (docRes.error) toast.error('Failed to load doctors');
    else setDoctors(docRes.data || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.dept_name.trim() || !newDept.floor) {
      toast.error('Department name and floor are required');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('departments').insert([
      {
        dept_name: newDept.dept_name.trim(),
        floor: parseInt(newDept.floor, 10),
      } as any,
    ]);

    if (error) {
      toast.error('Error adding department: ' + error.message);
    } else {
      toast.success('Department created');
      setNewDept({ dept_name: '', floor: '' });
      setIsAddOpen(false);
      fetchData();
    }
    setIsSubmitting(false);
  };

  const updateHeadDoctor = async (dept_id: number, doctor_id: string) => {
    setUpdatingDeptId(dept_id);
    const val = doctor_id === '' ? null : parseInt(doctor_id, 10);
    const { error } = await supabase
      .from('departments')
      .update({ head_doctor_id: val })
      .eq('dept_id', dept_id);

    if (error) {
      toast.error('Failed to update: ' + error.message);
    } else {
      toast.success('Department head updated');
      fetchData();
    }
    setUpdatingDeptId(null);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Departments"
        badge={
          <Badge variant="neutral" size="sm">
            {departments.length} Units
          </Badge>
        }
      >
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddOpen(true)}
        >
          Add Department
        </Button>
      </PageHeader>

      <div className="bg-white rounded-lg shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider select-none">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Department Name</th>
                <th className="py-3 px-4">Floor</th>
                <th className="py-3 px-4">Head Doctor</th>
                <th className="py-3 px-4">Physicians</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <LoadingState message="Loading..." />
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8">
                    <EmptyState
                      icon={Building2}
                      title="No departments found"
                      description="Create a department to get started."
                      actionText="Add Department"
                      onAction={() => setIsAddOpen(true)}
                    />
                  </td>
                </tr>
              ) : (
                departments.map((dept) => {
                  const deptDoctors = doctors.filter((doc) => doc.dept_id === dept.dept_id);
                  const isUpdatingThis = updatingDeptId === dept.dept_id;

                  return (
                    <tr key={dept.dept_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        #{dept.dept_id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {dept.dept_name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        Floor {dept.floor}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          disabled={isUpdatingThis}
                          className="text-xs rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-800 disabled:opacity-50"
                          value={dept.head_doctor_id || ''}
                          onChange={(e) => updateHeadDoctor(dept.dept_id, e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {deptDoctors.map((doc) => (
                            <option key={doc.doctor_id} value={doc.doctor_id}>
                              Dr. {doc.first_name} {doc.last_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {deptDoctors.length} assigned
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Department Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Department"
        maxWidth="sm"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Department Name"
            type="text"
            required
            placeholder="e.g. Cardiology"
            value={newDept.dept_name}
            onChange={(e) => setNewDept({ ...newDept, dept_name: e.target.value })}
          />

          <Input
            label="Floor"
            type="number"
            required
            placeholder="e.g. 1"
            value={newDept.floor}
            onChange={(e) => setNewDept({ ...newDept, floor: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddOpen(false)}
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
