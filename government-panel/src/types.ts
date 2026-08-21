export type Priority = 'high' | 'medium' | 'low';

export type Status = 'pending' | 'in_progress' | 'completed' | 'rejected';

export type Category = 
  | 'Roads & Infrastructure'
  | 'Water Supply & Drainage'
  | 'Sanitation & Waste'
  | 'Street Lighting & Power'
  | 'Public Safety & Hazards'
  | 'Parks & Public Amenities'
  | 'Other Civic Issues';

export type Ward = 
  | 'Ward 1 - Central Zone'
  | 'Ward 2 - Civil Lines'
  | 'Ward 3 - East District'
  | 'Ward 4 - South Bay'
  | 'Ward 5 - Industrial Corridor';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  status: Status;
  actor: string;
  note: string;
}

export interface CitizenRequest {
  id: string;
  trackingCode: string;
  citizenName: string;
  citizenPhone: string;
  citizenEmail?: string;
  location: string;
  ward: Ward;
  category: Category;
  description: string;
  imageUrl: string;
  priority: Priority;
  status: Status;
  timestamp: string;
  assignedOfficer?: string;
  rejectionReason?: string;
  resolutionNotes?: string;
  timeline: TimelineEvent[];
}

export interface WardStatistic {
  ward: Ward;
  shortName: string;
  completed: number;
  pending: number;
  inProgress: number;
  rejected: number;
  total: number;
}
