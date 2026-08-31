import AppProviders from '../../components/AppProviders';
import Header from '../../components/Header';
import BottomNav from '../../components/BottomNav';

export default function AppLayout({ children }) {
  return (
    <AppProviders>
      <div className="app-shell">
        <Header />
        <main className="app-main">{children}</main>
        <BottomNav />
      </div>
    </AppProviders>
  );
}
