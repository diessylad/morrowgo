import { Check } from 'lucide-react';
import { Text } from '../i18n/Provider';
import s from './connectionSteps.module.css';

// Presentation only: callers supply already-verified state; no status inference.
export default function ConnectionSteps({ steps }) {
  return <ol className={s.steps} aria-label="Connection progress">{steps.map((step,index) =>
    <li key={step.label} data-state={step.state} aria-current={step.state==='current'?'step':undefined}>
      <span className={s.marker} aria-hidden="true">{step.state==='complete'?<Check size={14}/>:index+1}</span>
      <span><Text>{step.label}</Text><small><Text>{step.state==='complete'?'Complete':step.state==='current'?'Next step':'Pending'}</Text></small></span>
    </li>)}</ol>;
}
