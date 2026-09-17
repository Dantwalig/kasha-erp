'use client';

import { useEffect, useState, FormEvent } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

interface Employee {
  id: string; employeeNumber: string; firstName: string; lastName: string;
  department?: string; jobTitle?: string; status: string; salary: string;
}
interface LeaveRequest {
  id: string; type: string; status: string; startDate: string; endDate: string;
  employee: Employee;
}
interface JobOpening { id: string; title: string; department?: string; status: string; candidates: any[]; }
interface Candidate { id: string; name: string; stage: string; jobOpeningId: string; }
interface PayrollRecord {
  id: string; grossPay: string; deductions: string; netPay: string; status: string;
  employee: Employee; periodStart: string; periodEnd: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  ON_LEAVE: 'bg-kasha-yellow text-black',
  TERMINATED: 'bg-gray-100 text-gray-500',
  PENDING: 'bg-kasha-yellow text-black',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-kasha-pink',
  OPEN: 'bg-brand-50 text-brand-500',
  CLOSED: 'bg-gray-100 text-gray-500',
  DRAFT: 'bg-gray-100 text-gray-600',
  PAID: 'bg-green-100 text-green-700',
};

function Badge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function HrPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('hr:write');
  const canApprove = hasPermission('hr:approve');

  const [tab, setTab] = useState<'employees' | 'leave' | 'recruitment' | 'payroll'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [empNumber, setEmpNumber] = useState('');
  const [empFirst, setEmpFirst] = useState('');
  const [empLast, setEmpLast] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [empTitle, setEmpTitle] = useState('');

  const [leaveEmp, setLeaveEmp] = useState('');
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');

  const [jobTitle, setJobTitle] = useState('');
  const [jobDept, setJobDept] = useState('');
  const [candName, setCandName] = useState<Record<string, string>>({});

  const [payEmp, setPayEmp] = useState('');
  const [payStart, setPayStart] = useState('');
  const [payEnd, setPayEnd] = useState('');
  const [payGross, setPayGross] = useState('');

  async function loadAll() {
    try {
      const [e, l, j, p] = await Promise.all([
        api.get('/hr/employees'),
        api.get('/hr/leave'),
        api.get('/hr/recruitment/jobs'),
        api.get('/hr/payroll'),
      ]);
      setEmployees(e);
      setLeaveRequests(l);
      setJobs(j);
      setPayroll(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load HR data');
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreateEmployee(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/hr/employees', {
        employeeNumber: empNumber,
        firstName: empFirst,
        lastName: empLast,
        department: empDept || undefined,
        jobTitle: empTitle || undefined,
      });
      setEmpNumber(''); setEmpFirst(''); setEmpLast(''); setEmpDept(''); setEmpTitle('');
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
    }
  }

  async function handleCreateLeave(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/hr/leave', {
        employeeId: leaveEmp,
        type: leaveType,
        startDate: leaveStart,
        endDate: leaveEnd,
      });
      setLeaveEmp(''); setLeaveStart(''); setLeaveEnd('');
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit leave request');
    }
  }

  async function handleLeaveDecision(id: string, action: 'approve' | 'reject') {
    try {
      await api.patch(`/hr/leave/${id}/${action}`);
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    }
  }

  async function handleCreateJob(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/hr/recruitment/jobs', { title: jobTitle, department: jobDept || undefined });
      setJobTitle(''); setJobDept('');
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job opening');
    }
  }

  async function handleAddCandidate(jobId: string) {
    const name = candName[jobId];
    if (!name) return setError('Enter a candidate name first');
    try {
      await api.post('/hr/recruitment/candidates', { jobOpeningId: jobId, name });
      setCandName((s) => ({ ...s, [jobId]: '' }));
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add candidate');
    }
  }

  async function handleCandidateStage(id: string, stage: string) {
    try {
      await api.patch(`/hr/recruitment/candidates/${id}/stage`, { stage });
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update candidate');
    }
  }

  async function handleCreatePayroll(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/hr/payroll', {
        employeeId: payEmp,
        periodStart: payStart,
        periodEnd: payEnd,
        grossPay: Number(payGross),
      });
      setPayEmp(''); setPayStart(''); setPayEnd(''); setPayGross('');
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payroll record');
    }
  }

  async function handleMarkPaid(id: string) {
    try {
      await api.patch(`/hr/payroll/${id}/mark-paid`);
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as paid');
    }
  }

  const CANDIDATE_STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-extrabold text-gray-900">HR</h1>
        <p className="mt-1 text-sm text-gray-500">Employees, leave, recruitment, and payroll.</p>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-kasha-pink">{error}</p>
        )}

        <div className="mt-6 flex gap-2 border-b border-gray-200">
          {(['employees', 'leave', 'recruitment', 'payroll'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold capitalize ${
                tab === t ? 'border-b-2 border-brand-500 text-brand-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'employees' && (
          <div className="mt-6 space-y-6">
            {canWrite && (
              <form onSubmit={handleCreateEmployee} className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-5">
                <input required placeholder="Employee #" value={empNumber} onChange={(e) => setEmpNumber(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input required placeholder="First name" value={empFirst} onChange={(e) => setEmpFirst(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input required placeholder="Last name" value={empLast} onChange={(e) => setEmpLast(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input placeholder="Department" value={empDept} onChange={(e) => setEmpDept(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input placeholder="Job title" value={empTitle} onChange={(e) => setEmpTitle(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <button className="col-span-full rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">Add Employee</button>
              </form>
            )}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-gray-500">No employees yet.</td></tr>
                  ) : (
                    employees.map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.employeeNumber}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{e.firstName} {e.lastName}</td>
                        <td className="px-4 py-3 text-gray-600">{e.department ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{e.jobTitle ?? '—'}</td>
                        <td className="px-4 py-3"><Badge status={e.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'leave' && (
          <div className="mt-6 space-y-6">
            {canWrite && (
              <form onSubmit={handleCreateLeave} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <select required value={leaveEmp} onChange={(e) => setLeaveEmp(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Employee...</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
                <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                  {['ANNUAL', 'SICK', 'UNPAID', 'OTHER'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input required type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input required type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <button className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">Submit Request</button>
              </form>
            )}
            <div className="space-y-3">
              {leaveRequests.length === 0 && <p className="text-sm text-gray-500">No leave requests yet.</p>}
              {leaveRequests.map((lr) => (
                <div key={lr.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                  <div>
                    <span className="text-sm font-semibold text-gray-800">{lr.employee.firstName} {lr.employee.lastName}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      {lr.type} · {new Date(lr.startDate).toLocaleDateString()} - {new Date(lr.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={lr.status} />
                    {lr.status === 'PENDING' && canApprove && (
                      <>
                        <button onClick={() => handleLeaveDecision(lr.id, 'approve')} className="rounded-md bg-brand-500 px-3 py-1 text-xs font-bold text-white hover:bg-brand-600">Approve</button>
                        <button onClick={() => handleLeaveDecision(lr.id, 'reject')} className="rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50">Reject</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'recruitment' && (
          <div className="mt-6 space-y-6">
            {canWrite && (
              <form onSubmit={handleCreateJob} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <input required placeholder="Job title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input placeholder="Department" value={jobDept} onChange={(e) => setJobDept(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <button className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">Post Opening</button>
              </form>
            )}
            <div className="space-y-3">
              {jobs.length === 0 && <p className="text-sm text-gray-500">No job openings yet.</p>}
              {jobs.map((job) => (
                <div key={job.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-gray-800">{job.title}</span>
                      {job.department && <span className="ml-2 text-xs text-gray-400">{job.department}</span>}
                    </div>
                    <Badge status={job.status} />
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    {job.candidates.map((c: Candidate) => (
                      <li key={c.id} className="flex items-center justify-between border-t border-gray-100 pt-1">
                        <span>{c.name}</span>
                        {canWrite ? (
                          <select
                            value={c.stage}
                            onChange={(e) => handleCandidateStage(c.id, e.target.value)}
                            className="rounded-md border border-gray-200 px-2 py-0.5 text-xs"
                          >
                            {CANDIDATE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <Badge status={c.stage} />
                        )}
                      </li>
                    ))}
                  </ul>
                  {canWrite && job.status === 'OPEN' && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        placeholder="Candidate name"
                        value={candName[job.id] ?? ''}
                        onChange={(e) => setCandName((s) => ({ ...s, [job.id]: e.target.value }))}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                      />
                      <button onClick={() => handleAddCandidate(job.id)} className="rounded-md bg-brand-500 px-3 py-1 text-xs font-bold text-white hover:bg-brand-600">
                        Add Candidate
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'payroll' && (
          <div className="mt-6 space-y-6">
            {canWrite && (
              <form onSubmit={handleCreatePayroll} className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-4">
                <select required value={payEmp} onChange={(e) => setPayEmp(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Employee...</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
                <input required type="date" value={payStart} onChange={(e) => setPayStart(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input required type="date" value={payEnd} onChange={(e) => setPayEnd(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input required type="number" min="0" step="0.01" placeholder="Gross pay" value={payGross} onChange={(e) => setPayGross(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <button className="col-span-full rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">Create Payroll Record</button>
              </form>
            )}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Net Pay</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payroll.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-gray-500">No payroll records yet.</td></tr>
                  ) : (
                    payroll.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-semibold text-gray-800">{p.employee.firstName} {p.employee.lastName}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(p.periodStart).toLocaleDateString()} - {new Date(p.periodEnd).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600">${Number(p.netPay).toFixed(2)}</td>
                        <td className="px-4 py-3"><Badge status={p.status} /></td>
                        <td className="px-4 py-3">
                          {p.status === 'DRAFT' && canWrite && (
                            <button onClick={() => handleMarkPaid(p.id)} className="rounded-md bg-brand-500 px-3 py-1 text-xs font-bold text-white hover:bg-brand-600">
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
