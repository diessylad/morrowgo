import {accountJson,verifiedApiAccount} from '../../../../../../lib/account/api';
import {readCustomerEsim} from '../../../../../../lib/account/readers';
import {enrichSandboxEsim} from '../../../../../../lib/airalo/account';
export const dynamic='force-dynamic';
export async function GET(request,{params}){
 const account=await verifiedApiAccount();if(account.response)return account.response;
 const result=await readCustomerEsim(account.client,account.user.id,params.id);
 if(result.error||!result.data)return accountJson({error:'not_found'},404);
 try{return accountJson({esim:await enrichSandboxEsim(account.user.id,result.data)});}catch{return accountJson({error:'Sandbox details temporarily unavailable'},503);}
}
