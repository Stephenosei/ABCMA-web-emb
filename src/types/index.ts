export type ServiceCategory = 'business' | 'permits' | 'civil' | 'sanitation' | 'works';

export interface MunicipalService {
  id: string;
  category: ServiceCategory;
  title: string;
  description: string;
  processingTime: string;
  statutoryFee: string;
  department: string;
  requirements: string[];
}

export type BillType = 'property_rate' | 'business_operating_permit' | 'market_toll' | 'sanitation_levy';

export interface BillRecord {
  id: string;
  billNumber: string;
  type: BillType;
  title: string;
  taxpayerName: string;
  ghanaCardOrTin: string;
  phone: string;
  electoralArea: string;
  propertyAddressOrStore: string;
  period: string;
  assessedValueGHS: number;
  amountDueGHS: number;
  amountPaidGHS: number;
  balanceGHS: number;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid';
  lastPaymentDate?: string;
  receiptNumber?: string;
}

export type PaymentMethod = 'mtn_momo' | 'telecel_cash' | 'at_money' | 'card_ghlink';

export interface PaymentTransaction {
  receiptNumber: string;
  billNumber: string;
  taxpayerName: string;
  billType: BillType;
  amountPaidGHS: number;
  paymentMethod: PaymentMethod;
  phoneNumberOrCard: string;
  timestamp: string;
  referenceId: string;
  status: 'successful' | 'pending' | 'failed';
  qrCodeToken: string;
}

export type IssueCategory =
  | 'choked_drain'
  | 'pothole_road'
  | 'refuse_dump'
  | 'broken_streetlight'
  | 'noise_pollution'
  | 'health_hazard';

export type IssueStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved';

export interface CitizenIssue {
  id: string;
  trackingCode: string;
  category: IssueCategory;
  title: string;
  description: string;
  electoralArea: string;
  landmark: string;
  reportedBy: string;
  contactPhone: string;
  photoUrl?: string;
  status: IssueStatus;
  dateReported: string;
  departmentAssigned: string;
  resolutionNotes?: string;
  lastUpdated: string;
}

export interface AssemblyMember {
  id: string;
  name: string;
  title: string;
  electoralArea: string;
  committee: string;
  phone: string;
  email: string;
  term: string;
  officeHours: string;
}

export interface TownHallMeeting {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  electoralArea: string;
  agenda: string[];
  documentsAttached?: string;
  rsvpsCount: number;
}

export interface MunicipalProject {
  id: string;
  title: string;
  electoralArea: string;
  description: string;
  percentageComplete: number;
  budgetGHS: string;
  fundingSource: string;
  contractor: string;
  startDate: string;
  estimatedCompletion: string;
  imageUrl: string;
  status: 'In Progress' | 'Near Completion' | 'Commissioned';
}

export interface GazettedDocument {
  id: string;
  title: string;
  category: 'Bye-Laws' | 'Fee-Fixing' | 'Budget' | 'Tenders';
  gazetteNumber: string;
  year: number;
  fileSize: string;
  summary: string;
}

export interface MunicipalDepartment {
  id: string;
  name: string;
  shortCode: string;
  category: 'admin' | 'technical' | 'social' | 'finance' | 'planning';
  head: string;
  headTitle: string;
  room: string;
  phone: string;
  email: string;
  description: string;
  coreFunctions: string[];
  servicesOffered: string[];
  operatingHours: string;
}

export interface MunicipalNewsItem {
  id: string;
  title: string;
  category: 'Notice' | 'Infrastructure' | 'Welfare' | 'Health' | 'Assembly';
  date: string;
  excerpt: string;
  content: string;
  author: string;
  readTime: string;
  badgeColor: string;
  targetPage: string;
  targetLabel: string;
}


