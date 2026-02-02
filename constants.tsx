
import { Lead, LeadStatus } from './types';

export const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '0612345678',
    email: 'j.dupont@email.com',
    address: '12 Rue de la Paix',
    city: 'Lyon',
    postalCode: '69002',
    roofArea: 45,
    monthlyBill: 120,
    status: LeadStatus.NEW,
    source: 'Facebook Ads',
    notes: ['Intéressé par le crédit d\'impôt', 'A déjà un devis concurrent'],
    nextFollowUpDate: new Date().toISOString()
  },
  {
    id: '2',
    firstName: 'Marie',
    lastName: 'Lefebvre',
    phone: '0789456123',
    email: 'm.lefebvre@gmail.com',
    address: '45 Avenue Jean Jaurès',
    city: 'Villeurbanne',
    postalCode: '69100',
    roofArea: 60,
    monthlyBill: 180,
    status: LeadStatus.TO_RECALL,
    source: 'Google Search',
    notes: ['Maison individuelle orientée Sud'],
    nextFollowUpDate: new Date().toISOString()
  },
  {
    id: '3',
    firstName: 'Robert',
    lastName: 'Martin',
    phone: '0472001122',
    email: 'robert.martin@orange.fr',
    address: '8 Boulevard des Belges',
    city: 'Lyon',
    postalCode: '69006',
    roofArea: 30,
    monthlyBill: 90,
    status: LeadStatus.APPOINTMENT,
    source: 'Parrainage',
    notes: ['RDV le 25/10 à 14h'],
    lastContactDate: '2024-10-20'
  }
];

export const STATUS_COLORS = {
  [LeadStatus.NEW]: 'bg-blue-100 text-blue-700 border-blue-200',
  [LeadStatus.TO_RECALL]: 'bg-amber-100 text-amber-700 border-amber-200',
  [LeadStatus.IN_PROGRESS]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  [LeadStatus.APPOINTMENT]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [LeadStatus.UNREACHABLE]: 'bg-slate-100 text-slate-700 border-slate-200',
  [LeadStatus.NOT_INTERESTED]: 'bg-rose-100 text-rose-700 border-rose-200',
  [LeadStatus.WRONG_NUMBER]: 'bg-gray-100 text-gray-700 border-gray-200',
};
