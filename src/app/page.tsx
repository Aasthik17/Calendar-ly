import CalendarRoot from '@/components/Calendar/CalendarRoot';

export default function Home() {
  return (
    <main style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: 'var(--space-lg)',
    }}>
      <CalendarRoot />
    </main>
  );
}
