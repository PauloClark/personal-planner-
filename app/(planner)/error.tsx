'use client';
export default function ErrorPage({reset}: {reset: () => void}) { return <div className="empty-state"><h2>Something went wrong</h2><p>Your changes may not have loaded. Please try again.</p><button className="button primary" onClick={reset}>Try again</button></div>; }
