import type { CitizenRequest, Ward } from '../types';

export const WARDS: Ward[] = [
  'Ward 1 - Central Zone',
  'Ward 2 - Civil Lines',
  'Ward 3 - East District',
  'Ward 4 - South Bay',
  'Ward 5 - Industrial Corridor',
];

export const INITIAL_REQUESTS: CitizenRequest[] = [
  {
    id: 'req-001',
    trackingCode: 'CIV-2026-891',
    citizenName: 'Rajesh Kumar Verma',
    citizenPhone: '+91 98765 43210',
    citizenEmail: 'rajesh.verma@example.com',
    location: 'Main Market Road, near Metro Pillar 142',
    ward: 'Ward 1 - Central Zone',
    category: 'Roads & Infrastructure',
    description: 'Dangerous deep crater/pothole right in the middle lane causing severe traffic slowdown and two-wheeler accidents during evening rush hour.',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    priority: 'high',
    status: 'pending',
    timestamp: '2026-08-20T08:30:00Z',
    timeline: [
      {
        id: 't-1',
        timestamp: '2026-08-20T08:30:00Z',
        status: 'pending',
        actor: 'Citizen Portal',
        note: 'Complaint registered by citizen with high priority due to accident risk.'
      }
    ]
  },
  {
    id: 'req-002',
    trackingCode: 'CIV-2026-892',
    citizenName: 'Priya Sundaram',
    citizenPhone: '+91 98111 22334',
    citizenEmail: 'priya.sundaram@example.org',
    location: 'Sector 4B, Opposite Community Center',
    ward: 'Ward 2 - Civil Lines',
    category: 'Water Supply & Drainage',
    description: 'Severe main pipeline rupture causing thousands of liters of clean drinking water to flood the street and low water pressure in nearby houses.',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
    priority: 'high',
    status: 'pending',
    timestamp: '2026-08-20T09:15:00Z',
    timeline: [
      {
        id: 't-2',
        timestamp: '2026-08-20T09:15:00Z',
        status: 'pending',
        actor: 'Citizen App',
        note: 'Urgent complaint logged for water main rupture.'
      }
    ]
  },
  {
    id: 'req-003',
    trackingCode: 'CIV-2026-893',
    citizenName: 'Dr. Alok Nath Mukherjee',
    citizenPhone: '+91 97234 56789',
    citizenEmail: 'dr.mukherjee@hospital.net',
    location: 'Kalyan Nagar, Lane 3, Plot 45',
    ward: 'Ward 3 - East District',
    category: 'Street Lighting & Power',
    description: 'High-voltage transformer sparking intermittently near high school crossing, creating severe electrical fire safety risk.',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
    priority: 'high',
    status: 'in_progress',
    assignedOfficer: 'Inspector V. Saxena (Power Distribution)',
    timestamp: '2026-08-19T14:40:00Z',
    timeline: [
      {
        id: 't-3a',
        timestamp: '2026-08-19T14:40:00Z',
        status: 'pending',
        actor: 'Citizen Portal',
        note: 'Complaint submitted with photo evidence.'
      },
      {
        id: 't-3b',
        timestamp: '2026-08-19T16:00:00Z',
        status: 'in_progress',
        actor: 'Municipal Control Room',
        note: 'Dispatched emergency electrical rapid response team.'
      }
    ]
  },
  {
    id: 'req-004',
    trackingCode: 'CIV-2026-894',
    citizenName: 'Meenakshi Iyer',
    citizenPhone: '+91 94555 67890',
    citizenEmail: 'm.iyer@fintech.io',
    location: 'Block C, Greenview Apartments Corner',
    ward: 'Ward 4 - South Bay',
    category: 'Sanitation & Waste',
    description: 'Illegal commercial trash dumping on the corner plot. Garbage is overflowing onto the pedestrian pathway attracting stray animals and pests.',
    imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    priority: 'medium',
    status: 'pending',
    timestamp: '2026-08-20T10:00:00Z',
    timeline: [
      {
        id: 't-4',
        timestamp: '2026-08-20T10:00:00Z',
        status: 'pending',
        actor: 'Citizen Portal',
        note: 'Waste clearance requested by resident welfare association.'
      }
    ]
  },
  {
    id: 'req-005',
    trackingCode: 'CIV-2026-895',
    citizenName: 'Sunil Rao',
    citizenPhone: '+91 93123 44556',
    citizenEmail: 'sunilrao@craftworks.in',
    location: 'Phase II Industrial Area, Service Road 5',
    ward: 'Ward 5 - Industrial Corridor',
    category: 'Public Safety & Hazards',
    description: 'Large broken drainage slab leaving an open 4-foot deep manhole without barricades near factory exit gate.',
    imageUrl: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80',
    priority: 'medium',
    status: 'pending',
    timestamp: '2026-08-20T11:20:00Z',
    timeline: [
      {
        id: 't-5',
        timestamp: '2026-08-20T11:20:00Z',
        status: 'pending',
        actor: 'Citizen Portal',
        note: 'Open manhole hazard reported.'
      }
    ]
  },
  {
    id: 'req-006',
    trackingCode: 'CIV-2026-896',
    citizenName: 'Fatima Sheikh',
    citizenPhone: '+91 99887 66554',
    citizenEmail: 'fatima.s@designs.com',
    location: 'Children Public Park, Sector 9',
    ward: 'Ward 1 - Central Zone',
    category: 'Parks & Public Amenities',
    description: 'Broken children swings with sharp rusted metal edges and damaged park lighting causing security concerns at dusk.',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    priority: 'low',
    status: 'pending',
    timestamp: '2026-08-18T15:30:00Z',
    timeline: [
      {
        id: 't-6',
        timestamp: '2026-08-18T15:30:00Z',
        status: 'pending',
        actor: 'Citizen Portal',
        note: 'Park maintenance request received.'
      }
    ]
  },
  {
    id: 'req-007',
    trackingCode: 'CIV-2026-880',
    citizenName: 'Harish Chandra Pant',
    citizenPhone: '+91 98450 12345',
    citizenEmail: 'hcpant@heritage.org',
    location: 'Court Road Intersection',
    ward: 'Ward 2 - Civil Lines',
    category: 'Street Lighting & Power',
    description: 'Three consecutive street sodium lamps failed. Night visibility is completely dark.',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    priority: 'medium',
    status: 'completed',
    assignedOfficer: 'Officer K. Sharma',
    resolutionNotes: 'Replaced high-pressure sodium bulbs with 90W LED fixtures and repaired line junction box. Fully functional.',
    timestamp: '2026-08-17T12:00:00Z',
    timeline: [
      {
        id: 't-7a',
        timestamp: '2026-08-17T12:00:00Z',
        status: 'pending',
        actor: 'Citizen Portal',
        note: 'Streetlight fault reported.'
      },
      {
        id: 't-7b',
        timestamp: '2026-08-17T14:30:00Z',
        status: 'in_progress',
        actor: 'Civil Lines Ward Office',
        note: 'Maintenance crew assigned with bucket truck.'
      },
      {
        id: 't-7c',
        timestamp: '2026-08-18T10:00:00Z',
        status: 'completed',
        actor: 'Officer K. Sharma',
        note: 'Work verified and completed with citizen sign-off.'
      }
    ]
  },
  {
    id: 'req-008',
    trackingCode: 'CIV-2026-879',
    citizenName: 'Sanjay Bhatia',
    citizenPhone: '+91 97110 99887',
    citizenEmail: 'sbhatia@logistics.com',
    location: 'Flyover Ramp Entry, Ring Road',
    ward: 'Ward 3 - East District',
    category: 'Roads & Infrastructure',
    description: 'Loose asphalt and debris scattered after monsoon shower.',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    priority: 'low',
    status: 'completed',
    assignedOfficer: 'Eng. R. Dhingra',
    resolutionNotes: 'Road sweeping mechanical vehicle deployed and loose gravel removed.',
    timestamp: '2026-08-16T08:10:00Z',
    timeline: [
      {
        id: 't-8a',
        timestamp: '2026-08-16T08:10:00Z',
        status: 'pending',
        actor: 'Citizen Portal',
        note: 'Debris reported.'
      },
      {
        id: 't-8b',
        timestamp: '2026-08-16T11:00:00Z',
        status: 'completed',
        actor: 'East District Works',
        note: 'Road cleaned and restored.'
      }
    ]
  },
  {
    id: 'req-009',
    trackingCode: 'CIV-2026-875',
    citizenName: 'Ananya Deshmukh',
    citizenPhone: '+91 91234 56780',
    citizenEmail: 'ananya@chemcorp.in',
    location: 'Plot 88 Industrial Sector',
    ward: 'Ward 5 - Industrial Corridor',
    category: 'Sanitation & Waste',
    description: 'Unauthorized hazardous scrap metals left on public footpath.',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
    priority: 'medium',
    status: 'completed',
    assignedOfficer: 'Officer M. Singhal',
    resolutionNotes: 'Notice served to adjacent warehouse; waste removed to recycling depot.',
    timestamp: '2026-08-15T09:20:00Z',
    timeline: [
      {
        id: 't-9a',
        timestamp: '2026-08-15T09:20:00Z',
        status: 'pending',
        actor: 'Citizen App',
        note: 'Industrial encroachment reported.'
      },
      {
        id: 't-9b',
        timestamp: '2026-08-16T14:00:00Z',
        status: 'completed',
        actor: 'Sanitation Enforcement',
        note: 'Enforcement action completed and cleared.'
      }
    ]
  },
  {
    id: 'req-010',
    trackingCode: 'CIV-2026-872',
    citizenName: 'Rameshwar Dayal',
    citizenPhone: '+91 99001 12233',
    location: 'Private Residential Compound 12A',
    ward: 'Ward 4 - South Bay',
    category: 'Other Civic Issues',
    description: 'Internal private plumbing pipe inside private apartment balcony.',
    imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80',
    priority: 'low',
    status: 'rejected',
    rejectionReason: 'Issue is situated inside private residential property. Falls outside municipal public domain jurisdiction.',
    timestamp: '2026-08-14T11:00:00Z',
    timeline: [
      {
        id: 't-10a',
        timestamp: '2026-08-14T11:00:00Z',
        status: 'pending',
        actor: 'Citizen Portal',
        note: 'Complaint submitted.'
      },
      {
        id: 't-10b',
        timestamp: '2026-08-14T13:45:00Z',
        status: 'rejected',
        actor: 'Municipal Desk Officer',
        note: 'Rejected: Private property jurisdiction.'
      }
    ]
  }
];

export const PRESET_SAMPLE_PHOTOS = [
  {
    name: 'Pothole / Road Damage',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    category: 'Roads & Infrastructure' as const
  },
  {
    name: 'Water Pipe Burst',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
    category: 'Water Supply & Drainage' as const
  },
  {
    name: 'Garbage Dump',
    url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    category: 'Sanitation & Waste' as const
  },
  {
    name: 'Broken Streetlight',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    category: 'Street Lighting & Power' as const
  },
  {
    name: 'Open Drain / Manhole',
    url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80',
    category: 'Public Safety & Hazards' as const
  },
  {
    name: 'Broken Park Amenities',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    category: 'Parks & Public Amenities' as const
  }
];
