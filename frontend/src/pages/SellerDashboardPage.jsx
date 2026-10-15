import { Link } from 'react-router-dom'
import { ClipboardList, Plus } from 'lucide-react'

export default function SellerDashboardPage() {
  return <section className="section-wrap page-section">
    <div className="page-heading"><p className="eyebrow">SELLER SPACE</p><h1>Seller dashboard</h1><p>Start a listing and follow its returned payment and moderation state.</p></div>
    <div className="workflow-card dashboard-limitation"><ClipboardList size={28}/><h2>Seller-owned listing history is not available yet</h2><p>The backend has no seller account, ownership field, or endpoint to list listings by seller. This dashboard does not invent seller listings or show another seller's records.</p><Link className="button button-primary" to="/create-listing"><Plus size={17}/> Create a listing</Link></div>
  </section>
}
