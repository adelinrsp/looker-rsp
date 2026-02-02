
export enum LeadStatus {
  NEW = 'Nouveau',
  TO_RECALL = 'À rappeler',
  IN_PROGRESS = 'En cours',
  APPOINTMENT = 'RDV Fixé',
  UNREACHABLE = 'Injoignable',
  NOT_INTERESTED = 'Pas intéressé',
  WRONG_NUMBER = 'Faux numéro',
}

export interface Lead {
  id: string;
  rowIndex?: number;
  dateEntry?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email: string;
  address?: string;
  postalCode: string;
  city?: string;
  roofArea?: number;
  monthlyBill?: number;
  dateContact?: string;
  sms?: string;
  mail?: string;
  dateAppointment?: string;
  status: string;
  infoLoss?: string;
  salesperson?: string;
  notes: string[];
  salesStatus?: string;
  amount?: string | number;
  source: string;
  canal?: string;
  campagne?: string;
  creative?: string;
  nextFollowUpDate?: string;
  lastContactDate?: string;
}

export interface CompanyExpense {
  rowIndex: number;
  name: string;
  description: string;
  provider: string;
  expenseType: string;
  date: string;
  endDate: string;
  amount: number;
}

export interface DashboardStats {
  totalLeads: number;
  appointmentsCount: number;
  toRecallCount: number;
  conversionRate: number;
}
