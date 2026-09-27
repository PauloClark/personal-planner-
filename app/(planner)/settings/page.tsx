'use client';
import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, LogOut, ShieldCheck } from 'lucide-react';
import { usePlanner } from '@/components/planner-provider';
import { PageHeader } from '@/components/layout/page-header';
const subscribe = () => () => {};
export default function SettingsPage() {
  const {user, logout, signingOut} = usePlanner(); const {theme, setTheme} = useTheme(); const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return <><PageHeader eyebrow="MAKE YOURSELF AT HOME" title="Settings" description="Your planner, just the way you like it."/><div className="settings-stack"><section className="panel settings-section"><h2>Your account</h2><p>The personal space for all your plans.</p><div className="account-info"><div className="avatar large">{user.email[0]?.toUpperCase()}</div><div><span className="muted">Email address</span><strong>{user.email}</strong></div><ShieldCheck className="account-shield" size={22}/></div></section><section className="panel settings-section"><h2>Appearance</h2><p>Choose a comfortable view for your day.</p><div className="theme-options">{[{value:'light', label:'Light', Icon:Sun}, {value:'dark', label:'Dark', Icon:Moon}, {value:'system', label:'System', Icon:Monitor}].map(({value,label,Icon}) => <button key={value} className={mounted && theme === value ? 'theme-option selected' : 'theme-option'} aria-pressed={mounted && theme === value} onClick={() => setTheme(value)}><Icon size={24}/><strong>{label}</strong><span>{value === 'system' ? 'Follow your device' : `Always ${value}`}</span></button>)}</div></section><section className="panel settings-section setting-row"><div><h2>Sign out</h2><p>Your plans will be here when you come back.</p></div><button className="button" onClick={() => void logout()} disabled={signingOut}><LogOut size={16}/>{signingOut ? 'Signing out…' : 'Sign out'}</button></section><p className="settings-footnote">Calendar dates, times, and reminders use Asia/Manila. Theme preference is saved on this device.</p></div></>;
}
