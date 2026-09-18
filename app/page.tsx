"use client";

import { useMemo, useState } from "react";
import {
  LayoutDashboard, Users, Target, Handshake, Package, Wallet, BarChart3,
  Settings, Search, Bell, Plus, ArrowUpRight, Menu, X, LogOut, ShieldCheck,
  Trash2, Pencil, CheckCircle2, Clock3, CreditCard, UserPlus, Building2
} from "lucide-react";

type Item = { id:number; name:string; detail:string; status?:string; amount?:number };

const nav = [
  ["Dashboard", LayoutDashboard], ["Clients", Users], ["Prospects", Target],
  ["Partenaires", Handshake], ["Produits", Package], ["Paiements", Wallet],
  ["Statistiques", BarChart3], ["Paramètres", Settings],
] as const;

const initialData: Record<string, Item[]> = {
  Clients: [
    {id:1,name:"Hôtel Ledger",detail:"contact@ledger.example",status:"Actif"},
    {id:2,name:"La Palmeraie",detail:"+236 70 00 00 00",status:"Actif"},
    {id:3,name:"École Excellence",detail:"Bangui",status:"Actif"},
  ],
  Prospects: [
    {id:1,name:"Clinique Centre",detail:"À rappeler demain",status:"Négociation"},
    {id:2,name:"Supermarché Central",detail:"Premier contact",status:"Contacté"},
    {id:3,name:"Transport Express",detail:"Nouveau prospect",status:"Nouveau"},
  ],
  Partenaires: [
    {id:1,name:"Partenaire A",detail:"Commercial",status:"Actif"},
    {id:2,name:"Partenaire B",detail:"Technologie",status:"Actif"},
  ],
  Produits: [
    {id:1,name:"Pack Standard",detail:"Gestion clients",status:"Disponible"},
    {id:2,name:"Pack Premium",detail:"Gestion complète",status:"Disponible"},
  ],
  Paiements: [
    {id:1,name:"Hôtel Ledger",detail:"18/09/2026",status:"Confirmé",amount:25000},
    {id:2,name:"La Palmeraie",detail:"17/09/2026",status:"En attente",amount:10000},
  ],
};

