import fs from 'fs';
import { resolveConfigPath } from '../paths.js';
import { Department } from '../types/civic.js';

function loadDepartmentsFromTaxonomy(): Department[] | null {
  const file = resolveConfigPath('civic-taxonomy.json');
  if (!file) return null;
  const raw = JSON.parse(fs.readFileSync(file, 'utf-8')) as {
    departments?: Array<{ id: string; name: string; keywords?: string[]; responsibilities?: string }>;
  };
  if (!raw.departments?.length) return null;
  return raw.departments.map((d) => ({
    id: d.id,
    name: d.name,
    keywords: (d.keywords || []).join(' '),
    responsibilities: d.responsibilities || '',
  }));
}

export const DEPARTMENTS: Department[] = loadDepartmentsFromTaxonomy() || [
  {
    id: 'pwd',
    name: 'Public Works Department (Roads)',
    keywords: 'pothole road street footpath asphalt pavement bridge',
    responsibilities: 'Road repair, potholes, footpaths, storm-damaged carriageways.',
  },
  {
    id: 'water',
    name: 'Water Supply & Drainage',
    keywords: 'water pipeline leak flooding waterlogging drain sewage',
    responsibilities: 'Drinking water, leaks, drainage, waterlogging.',
  },
  {
    id: 'sanitation',
    name: 'Sanitation & Solid Waste',
    keywords: 'garbage trash dump waste bin sanitation sewage',
    responsibilities: 'Collection, dumping, public bins, street sweeping.',
  },
  {
    id: 'power',
    name: 'Electricity / Street Lighting',
    keywords: 'electricity light pole transformer outage sparking',
    responsibilities: 'Street lights, transformers, public electrical hazards.',
  },
  {
    id: 'safety',
    name: 'Public Safety & Disaster',
    keywords: 'accident hazard collapse fire safety crime',
    responsibilities: 'Immediate public hazards and coordination with police/fire.',
  },
  {
    id: 'education',
    name: 'Education / Municipal Schools',
    keywords: 'school student classroom education campus',
    responsibilities: 'Civic issues affecting municipal schools and access.',
  },
  {
    id: 'transport',
    name: 'Transport & Traffic',
    keywords: 'bus stop traffic signal parking transport metro',
    responsibilities: 'Signals, stops, traffic calming near civic infrastructure.',
  },
  {
    id: 'municipal',
    name: 'Municipal Administration',
    keywords: 'construction noise permit encroachment',
    responsibilities: 'Catch-all routing when no specialist department matches.',
  },
];
