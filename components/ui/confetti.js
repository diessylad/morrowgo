 'use client';
// Canvas/ref lifecycle adapted from the supplied canvas-confetti component.
import {forwardRef,useCallback,useImperativeHandle,useMemo,useRef} from 'react';
import confetti from 'canvas-confetti';
const globalOptions={resize:true,useWorker:true};
export const Confetti=forwardRef(function Confetti({options,...props},ref){
 const instance=useRef(null);
 const canvasRef=useCallback(node=>{
  if(node){if(!instance.current)instance.current=confetti.create(node,globalOptions);}
  else{instance.current?.reset();instance.current=null;}
 },[]);
 const fire=useCallback(overrides=>instance.current?.({...options,...overrides}),[options]);
 const api=useMemo(()=>({fire,reset:()=>instance.current?.reset()}),[fire]);
 useImperativeHandle(ref,()=>api,[api]);
 return <canvas ref={canvasRef} {...props}/>;
});
