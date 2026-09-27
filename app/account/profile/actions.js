'use server';
import { revalidatePath } from 'next/cache';
import { requireAccount } from '../../../lib/auth/session';
export async function saveProfile(previous, form) {
 const { client } = await requireAccount('/account/profile');
 const firstName = String(form.get('firstName') || '').trim();
 const lastName = String(form.get('lastName') || '').trim();
 if ([firstName,lastName].some(v => v.length > 80 || /[\u0000-\u001f\u007f]/.test(v))) return { message:'Please use a name of up to 80 characters.', ok:false };
 try {
  const { error } = await client.auth.updateUser({ data:{ first_name:firstName, last_name:lastName, full_name:[firstName,lastName].filter(Boolean).join(' ') } });
  if (error) return { message:'Your profile could not be saved. Please try again.', ok:false };
 } catch { return { message:'Your profile could not be saved. Please try again.', ok:false }; }
 revalidatePath('/account','layout');
 return { message:'Profile saved.', ok:true };
}
