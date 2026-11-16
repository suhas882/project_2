/* Lightweight structural checks for the demonstration FHIR R4 bundle.
   This is NOT the official HL7 validator: it checks the fields and references this app emits.
   Run the bundle through the HL7 FHIR Validator before any real exchange. */

export interface FhirIssue { severity: 'error' | 'warning'; path: string; message: string }
type Json = Record<string, unknown>;

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;
const OBS_STATUS = ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown'];

function hasCode(cc: unknown): boolean {
  const c = cc as { text?: string; coding?: { system?: string; code?: string }[] } | undefined;
  return !!c && (isStr(c.text) || (Array.isArray(c.coding) && c.coding.some(x => isStr(x.code) && isStr(x.system))));
}

export function validateBundle(bundle: unknown): FhirIssue[] {
  const issues: FhirIssue[] = [];
  const err = (path: string, message: string) => issues.push({ severity: 'error', path, message });
  const warn = (path: string, message: string) => issues.push({ severity: 'warning', path, message });
  const b = bundle as Json;
  if (!b || b.resourceType !== 'Bundle') { err('Bundle', 'resourceType must be "Bundle"'); return issues; }
  if (!['collection', 'document', 'transaction', 'batch', 'searchset'].includes(String(b.type))) err('Bundle.type', 'invalid or missing type');
  const entries = (b.entry as Json[] | undefined) ?? [];
  if (!Array.isArray(entries) || !entries.length) { err('Bundle.entry', 'bundle has no entries'); return issues; }
  const urls = new Set<string>();
  entries.forEach((e, i) => {
    const p = `Bundle.entry[${i}]`;
    if (!isStr(e.fullUrl)) err(`${p}.fullUrl`, 'missing fullUrl');
    else if (urls.has(e.fullUrl as string)) err(`${p}.fullUrl`, 'duplicate fullUrl');
    else urls.add(e.fullUrl as string);
  });
  const resolve = (ref: unknown) => isStr(ref) && urls.has(ref);
  entries.forEach((e, i) => {
    const r = e.resource as Json | undefined;
    const p = `Bundle.entry[${i}].resource`;
    if (!r || !isStr(r.resourceType)) { err(p, 'missing resource or resourceType'); return; }
    const subj = (k: string) => {
      const ref = (r[k] as { reference?: string } | undefined)?.reference;
      if (!ref) err(`${p}.${k}`, `${r.resourceType}.${k} is required by this profile`);
      else if (!resolve(ref)) err(`${p}.${k}`, `reference ${ref} does not resolve inside the bundle`);
    };
    switch (r.resourceType) {
      case 'Patient':
        if (r.name) warn(`${p}.name`, 'Patient should stay pseudonymous (no name)');
        break;
      case 'Condition':
        if (!hasCode(r.code)) err(`${p}.code`, 'Condition.code needs a coding or text');
        subj('subject');
        break;
      case 'Observation': {
        if (!OBS_STATUS.includes(String(r.status))) err(`${p}.status`, 'Observation.status is required and must be a valid code');
        if (!hasCode(r.code)) err(`${p}.code`, 'Observation.code needs a coding or text');
        subj('subject');
        if (r.effectiveDateTime && !DATE_RE.test(String(r.effectiveDateTime))) err(`${p}.effectiveDateTime`, 'not a valid FHIR dateTime');
        const vq = r.valueQuantity as { value?: unknown; unit?: unknown } | undefined;
        const comps = r.component as unknown[] | undefined;
        if (!vq && !r.valueString && !r.valueInteger && !comps?.length && !r.valueCodeableConcept) warn(p, 'Observation has no value or components');
        if (vq && typeof vq.value !== 'number') err(`${p}.valueQuantity.value`, 'must be a number');
        if (vq && !isStr(vq.unit)) warn(`${p}.valueQuantity.unit`, 'unit missing');
        break;
      }
      case 'QuestionnaireResponse':
        if (!['in-progress', 'completed', 'amended', 'entered-in-error', 'stopped'].includes(String(r.status))) err(`${p}.status`, 'invalid status');
        subj('subject');
        break;
      case 'Consent':
        if (!['draft', 'proposed', 'active', 'rejected', 'inactive', 'entered-in-error'].includes(String(r.status))) err(`${p}.status`, 'invalid status');
        if (!hasCode(r.scope)) err(`${p}.scope`, 'Consent.scope is required');
        if (!Array.isArray(r.category) || !r.category.length) err(`${p}.category`, 'Consent.category is required');
        subj('patient');
        break;
      case 'MedicationStatement':
        if (!hasCode(r.medicationCodeableConcept)) err(`${p}.medicationCodeableConcept`, 'medication is required');
        subj('subject');
        break;
      default:
        warn(p, `resource type ${String(r.resourceType)} is not checked by this validator`);
    }
  });
  return issues;
}
