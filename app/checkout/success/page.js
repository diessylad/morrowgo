'use client';

import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function SuccessPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#080808',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          textAlign: 'center'
        }}
      >
        <CheckCircle
          size={52}
          strokeWidth={1.5}
        />

        <div
          style={{
            marginTop: '28px',
            fontSize: '12px',
            letterSpacing: '2px',
            color: '#888'
          }}
        >
          MORROWGO
        </div>

        <h1
          style={{
            fontSize:
              'clamp(38px, 8vw, 60px)',
            margin: '12px 0'
          }}
        >
          Payment received
        </h1>

        <p
          style={{
            color: '#999',
            lineHeight: '1.6'
          }}
        >
          Your payment was completed.
          We are confirming your eSIM order.
        </p>

        <button
          onClick={() =>
            router.push('/')
          }
          style={{
            marginTop: '30px',
            border: 0,
            borderRadius: '30px',
            padding: '15px 24px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          Back to MORROWGO
          <ArrowRight size={17} />
        </button>
      </div>
    </main>
  );
}
