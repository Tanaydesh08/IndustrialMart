import { Truck } from 'lucide-react'

const illustrations = {
  'rice-milling-machinery': '⚙️',
  'complete-rice-mill-plants': '🏭',
  'spare-parts-components': '🔧',
  'material-handling-equipment': '🚚',
  'sorting-grading-packaging': '📦',
  'electrical-automation': '⚡',
  'industrial-services': '🧰',
}

export default function CategoryIcon({ slug }) {
  if (slug === 'truck') return <span className="category-emoji category-emoji-truck" aria-hidden="true"><Truck /></span>
  return <span className="category-emoji" aria-hidden="true">{illustrations[slug] || '🏭'}</span>
}
