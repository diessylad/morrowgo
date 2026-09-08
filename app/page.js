'use client';

import { Search, ArrowRight, Globe2, Zap, Ban, Smartphone, Headphones, ScanLine, Signal, ShoppingBag } from 'lucide-react';

const destinations = [
  {name:'Germany', price:'€4.50', image:'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=80'},
  {name:'Turkey', price:'€3.90', image:'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=900&q=80'},
  {name:'USA', price:'€4.90', image:'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=900&q=80'},
  {name:'Italy', price:'€4.90', image:'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=900&q=80'},
  {name:'Spain', price:'€4.50', image:'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=900&q=80'},
  {name:'Thailand', price:'€4.90', image:'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?auto=format&fit=crop&w=900&q=80'}
];

export default function Home() {
  return (
    <main>
      <header className="nav wrap">
        <a className="logo">MORROWGO</a>
        <nav><a href="#destinations">eSIM</a><a href="#destinations">Destinations</a><a href="#how">How it works</a><a href="#support">Support</a></nav>
        <div className="navRight"><Search size={19}/><span>◎ &nbsp; EN⌄</span><button className="cart">Cart (0)</button></div>
      </header>

      <section className="hero">
        <div className="heroPhoto"/>
        <div className="wrap heroGrid">
          <div className="heroCopy">
            <div className="eyebrow">GLOBAL eSIM FOR MODERN TRAVELERS</div>
            <h1>Stay connected<br/>wherever you go</h1>
            <p>Affordable eSIMs in 200+ destinations. Instant activation.<br/>No roaming fees. Just freedom.</p>
            <div className="search"><Search/><span>Where are you travelling to?</span><button><ArrowRight/></button></div>
            <div className="chips">{['Turkey','USA','Germany','Italy','Spain','France','Thailand','UAE'].map(x=><span key={x}>{x}</span>)}</div>
          </div>
          <div className="phone">
            <div className="phoneTop">9:41 <span>▮▮▮ ᯤ ▰</span></div>
            <div className="phoneLogo">MORROWGO</div>
            <div className="phoneWords">Different<br/>Places<br/>Same<br/>Connection</div>
            <div className="phoneLine"/>
            <div className="activated">✓ &nbsp; eSIM Activated</div>
          </div>
          <div className="sideWords">MORE<br/>PLACES<br/>BIGGER<br/>STORIES<div/></div>
        </div>
      </section>

      <section className="benefits">
        <div className="wrap benefitGrid">
          <Benefit icon={<Globe2/>} top="200+" bottom="destinations"/>
          <Benefit icon={<Zap/>} top="Instant" bottom="activation"/>
          <Benefit icon={<Ban/>} top="No roaming" bottom="fees"/>
          <Benefit icon={<Smartphone/>} top="Keep your" bottom="number"/>
          <Benefit icon={<Headphones/>} top="24/7" bottom="support"/>
        </div>
      </section>

      <section id="destinations" className="wrap destinations">
        <div className="sectionHead"><h2>Popular destinations</h2><button>View all destinations <ArrowRight size={16}/></button></div>
        <div className="cards">{destinations.map(d=><article className="card" key={d.name}>
          <img src={d.image} alt={d.name}/>
          <div className="cardBody"><strong>{d.name}</strong><small>From</small><div><b>{d.price}</b><button><ArrowRight size={16}/></button></div></div>
        </article>)}</div>
      </section>

      <section id="how" className="wrap how">
        <h2>How it works</h2>
        <div className="steps">
          <Step n="01" icon={<Search/>} title="Choose a plan" text="Pick your destination and data plan."/>
          <Step n="02" icon={<ScanLine/>} title="Install eSIM" text="Get your QR code and install it in seconds."/>
          <Step n="03" icon={<Signal/>} title="Stay connected" text="Enjoy fast and reliable internet anywhere."/>
          <div className="script">Good<br/>Connections<br/>Better<br/>Journeys</div>
        </div>
      </section>

      <footer id="support">
        <div className="wrap footerGrid">
          <div><div className="logo">MORROWGO</div><small>STAY CONNECTED.<br/>GO FURTHER.</small></div>
          <div className="newsletter"><small>Get travel tips and exclusive deals</small><div><span>Your email</span><button><ArrowRight/></button></div></div>
          <div className="social">◎ &nbsp; ♪ &nbsp; ▷</div>
        </div>
      </footer>
    </main>
  );
}

function Benefit({icon,top,bottom}) { return <div className="benefit">{icon}<div><b>{top}</b><span>{bottom}</span></div></div> }
function Step({n,icon,title,text}) { return <div className="step"><span className="num">{n}</span><div className="stepIcon">{icon}</div><div><b>{title}</b><p>{text}</p></div></div> }
