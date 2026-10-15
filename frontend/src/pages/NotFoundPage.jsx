import { Link } from 'react-router-dom'
export default function NotFoundPage() {
  return <section className="section-wrap page-section not-found"><p className="eyebrow">404 · PAGE NOT FOUND</p><h1>This page isn't here.</h1><p>Use the marketplace to find available industrial listings.</p><Link className="button button-primary" to="/marketplace">Go to marketplace</Link></section>
}
