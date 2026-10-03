 'use client';
import { useState } from 'react';
import CheckoutView from '../checkout/CheckoutView';
const plan={country:'Italy',dataGB:1,duration:7,price:3.52,operator:'Mamma Mia',networks:['Wind Tre','Vodafone','Iliad']};
export default function Preview(){const [compatible,setCompatible]=useState(false);return <><p style={{position:'fixed',bottom:0,left:0,right:0,zIndex:10000,margin:0,padding:'12px 24px',fontSize:13,textAlign:'center',background:'var(--color-page)',borderTop:'1px solid var(--color-border)'}}>Local design preview · Sample plan · Payment disabled</p><CheckoutView plan={plan} iso="IT" compatible={compatible} setCompatible={setCompatible} formatData={p=>`${p.dataGB} GB`} continueToPayment={()=>{}}/></>;}
