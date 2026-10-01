import { ArrowUpRight } from 'lucide-react';
import { Card } from './ui.jsx';

export default function StatCard({ label, value, detail, icon: Icon, tone = 'olive' }) {
  return <Card className="stat-card"><div className={`stat-icon stat-${tone}`}><Icon size={19} strokeWidth={1.8}/></div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{detail}<ArrowUpRight size={13}/></small></div></Card>;
}
