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
  const [view,setView] = useState<"landing"|"dashboard">("landing");
  const [authMode,setAuthMode] = useState<"signup"|"login"|null>(null);
  const [authName,setAuthName] = useState("");
  const [authEmail,setAuthEmail] = useState("");
  const [authPassword,setAuthPassword] = useState("");
  const [faqOpen,setFaqOpen] = useState<number | null>(0);

  function openAuth(mode:"signup"|"login") {
    setAuthMode(mode); setAuthName(""); setAuthEmail(""); setAuthPassword("");
  }
  function submitAuth() {
    if (!authEmail.trim() || !authPassword.trim() || (authMode==="signup" && !authName.trim())) return;
    setAuthMode(null); setView("dashboard");
  }

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

  if (view === "landing") return <div className="landing">
    <header className="landingHeader">
      <div className="landingBrand"><div className="landingLogo">D</div><div><b>DataFlow</b><span>Business OS</span></div></div>
      <nav className="landingNav"><a href="#fonctionnalites">Fonctionnalités</a><a href="#comment">Comment ça marche</a><a href="#securite">Sécurité</a><a href="#faq">FAQ</a></nav>
      <div className="landingActions"><button className="loginBtn" onClick={()=>openAuth("login")}>Se connecter</button><button className="landingCta" onClick={()=>openAuth("signup")}>Créer un compte</button></div>
    </header>
    <main className="landingMain">
      <section className="hero"><div className="heroCopy">
        <div className="pill"><span/> Gestion commerciale simple et centralisée</div>
        <h1>Gérez votre entreprise.<br/><em>Plus simplement.</em></h1>
        <p>DataFlow réunit vos clients, prospects, partenaires, produits, paiements et statistiques dans un seul espace professionnel.</p>
        <div className="heroButtons"><button className="heroPrimary" onClick={()=>openAuth("signup")}>Commencer gratuitement <ArrowUpRight size={17}/></button><button className="heroSecondary" onClick={()=>openAuth("login")}>J'ai déjà un compte</button></div>
        <div className="trust"><ShieldCheck size={16}/> Données isolées · Essai gratuit · Accessible sur mobile</div>
      </div><div className="heroVisual"><div className="dashWindow">
        <div className="dashTop"><div className="miniDots"><i/><i/><i/></div><span>DataFlow Dashboard</span><b>Mon entreprise</b></div>
        <div className="miniStats"><div><span>Clients</span><strong>128</strong><small>+12 ce mois</small></div><div><span>Prospects</span><strong>64</strong><small>+8 cette semaine</small></div><div><span>Paiements</span><strong>145K</strong><small>FCFA ce mois</small></div></div>
        <div className="miniPanel"><div><b>Suivi commercial</b><span>Pipeline prospects</span></div><div className="miniBars"><i/><i/><i/><i/></div></div><div className="miniRows"><div/><div/><div/></div>
      </div></div></section>
      <section className="logosSection"><p>UNE SEULE PLATEFORME POUR VOTRE ACTIVITÉ</p><div><span>CLIENTS</span><span>PROSPECTS</span><span>PRODUITS</span><span>PAIEMENTS</span><span>STATISTIQUES</span></div></section>
      <section id="fonctionnalites" className="featuresSection"><div className="sectionIntro"><p className="landingEyebrow">TOUT AU MÊME ENDROIT</p><h2>Les outils essentiels pour piloter votre activité</h2><p>Finissez avec les informations dispersées. DataFlow vous donne une vue claire de votre entreprise.</p></div>
        <div className="featureGrid"><div className="featureCard"><span className="featureIcon"><Users size={20}/></span><h3>Clients</h3><p>Centralisez vos contacts et gardez une vision claire de chaque client.</p></div><div className="featureCard"><span className="featureIcon"><Target size={20}/></span><h3>Prospects</h3><p>Suivez chaque opportunité de la prise de contact jusqu'à la conversion.</p></div><div className="featureCard"><span className="featureIcon"><Wallet size={20}/></span><h3>Paiements</h3><p>Enregistrez vos paiements et suivez vos encaissements simplement.</p></div><div className="featureCard"><span className="featureIcon"><BarChart3 size={20}/></span><h3>Statistiques</h3><p>Visualisez les indicateurs importants pour votre activité.</p></div></div>
      </section>
      <section id="comment" className="stepsSection"><div className="sectionIntro"><p className="landingEyebrow">DÉMARRER EN QUELQUES MINUTES</p><h2>Simple du premier clic au dashboard</h2></div><div className="steps"><div><b>01</b><h3>Créez votre compte</h3><p>Inscrivez votre entreprise et commencez votre espace professionnel.</p></div><div><b>02</b><h3>Ajoutez vos données</h3><p>Clients, prospects, produits, partenaires et paiements.</p></div><div><b>03</b><h3>Pilotez votre activité</h3><p>Retrouvez vos informations et vos indicateurs depuis un seul dashboard.</p></div></div></section>
      <section id="securite" className="securitySection"><div><span className="featureIcon"><ShieldCheck size={22}/></span><p className="landingEyebrow">ESPACE PROFESSIONNEL</p><h2>Vos données restent organisées dans votre espace.</h2><p>DataFlow est conçu pour séparer les données de chaque entreprise et proposer une expérience claire et professionnelle.</p></div><div className="securityCard"><ShieldCheck size={28}/><b>Données isolées</b><span>Votre espace professionnel est séparé des autres comptes.</span><CheckCircle2 size={18}/><b>Accès sécurisé</b><span>Connectez-vous à votre espace quand vous en avez besoin.</span></div></section>
      <section id="faq" className="faqSection"><div className="sectionIntro"><p className="landingEyebrow">FAQ</p><h2>Questions fréquentes</h2><p>Tout ce qu'il faut savoir avant de commencer avec DataFlow.</p></div><div className="faqList">{[
        ["Qu'est-ce que DataFlow ?","DataFlow est un espace professionnel qui centralise la gestion des clients, prospects, partenaires, produits, paiements et statistiques de votre entreprise."],
        ["Puis-je essayer DataFlow gratuitement ?","Oui. La landing page présente un essai gratuit de 7 jours pour découvrir votre espace professionnel."],
        ["Comment créer mon compte ?","Cliquez sur « Créer un compte » ou « Commencer gratuitement », puis renseignez le nom de votre entreprise, votre email et votre mot de passe."],
        ["Mes données sont-elles séparées des autres entreprises ?","DataFlow est conçu autour d'espaces professionnels séparés afin d'organiser les données de chaque entreprise indépendamment."],
        ["Puis-je utiliser DataFlow sur téléphone ?","Oui. L'interface est responsive et pensée pour être utilisable sur mobile, tablette et ordinateur."]
      ].map(([q,a],i)=><div className={faqOpen===i?"faqItem open":"faqItem"} key={q}><button onClick={()=>setFaqOpen(faqOpen===i?null:i)}><span>{q}</span><span className="faqPlus">{faqOpen===i?"−":"+"}</span></button>{faqOpen===i&&<p>{a}</p>}</div>)}</div></section>
      <section className="finalCta"><p className="landingEyebrow">PRÊT À COMMENCER ?</p><h2>Votre activité mérite un espace organisé.</h2><p>Créez votre compte et découvrez DataFlow.</p><button className="heroPrimary" onClick={()=>openAuth("signup")}>Créer mon compte <ArrowUpRight size={17}/></button></section>
    </main>
    <footer className="landingFooter"><div className="landingBrand"><div className="landingLogo">D</div><div><b>DataFlow</b><span>Business OS</span></div></div><span>© 2026 DataFlow. Gestion commerciale.</span></footer>
    {authMode && <div className="authBackdrop" onClick={()=>setAuthMode(null)}><div className="authCard" onClick={e=>e.stopPropagation()}><button className="authClose" onClick={()=>setAuthMode(null)}><X size={18}/></button><div className="landingLogo authLogo">D</div><h2>{authMode==="signup" ? "Créer votre compte" : "Bienvenue sur DataFlow"}</h2><p>{authMode==="signup" ? "Commencez votre espace professionnel." : "Connectez-vous à votre espace professionnel."}</p>{authMode==="signup" && <label>Nom de l'entreprise<input value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="Mon entreprise"/></label>}<label>Email professionnel<input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="vous@entreprise.com"/></label><label>Mot de passe<input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="••••••••"/></label><button className="heroPrimary authSubmit" onClick={submitAuth}>{authMode==="signup" ? "Créer mon compte" : "Se connecter"} <ArrowUpRight size={16}/></button><button className="authSwitch" onClick={()=>setAuthMode(authMode==="signup"?"login":"signup")}>{authMode==="signup" ? "J'ai déjà un compte" : "Créer un nouveau compte"}</button></div></div>}
  </div>;

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
