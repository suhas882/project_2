import { useState } from 'react';
import { Pill, Trash2, Plus } from 'lucide-react';
import { useStore } from '@/store/store';
import { Button, Card, EmptyState, Field, Input, Notice, PageHeader, Select, useToast } from '@/components/ui';
import type { Medication } from '@/types';

export default function Medications() {
  const { data, addMedication, deleteMedication } = useStore();
  const toast = useToast();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<Medication['kind']>('supplement');
  const [schedule, setSchedule] = useState('Daily');
  const [err, setErr] = useState('');
  const add = () => {
    if (!name.trim()) return setErr('Enter a name.');
    if (name.trim().length > 80) return setErr('Use 80 characters or fewer.');
    addMedication({ name: name.trim(), kind, schedule: schedule.trim() || 'As needed' });
    setName(''); setErr(''); toast('Added. It is tracked as an exposure, not a recommendation.');
  };
  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      <PageHeader title="Medications and supplements" subtitle="Logged as exposures so they are not confused with diet effects." />
      <Notice>Remitra never recommends starting, stopping or changing a medication. Talk to your care team about any change.</Notice>
      <Card>
        {data.medications.length === 0 ? <EmptyState icon={<Pill className="size-6" />} title="Nothing logged yet" /> : (
          <ul className="divide-y divide-line">
            {data.medications.map(m => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <span className="grid size-10 place-items-center rounded-xl bg-insight-50 text-insight"><Pill className="size-5" aria-hidden /></span>
                <span className="flex-1"><span className="block font-semibold">{m.name}</span><span className="text-sm text-ink-3">{m.kind === 'medication' ? 'Medication' : 'Supplement'} · {m.schedule}</span></span>
                <button onClick={() => { deleteMedication(m.id); toast(`${m.name} removed.`); }} className="grid size-10 place-items-center rounded-xl text-ink-3 hover:bg-danger-50 hover:text-danger" aria-label={`Remove ${m.name}`}><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-bold">Add one</h2>
        <form className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end" onSubmit={e => { e.preventDefault(); add(); }}>
          <Field label="Name and strength" error={err}>{p => <Input {...p} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Fish oil 1 g" />}</Field>
          <Field label="Type">{p => <Select {...p} value={kind} onChange={e => setKind(e.target.value as Medication['kind'])}><option value="supplement">Supplement</option><option value="medication">Medication</option></Select>}</Field>
          <Field label="Schedule">{p => <Input {...p} value={schedule} onChange={e => setSchedule(e.target.value)} />}</Field>
          <Button type="submit" icon={<Plus className="size-4" />}>Add</Button>
        </form>
      </Card>
    </div>
  );
}