export default function Home() {
  const [active,setActive] = useState("Dashboard");
  const [mobile,setMobile] = useState(false);
  const [query,setQuery] = useState("");
  const [data,setData] = useState(initialData);
  const [modal,setModal] = useState(false);
  const [name,setName] = useState("");

  const rows = data[active] || [];
  const filtered = useMemo(() => rows.filter(x =>
    (x.name + " " + x.detail + " " + (x.status || "")).toLowerCase().includes(query.toLowerCase())
  ), [rows,query]);

  function addItem() {
    if (!name.trim() || active === "Dashboard" || active === "Statistiques" || active === "Paramètres") return;
    setData(d => ({...d,[active]:[...d[active],{id:Date.now(),name:name.trim(),detail:"Nouvel élément",status:active==="Paiements"?"En attente":"Actif",amount:active==="Paiements"?10000:undefined}]}));
    setName(""); setModal(false);
  }
  function removeItem(id:number) {
    setData(d => ({...d,[active]:d[active].filter(x=>x.id!==id)}));
  }

  return <div className="app">
    {mobile && <div className="overlay" onClick={()=>setMobile(false)}/>}
    <aside className={mobile ? "side open" : "side"}>
      <div className="brand"><div className="logo">D</div><div><b>DataFlow</b><small>Business OS</small></div><button className="close" onClick={()=>setMobile(false)}><X size={20}/></button></div>
      <div className="workspace"><span className="avatar">DF</span><div><b>Mon entreprise</b><small>Espace professionnel</small></div></div>
      <nav>{nav.map(([label,Icon])=><button key={label} className={active===label?"nav active":"nav"} onClick={()=>{setActive(label);setQuery("");setMobile(false)}}><Icon size={19}/><span>{label}</span></button>)}</nav>
      <div className="sideBottom">
        <div className="secure"><ShieldCheck size={18}/><span>Compte sécurisé<br/><small>Données isolées</small></span></div>
        <button className="logout"><LogOut size={18}/>Déconnexion</button>
      </div>
    </aside>

    <main>
      <header>
        <button className="hamb" onClick={()=>setMobile(true)}><Menu/></button>
        <div className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher dans DataFlow..."/></div>
        <div className="headActions"><button className="icon"><Bell size={19}/><i/></button><div className="profile"><span className="avatar">BA</span><div><b>Administrateur</b><small>ADMIN</small></div></div></div>
      </header>

      <section className="content">
        <div className="top">
          <div><p className="eyebrow">VUE D'ENSEMBLE</p><h1>{active}</h1><p className="muted">Gérez votre entreprise depuis un seul espace.</p></div>
          {!["Dashboard","Statistiques","Paramètres"].includes(active) && <button className="primary" onClick={()=>setModal(true)}><Plus size={18}/>Ajouter</button>}
        </div>

        {active==="Dashboard" && <>
          <div className="cards">
            {[
              ["Clients","128","+12 ce mois",Users],["Prospects","64","+8 cette semaine",Target],
              ["Partenaires","23","+3 ce mois",Handshake],["Produits","47","5 à faible stock",Package]
            ].map(([t,v,s,Icon]:any)=><div className="card" key={t}><div className="cardTop"><span>{t}</span><span className="cardIcon"><Icon size={19}/></span></div><strong>{v}</strong><p><span className={String(s).includes("faible")?"orange":"green"}>{s}</span></p></div>)}
          </div>
          <div className="grid">
            <div className="panel"><div className="panelHead"><div><h2>Activité récente</h2><p>Dernières actions de votre espace</p></div></div>
              {[["Nouveau client ajouté","Hôtel Ledger","Il y a 12 min",UserPlus],["Prospect déplacé","Restaurant La Palmeraie","Il y a 38 min",Target],["Paiement enregistré","25 000 FCFA","Il y a 1 h",CreditCard],["Produit ajouté","Pack Premium","Il y a 2 h",Package]].map(([a,b,c,Icon]:any,i)=><div className="row" key={i}><div className="dot"><Icon size={14}/></div><div><b>{a}</b><span>{b}</span></div><time>{c}</time></div>)}
            </div>
            <div className="panel"><div className="panelHead"><div><h2>Suivi commercial</h2><p>Pipeline prospects</p></div></div><div className="bars">{[["Nouveaux",28,"80%"],["Contactés",19,"55%"],["En négociation",11,"38%"],["Convertis",6,"22%"]].map(x=><div key={x[0] as string}><span>{x[0]}</span><b>{x[1]}</b><em style={{width:x[2] as string}}/></div>)}</div></div>
          </div>
        </>}

        {["Clients","Prospects","Partenaires","Produits","Paiements"].includes(active) && <div className="panel tablePanel">
          <div className="panelHead"><div><h2>{active}</h2><p>{filtered.length} élément(s) affiché(s)</p></div><span className="miniBadge"><CheckCircle2 size={13}/> Espace isolé</span></div>
          <div className="table">
            {filtered.map(x=><div className="tableRow" key={x.id}><div className="entityIcon">{active==="Clients"?<Users size={16}/>:active==="Prospects"?<Target size={16}/>:active==="Partenaires"?<Handshake size={16}/>:active==="Produits"?<Package size={16}/>:<CreditCard size={16}/>}</div><div className="entityMain"><b>{x.name}</b><span>{x.detail}</span></div>{x.amount!==undefined&&<strong>{x.amount.toLocaleString("fr-FR")} FCFA</strong>}<span className="status">{x.status}</span><button className="iconBtn"><Pencil size={15}/></button><button className="iconBtn danger" onClick={()=>removeItem(x.id)}><Trash2 size={15}/></button></div>)}
            {!filtered.length && <div className="emptyInline">Aucun résultat.</div>}
          </div>
        </div>}

        {active==="Statistiques" && <div className="statsGrid"><div className="panel statBig"><p>CHIFFRE D'AFFAIRES</p><strong>145 000 FCFA</strong><span>+18% sur la période</span><div className="fakeChart">{[35,48,42,65,54,78,70,92].map((h,i)=><i key={i} style={{height:h+"%"}}/>)}</div></div><div className="panel statBig"><p>CONVERSION</p><strong>9,4%</strong><span>64 prospects · 6 convertis</span><div className="progress"><em style={{width:"62%"}}/></div></div></div>}

        {active==="Paramètres" && <div className="grid"><div className="panel"><div className="panelHead"><div><h2>Entreprise</h2><p>Informations de l'espace professionnel</p></div></div><div className="setting"><Building2 size={18}/><div><b>Mon entreprise</b><span>Espace professionnel</span></div></div><div className="setting"><ShieldCheck size={18}/><div><b>Sécurité</b><span>Les données sont séparées par espace.</span></div></div></div><div className="panel"><div className="panelHead"><div><h2>Rôles</h2><p>Permissions de l'équipe</p></div></div><div className="role"><b>ADMIN</b><span>Accès système complet</span></div><div className="role"><b>ADMINISTRATION</b><span>Accès administratif sans privilèges ADMIN</span></div><div className="role"><b>MEMBRE</b><span>Accès limité aux modules autorisés</span></div></div></div>}

        <div className="trial"><div><b>Essai gratuit</b><span>Il vous reste 7 jours pour tester DataFlow.</span></div><button>Gérer l'abonnement</button></div>
      </section>
    </main>

    {modal && <div className="modalBackdrop" onClick={()=>setModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modalHead"><div><h2>Ajouter {active.toLowerCase()}</h2><p>Les données seront enregistrées dans cet espace.</p></div><button className="iconBtn" onClick={()=>setModal(false)}><X size={18}/></button></div><label>Nom<input autoFocus value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem()} placeholder={active==="Clients"?"Nom du client":"Nom de l'élément"}/></label><div className="modalActions"><button className="secondary" onClick={()=>setModal(false)}>Annuler</button><button className="primary" onClick={addItem}><Plus size={16}/>Créer</button></div></div></div>}
  </div>
}
