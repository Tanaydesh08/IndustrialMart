const labels = {
  PENDING_REVIEW: 'Pending review',
  NEEDS_REVIEW: 'Needs review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PENDING: 'Pending',
  SUCCESS: 'Successful',
  FAILED: 'Failed',
}
export default function StatusBadge({ status }) {
  return <span className={`status-badge status-${String(status || 'UNKNOWN').toLowerCase()}`}>{labels[status] || status || 'Unknown'}</span>
}
