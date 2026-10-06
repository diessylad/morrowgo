 'use client';
import {useState,Children} from 'react';
import {Text} from '../i18n/Provider';
import {esimStatus} from '../../lib/account/presentation.mjs';
import styles from './account.module.css';
import s from './mobileEsim.module.css';
export default function EsimCollection({esims,asOf,children}){
 const [filter,setFilter]=useState('all'),items=Children.toArray(children);
 const matches=esims.map(e=>filter==='all'||esimStatus(e,asOf)===filter);
 return <><div className={s.filters} aria-label="eSIM filters">{[['all','All'],['active','Active'],['ready','Ready'],['expired','Expired']].map(([value,label])=><button key={value} type="button" aria-pressed={filter===value} onClick={()=>setFilter(value)}><Text>{label}</Text></button>)}</div><div className={styles.grid}>{items.map((child,i)=><div className={s.item} data-hidden={!matches[i]} key={esims[i].id}>{child}</div>)}</div>{!matches.some(Boolean)&&<p className={`${s.list} ${s.empty}`} role="status"><Text>No matching eSIMs.</Text></p>}</>;
}
