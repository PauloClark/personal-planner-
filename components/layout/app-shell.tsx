'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, LayoutDashboard, ListTodo, Settings, Plus, LogOut, ArrowUpRight, Leaf } from 'lucide-react';
import { usePlanner } from '@/components/planner-provider';
import { HeaderTools } from '@/components/layout/header-tools';
import { categories } from '@/types/planner';
const navigation = [{href:'/dashboard', label:'Dashboard', icon:LayoutDashboard}, {href:'/calendar', label:'Calendar', icon:CalendarDays}, {href:'/tasks', label:'Tasks', icon:ListTodo}, {href:'/settings', label:'Settings', icon:Settings}];
export function AppShell({children}: {children: React.ReactNode}) {
  const path = usePathname(); const {user, addEvent, logout, signingOut, loadError, refresh} = usePlanner();
  return <div className="app-shell"><aside className="sidebar">
    <Link href="/dashboard" className="brand"><span className="brand-icon"><CalendarDays size={22}/></span>My Planner<span className="brand-dot">.</span></Link>
    <div className="workspace-label">YOUR PERSONAL SPACE</div><nav className="desktop-nav" aria-label="Main navigation">{navigation.map(({href,label,icon:Icon}) => <Link key={href} href={href} className={path === href ? 'nav-link active' : 'nav-link'} aria-current={path === href ? 'page' : undefined}><Icon size={19}/>{label}{path === href && <span className="nav-dot"/>}</Link>)}</nav>
    <button className="button primary sidebar-add" onClick={() => addEvent()}><Plus size={18}/>Add event</button>
    <div className="sidebar-categories"><div className="workspace-label">MY CATEGORIES</div>{categories.map(c => <div className="category-key" key={c}><span className={`color-dot dot-${c.toLowerCase()}`}/>{c}</div>)}</div>
    <div className="sidebar-bottom"><div className="quiet-note"><Leaf size={20}/><p>A little structure.<br/><strong>More room for life.</strong></p></div><div className="profile"><div className="avatar">{user.email[0]?.toUpperCase() ?? 'M'}</div><div className="profile-text"><strong>My account</strong><span title={user.email}>{user.email}</span></div><button className="icon-button" aria-label="Sign out" title="Sign out" onClick={() => void logout()} disabled={signingOut}><LogOut size={17}/></button></div></div>
  </aside><div className="main-shell"><header className="topbar"><div className="breadcrumb">My workspace <span>/</span> <strong>{navigation.find(n => n.href === path)?.label}</strong></div><span className="topbar-note"><span className="online-dot"/>A space for your everyday</span><Link className="mobile-brand" href="/dashboard"><CalendarDays size={21}/>My Planner</Link><HeaderTools/></header><main className="main-content overflow-x-clip">{loadError && <div className="load-error" role="alert"><span>{loadError}</span><button className="button" onClick={() => void refresh()}>Retry <ArrowUpRight size={14}/></button></div>}{children}</main><footer className="app-footer">Make space for what matters.<span>My Planner</span></footer></div>
    <nav className="mobile-nav" aria-label="Mobile navigation">{navigation.map(({href,label,icon:Icon}) => <Link href={href} key={href} className={path === href ? 'active' : ''} aria-current={path === href ? 'page' : undefined}><Icon size={20}/><span>{label}</span></Link>)}</nav>
  </div>;
}
