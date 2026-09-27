'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { saveProfile } from '../../app/account/profile/actions';
import { Text } from '../i18n/Provider';
import LanguageSelect from '../i18n/LanguageSelect';
import a from './account.module.css';
import s from './dashboard.module.css';
function Submit(){ const { pending } = useFormStatus(); return <button className={a.button} disabled={pending}><Text>{pending?'Saving…':'Save changes'}</Text></button>; }
export default function ProfileForm({profile}) {
 const [state,action] = useFormState(saveProfile,{message:'',ok:false});
 return <section className={`${s.smallCard} ${s.profileForm}`}><h1><Text>My profile</Text></h1><form action={action}><div className={s.fields}><label><Text>First name</Text><input name="firstName" autoComplete="given-name" maxLength={80} defaultValue={profile.firstName}/></label><label><Text>Last name</Text><input name="lastName" autoComplete="family-name" maxLength={80} defaultValue={profile.lastName}/></label></div><p>{profile.email}</p><Submit/><p role="status" aria-live="polite"><Text>{state.message}</Text></p></form><div className={s.languageRow}><Text>Preferred language</Text><LanguageSelect/></div><p className={s.fine}><Text>Your language preference is saved on this device.</Text></p></section>;
}
