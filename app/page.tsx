"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase/client";
import {
  LayoutDashboard, Users, Target, Handshake, Package, Wallet, BarChart3,
  Settings, Search, Bell, Plus, ArrowUpRight, Menu, X, LogOut, ShieldCheck,
  Trash2, Pencil, CheckCircle2, Clock3, CreditCard, UserPlus, Building2, Download
} from "lucide-react";

type Item = { id:number; name:string; detail:string; status?:string; amount?:number };

const PERMISSIONS = [
  "CLIENTS_VIEW","CLIENTS_CREATE","CLIENTS_EDIT","CLIENTS_DELETE","PROSPECTS_VIEW","PROSPECTS_CREATE","PROSPECTS_EDIT","PROSPECTS_DELETE",
  "PARTNERS_VIEW","PARTNERS_CREATE","PARTNERS_EDIT","PARTNERS_DELETE","PRODUCTS_VIEW","PRODUCTS_CREATE","PRODUCTS_EDIT","PRODUCTS_DELETE",
  "SALES_VIEW","SALES_CREATE","SALES_EDIT","SALES_DELETE","TASKS_VIEW","TASKS_CREATE","TASKS_EDIT","TASKS_DELETE","STATISTICS_VIEW",
  "MEMBERS_VIEW","MEMBERS_INVITE","MEMBERS_EDIT","MEMBERS_DELETE","COMPANY_SETTINGS_VIEW","COMPANY_SETTINGS_EDIT","BILLING_VIEW","BILLING_MANAGE","ACTIVITY_LOG_VIEW"
] as const;
const permissionGroups: Record<string,string[]> = {
  Clients:["CLIENTS_VIEW","CLIENTS_CREATE","CLIENTS_EDIT","CLIENTS_DELETE"], Prospects:["PROSPECTS_VIEW","PROSPECTS_CREATE","PROSPECTS_EDIT","PROSPECTS_DELETE"],
  Partenaires:["PARTNERS_VIEW","PARTNERS_CREATE","PARTNERS_EDIT","PARTNERS_DELETE"], Produits:["PRODUCTS_VIEW","PRODUCTS_CREATE","PRODUCTS_EDIT","PRODUCTS_DELETE"],
  "Suivi commercial":["SALES_VIEW","SALES_CREATE","SALES_EDIT","SALES_DELETE"], Tâches:["TASKS_VIEW","TASKS_CREATE","TASKS_EDIT","TASKS_DELETE"],
  Statistiques:["STATISTICS_VIEW"], Administration:["MEMBERS_VIEW","MEMBERS_INVITE","MEMBERS_EDIT","MEMBERS_DELETE","COMPANY_SETTINGS_VIEW","COMPANY_SETTINGS_EDIT","BILLING_VIEW","BILLING_MANAGE","ACTIVITY_LOG_VIEW"]
};
type AppRole = "SUPER_ADMIN"|"ADMIN_ENTREPRISE"|"MEMBRE";
type Member = {id:number;name:string;email:string;role:AppRole;status:"Actif"|"Désactivé";lastActivity:string;joined:string;permissions:string[]};
const roleDefaults: Record<AppRole,string[]> = {SUPER_ADMIN:[...PERMISSIONS],ADMIN_ENTREPRISE:[...PERMISSIONS],MEMBRE:["CLIENTS_VIEW","PROSPECTS_VIEW","PARTNERS_VIEW","PRODUCTS_VIEW","SALES_VIEW","TASKS_VIEW"]};


const nav = [
  ["Dashboard", LayoutDashboard], ["Clients", Users], ["Prospects", Target],
  ["Suivi commercial", Target], ["Partenaires", Handshake], ["Produits", Package], ["Paiements", Wallet],
  ["Statistiques", BarChart3], ["Paramètres", Settings],
] as const;

const initialData: Record<string, Item[]> = {
  Clients: [],
  Prospects: [],
  Partenaires: [],
  Produits: [],
  Paiements: [],
};

export default function Home() {
  const [view,setView] = useState<"landing"|"dashboard">("landing");
  const [authMode,setAuthMode] = useState<"signup"|"login"|null>(null);
  const [authName,setAuthName] = useState("");
  const [authEmail,setAuthEmail] = useState("");
  const [authPassword,setAuthPassword] = useState("");
  const [authError,setAuthError] = useState("");
  const [authLoading,setAuthLoading] = useState(false);
  const [faqOpen,setFaqOpen] = useState<number | null>(0);

  function openAuth(mode:"signup"|"login") {
    setAuthMode(mode); setAuthName(""); setAuthEmail(""); setAuthPassword(""); setAuthError("");
  }

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted || !data.user) return;
      setAuthEmail(data.user.email || "");
      const { data: membership } = await supabase
        .from("company_members")
        .select("company_id, companies(name)")
        .eq("user_id", data.user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (!mounted) return;
      if (membership) {
        const company = Array.isArray(membership.companies) ? membership.companies[0] : membership.companies;
        if (company?.name) setCompanyName(company.name);
        setView("dashboard");
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  async function submitAuth() {
    if (!authEmail.trim() || !authPassword.trim() || (authMode==="signup" && !authName.trim())) return;
    setAuthLoading(true); setAuthError("");
    const supabase = createClient();
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: { data: { full_name: authName.trim() } }
        });
        if (error) throw error;
        if (!data.user) throw new Error("Création du compte impossible.");
        if (!data.session) {
          setAuthError("Compte créé. Vérifiez votre email pour confirmer votre compte, puis connectez-vous.");
          return;
        }
        const { data: companyId, error: companyError } = await supabase.rpc("create_company_for_current_user", { p_company_name: authName.trim() });
        if (companyError) throw companyError;
        setCompanyName(authName.trim());
        setAuthMode(null); setView("dashboard");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
        if (error) throw error;
        if (!data.user) throw new Error("Connexion impossible.");
        const { data: membership, error: membershipError } = await supabase
          .from("company_members")
          .select("company_id, companies(name)")
          .eq("user_id", data.user.id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();
        if (membershipError) throw membershipError;
        if (!membership) throw new Error("Aucune entreprise active n'est associée à ce compte.");
        const company = Array.isArray(membership.companies) ? membership.companies[0] : membership.companies;
        if (company?.name) setCompanyName(company.name);
        setAuthMode(null); setView("dashboard");
      }
    } catch (error: any) {
      setAuthError(error?.message || "Une erreur d'authentification est survenue.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setView("landing"); setActive("Dashboard"); setAuthMode(null);
  }

  const [active,setActive] = useState("Dashboard");
  const [mobile,setMobile] = useState(false);
  const [query,setQuery] = useState("");
  const [data,setData] = useState(initialData);
  const [modal,setModal] = useState(false);
  const [name,setName] = useState("");
  const [activity,setActivity] = useState<any[]>([]);
  const [notificationsOpen,setNotificationsOpen] = useState(false);
  const [companyName,setCompanyName] = useState("Mon entreprise");
  const [currency,setCurrency] = useState("FCFA");
  const [emailAlerts,setEmailAlerts] = useState(true);
  const [compactMode,setCompactMode] = useState(false);
  const [twoFactor,setTwoFactor] = useState(false);
  const salesStages = ["Nouveau","Contacté","En négociation","Converti","Perdu"];
  const [currentRole] = useState<AppRole>("ADMIN_ENTREPRISE");
  const [members,setMembers] = useState<Member[]>([]);
  const [memberModal,setMemberModal] = useState(false);
  const [permissionMember,setPermissionMember] = useState<Member|null>(null);
  const [permissionTargetId,setPermissionTargetId] = useState<number | null>(null);
  const [memberForm,setMemberForm] = useState({name:"",email:"",role:"MEMBRE" as AppRole});
  const [memberPermissions,setMemberPermissions] = useState<Record<number,string[]>>({});
  const [adminQuery,setAdminQuery] = useState("");
  const [adminFilter,setAdminFilter] = useState("Tous");
  const [confirmDelete,setConfirmDelete] = useState<Member|null>(null);
  const hasPermission = (p:string) => currentRole==="SUPER_ADMIN" || currentRole==="ADMIN_ENTREPRISE" || members.some(m=>m.email===authEmail && m.permissions.includes(p));
  function inviteMember(){
    if(!memberForm.name.trim() || !memberForm.email.trim()) return;
    const m:Member={id:Date.now(),name:memberForm.name.trim(),email:memberForm.email.trim(),role:memberForm.role,status:"Actif",lastActivity:"Jamais",joined:new Date().toLocaleDateString("fr-FR"),permissions:[...(roleDefaults[memberForm.role]||[])]};
    setMembers(x=>[...x,m]); setMemberPermissions(x=>({...x,[m.id]:m.permissions}));
    setActivity(a=>[{id:Date.now(),title:"Invitation d'un membre",detail:m.email,time:"À l'instant",Icon:UserPlus},...a].slice(0,8));
    setMemberModal(false); setMemberForm({name:"",email:"",role:"MEMBRE"});
  }
  function toggleMember(id:number){setMembers(x=>x.map(m=>m.id===id?{...m,status:m.status==="Actif"?"Désactivé":"Actif"}:m));}
  function saveMemberPermissions(){
    if(!permissionMember)return;
    const perms=memberPermissions[permissionMember.id]||[];
    setMembers(x=>x.map(m=>m.id===permissionMember.id?{...m,permissions:perms}:m));
    setActivity(a=>[{id:Date.now(),title:"Permissions modifiées",detail:permissionMember.email,time:"À l'instant",Icon:ShieldCheck},...a].slice(0,8));
    setPermissionMember(null);
  }
  const adminMembers=members.filter(m=>(m.name+" "+m.email+" "+m.role).toLowerCase().includes(adminQuery.toLowerCase())).filter(m=>adminFilter==="Tous"||m.status===adminFilter||m.role===adminFilter);


  const rows = data[active] || [];
  const filtered = useMemo(() => rows.filter(x =>
    (x.name + " " + x.detail + " " + (x.status || "")).toLowerCase().includes(query.toLowerCase())
  ), [rows,query]);

  function addItem() {
    if (!name.trim() || active === "Dashboard" || active === "Statistiques" || active === "Paramètres") return;
    const itemName = name.trim();
    const itemId = Date.now();
    const defaultStatus = active==="Prospects" ? "Nouveau" : active==="Paiements" ? "En attente" : "Actif";
    setData(d => ({...d,[active]:[...d[active],{id:itemId,name:itemName,detail:"Nouvel élément",status:defaultStatus,amount:active==="Paiements"?10000:undefined}]}));
    const Icon = active==="Clients"?Users:active==="Prospects"?Target:active==="Partenaires"?Handshake:active==="Produits"?Package:CreditCard;
    const label = active==="Paiements" ? "Nouveau paiement enregistré" : `Nouveau ${active.toLowerCase().replace(/s$/,"")} ajouté`;
    setActivity(a => [{id:itemId,title:label,detail:itemName,time:"À l'instant",Icon},...a].slice(0,8));
    setName(""); setModal(false);
  }
  function removeItem(id:number) {
    setData(d => ({...d,[active]:d[active].filter(x=>x.id!==id)}));
  }
  function updateProspectStage(id:number,status:string) {
    setData(d => ({...d,Prospects:d.Prospects.map(x=>x.id===id?{...x,status}:x)}));
    const prospect = data.Prospects.find(x=>x.id===id);
    if (prospect) setActivity(a=>[{id:Date.now(),title:"Prospect mis à jour",detail:`${prospect.name} → ${status}`,time:"À l'instant",Icon:Target},...a].slice(0,8));
  }
  function exportData() {
    const csv = [["Nom","Détail","Statut","Montant"], ...rows.map(x=>[
      x.name, x.detail, x.status || "", x.amount !== undefined ? String(x.amount) : ""
    ])].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dataflow-${active.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
    {authMode && <div className="authBackdrop" onClick={()=>setAuthMode(null)}><div className="authCard" onClick={e=>e.stopPropagation()}><button className="authClose" onClick={()=>setAuthMode(null)}><X size={18}/></button><div className="landingLogo authLogo">D</div><h2>{authMode==="signup" ? "Créer votre compte" : "Bienvenue sur DataFlow"}</h2><p>{authMode==="signup" ? "Commencez votre espace professionnel." : "Connectez-vous à votre espace professionnel."}</p>{authMode==="signup" && <label>Nom de l'entreprise<input value={authName} onChange={e=>setAuthName(e.target.value)} placeholder="Mon entreprise"/></label>}<label>Email professionnel<input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="vous@entreprise.com"/></label><label>Mot de passe<input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="••••••••"/></label><button className="heroPrimary authSubmit" onClick={submitAuth} disabled={authLoading}>{authLoading ? "Connexion..." : authMode==="signup" ? "Créer mon compte" : "Se connecter"} <ArrowUpRight size={16}/></button>{authError && <div style={{marginTop:"10px",padding:"10px 12px",borderRadius:"10px",background:"#fff1f2",color:"#be123c",fontSize:"13px"}}>{authError}</div>}<button className="authSwitch" onClick={()=>setAuthMode(authMode==="signup"?"login":"signup")}>{authMode==="signup" ? "J'ai déjà un compte" : "Créer un nouveau compte"}</button></div></div>}
  </div>;

  return <div className="app">
    {mobile && <div className="overlay" onClick={()=>setMobile(false)}/>}
    <aside className={mobile ? "side open" : "side"}>
      <div className="brand"><div className="logo">D</div><div><b>DataFlow</b><small>Business OS</small></div><button className="close" onClick={()=>setMobile(false)}><X size={20}/></button></div>
      <div className="workspace"><span className="avatar">DF</span><div><b>Mon entreprise</b><small>Espace professionnel</small></div></div>
      <nav>
        <div className="navSectionLabel">TABLEAU DE BORD</div>
        <button className={active==="Dashboard"?"nav active":"nav"} onClick={()=>{setActive("Dashboard");setMobile(false)}}><LayoutDashboard size={19}/><span>Tableau de bord</span></button>
        <div className="navSectionLabel">COMMERCIAL</div>
        {[
          ["Clients",Users,"CLIENTS_VIEW"],["Prospects",Target,"PROSPECTS_VIEW"],["Partenaires",Handshake,"PARTNERS_VIEW"],["Produits",Package,"PRODUCTS_VIEW"],["Suivi commercial",Target,"SALES_VIEW"],["Tâches",CheckCircle2,"TASKS_VIEW"],["Statistiques",BarChart3,"STATISTICS_VIEW"]
        ].map(([label,Icon,perm]:any)=>hasPermission(perm)&&<button key={label} className={active===label?"nav active":"nav"} onClick={()=>{setActive(label);setQuery("");setMobile(false)}}><Icon size={19}/><span>{label}</span></button>)}
        <div className="navSectionLabel">ADMINISTRATION</div>
        {[
          ["Entreprise",Building2,"COMPANY_SETTINGS_VIEW"],["Membres & rôles",Users,"MEMBERS_VIEW"],["Permissions",ShieldCheck,"MEMBERS_EDIT"],["Abonnement & paiements",CreditCard,"BILLING_VIEW"],["Journal d'activité",Clock3,"ACTIVITY_LOG_VIEW"],["Sécurité",ShieldCheck,"COMPANY_SETTINGS_VIEW"],["Paramètres",Settings,"COMPANY_SETTINGS_VIEW"]
        ].map(([label,Icon,perm]:any)=>hasPermission(perm)&&<button key={label} className={active===label?"nav active":"nav"} onClick={()=>{setActive(label);setQuery("");setMobile(false)}}><Icon size={19}/><span>{label}</span></button>)}
      </nav>
      <div className="sideBottom">
        <div className="secure"><ShieldCheck size={18}/><span>Compte sécurisé<br/><small>Données isolées</small></span></div>
        <button className="logout" onClick={logout}><LogOut size={18}/>Déconnexion</button>
      </div>
    </aside>

    <main>
      <header>
        <button className="hamb" onClick={()=>setMobile(true)}><Menu/></button>
        <div className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher dans DataFlow..."/></div>
        <div className="headActions"><div style={{position:"relative"}}><button className="icon" onClick={()=>setNotificationsOpen(v=>!v)}><Bell size={19}/>{activity.length>0&&<i/>}</button>{notificationsOpen&&<div style={{position:"absolute",right:0,top:"48px",width:"300px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:"14px",boxShadow:"0 18px 45px rgba(15,23,42,.12)",padding:"12px",zIndex:50}}><b style={{display:"block",marginBottom:"8px"}}>Notifications</b>{activity.length===0?<span style={{fontSize:"13px",color:"#64748b"}}>Aucune nouvelle notification.</span>:activity.slice(0,5).map((x:any)=><div key={x.id} style={{padding:"9px 0",borderTop:"1px solid #f1f5f9",fontSize:"13px"}}><b>{x.title}</b><span style={{display:"block",color:"#64748b"}}>{x.detail} · {x.time}</span></div>)}</div>}</div><div className="profile"><span className="avatar">BA</span><div><b>Administrateur</b><small>ADMIN</small></div></div></div>
      </header>

      <section className="content">
        <div className="top">
          <div><p className="eyebrow">VUE D'ENSEMBLE</p><h1>{active}</h1><p className="muted">Gérez votre entreprise depuis un seul espace.</p></div>
          {!["Dashboard","Statistiques","Paramètres"].includes(active) && <button className="primary" onClick={()=>setModal(true)}><Plus size={18}/>Ajouter</button>}
        </div>

        {active==="Suivi commercial" && <div>
          <div className="cards">
            {salesStages.map(stage=>{
              const count=data.Prospects.filter(x=>x.status===stage).length;
              const value=data.Prospects.filter(x=>x.status===stage).reduce((s,x)=>s+(x.amount||0),0);
              return <div className="card" key={stage}><div className="cardTop"><span>{stage}</span><span className="cardIcon"><Target size={19}/></span></div><strong>{count}</strong><p><span className="green">{value.toLocaleString("fr-FR")} FCFA</span></p></div>;
            })}
          </div>
          <div className="panel" style={{marginTop:"18px"}}>
            <div className="panelHead"><div><h2>Pipeline commercial</h2><p>Faites avancer chaque prospect jusqu'à la conversion.</p></div><span className="miniBadge"><Target size={13}/> Suivi en temps réel</span></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(150px,1fr))",gap:"12px",overflowX:"auto"}}>
              {salesStages.map(stage=><div key={stage} style={{background:"#f8fafc",border:"1px solid #e5e7eb",borderRadius:"14px",padding:"12px",minHeight:"180px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}><b style={{fontSize:"13px"}}>{stage}</b><span style={{fontSize:"12px",color:"#64748b"}}>{data.Prospects.filter(x=>x.status===stage).length}</span></div>
                {data.Prospects.filter(x=>x.status===stage).map(p=><div key={p.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:"10px",padding:"10px",marginBottom:"8px"}}>
                  <b style={{display:"block",fontSize:"13px"}}>{p.name}</b><span style={{display:"block",fontSize:"12px",color:"#64748b",margin:"3px 0 8px"}}>{p.detail}</span>
                  <select value={p.status} onChange={e=>updateProspectStage(p.id,e.target.value)} style={{width:"100%",fontSize:"12px",padding:"6px",border:"1px solid #dbe3ec",borderRadius:"7px",background:"#fff"}}>
                    {salesStages.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>)}
                {!data.Prospects.filter(x=>x.status===stage).length && <span style={{fontSize:"12px",color:"#94a3b8"}}>Aucun prospect</span>}
              </div>)}
            </div>
          </div>
        </div>}

        {active==="Membres & rôles" && <div className="adminPage"><div className="adminToolbar"><div><p className="eyebrow">ADMINISTRATION</p><h2>Membres & rôles</h2><p className="muted">Gérez les accès de votre entreprise.</p></div><button className="primary" onClick={()=>setMemberModal(true)}><UserPlus size={17}/> Inviter un membre</button></div><div className="adminCards"><div className="card"><span>Membres</span><strong>{members.length}</strong></div><div className="card"><span>Actifs</span><strong>{members.filter(m=>m.status==="Actif").length}</strong></div><div className="card"><span>Désactivés</span><strong>{members.filter(m=>m.status==="Désactivé").length}</strong></div><div className="card"><span>Rôle</span><strong style={{fontSize:"14px"}}>Admin Entreprise</strong></div></div><div className="panel tablePanel"><div className="panelHead"><div><h2>Membres de l'entreprise</h2><p>Les membres restent limités à cet espace.</p></div><div className="adminFilters"><input value={adminQuery} onChange={e=>setAdminQuery(e.target.value)} placeholder="Rechercher..."/><select value={adminFilter} onChange={e=>setAdminFilter(e.target.value)}><option>Tous</option><option>Actif</option><option>Désactivé</option><option>MEMBRE</option><option>ADMIN_ENTREPRISE</option></select></div></div>{adminMembers.length===0?<div className="emptyInline">Aucun membre supplémentaire. Invitez votre premier membre.</div>:adminMembers.map(m=><div className="memberRow" key={m.id}><div><b>{m.name}</b><span>{m.email}</span></div><span className="roleBadge">{m.role==="ADMIN_ENTREPRISE"?"Admin Entreprise":"Membre"}</span><span className={m.status==="Actif"?"status activeStatus":"status"}>{m.status}</span><span className="memberMeta">{m.lastActivity}</span><span className="memberMeta">{m.joined}</span><div className="memberActions"><button className="iconBtn" onClick={()=>setPermissionMember(m)}><ShieldCheck size={16}/></button><button className="iconBtn" onClick={()=>toggleMember(m.id)}>{m.status==="Actif"?<Clock3 size={16}/>:<CheckCircle2 size={16}/>}</button><button className="iconBtn danger" onClick={()=>setConfirmDelete(m)}><Trash2 size={16}/></button></div></div>)}</div></div>}
        {active==="Permissions" && <div className="adminPage"><div className="adminToolbar"><div><p className="eyebrow">ADMINISTRATION</p><h2>Permissions</h2><p className="muted">Attribuez et sauvegardez les permissions d'un membre.</p></div><select className="permissionMemberSelect" value={permissionTargetId ?? ""} onChange={e=>setPermissionTargetId(e.target.value?Number(e.target.value):null)}><option value="">Sélectionner un membre</option>{members.map(m=><option key={m.id} value={m.id}>{m.name} — {m.role}</option>)}</select></div>{permissionTargetId===null?<div className="panel emptyInline">Sélectionnez un membre pour modifier ses permissions.</div>:<div className="panel"><div className="permissionMatrix">{Object.entries(permissionGroups).map(([group,perms])=><div className="permissionGroup" key={group}><h3>{group}</h3><div className="permissionChecks">{perms.map(p=><label key={p}><input type="checkbox" checked={(memberPermissions[permissionTargetId]||[]).includes(p)} onChange={e=>setMemberPermissions(x=>({...x,[permissionTargetId]:e.target.checked?[...(x[permissionTargetId]||[]),p]:(x[permissionTargetId]||[]).filter(v=>v!==p)}))}/><span>{p.replace(/_/g," ")}</span></label>)}</div></div>)}</div><div className="modalActions"><button className="primary" onClick={()=>{const perms=memberPermissions[permissionTargetId]||[];setMembers(x=>x.map(m=>m.id===permissionTargetId?{...m,permissions:perms}:m));setActivity(a=>[{id:Date.now(),title:"Permissions sauvegardées",detail:members.find(m=>m.id===permissionTargetId)?.email||"",time:"À l'instant",Icon:ShieldCheck},...a].slice(0,8));}}>Enregistrer les permissions</button></div></div>}</div>}
        {active==="Journal d'activité" && <div className="adminPage"><div className="adminToolbar"><div><p className="eyebrow">ADMINISTRATION</p><h2>Journal d'activité</h2><p className="muted">Historique des actions de cet espace.</p></div></div><div className="panel"><div className="logFilters"><input placeholder="Utilisateur"/><select><option>Toutes les actions</option><option>Création</option><option>Modification</option><option>Suppression</option></select><input type="date"/><select><option>Tous les modules</option><option>Clients</option><option>Prospects</option><option>Administration</option></select></div>{activity.length===0?<div className="emptyInline">Aucune activité enregistrée.</div>:activity.map(x=><div className="logRow" key={x.id}><span className="logDot"><x.Icon size={14}/></span><div><b>{x.title}</b><span>{x.detail}</span></div><span className="logCompany">{companyName}</span><time>{x.time}</time></div>)}</div></div>}
        {active==="Entreprise" && <div className="adminPage"><div className="adminToolbar"><div><p className="eyebrow">ADMINISTRATION</p><h2>Entreprise</h2><p className="muted">Informations de l'entreprise connectée.</p></div></div><div className="panel settingsGrid"><div><label className="settingsField">Nom de l'entreprise<input value={companyName} onChange={e=>setCompanyName(e.target.value)}/></label><label className="settingsField">Devise<select value={currency} onChange={e=>setCurrency(e.target.value)}><option>FCFA</option><option>EUR</option><option>USD</option></select></label></div><div className="securityStatus"><ShieldCheck size={18}/><div><b>Isolation entreprise</b><span>Les données doivent être filtrées par company_id côté serveur.</span></div></div></div></div>}
        {active==="Sécurité" && <div className="adminPage"><div className="adminToolbar"><div><p className="eyebrow">ADMINISTRATION</p><h2>Sécurité</h2><p className="muted">Contrôles de sécurité de l'espace.</p></div></div><div className="settingsGrid"><div className="panel"><div className="securityStatus"><ShieldCheck size={18}/><div><b>Authentification renforcée</b><span>{twoFactor?"Activée":"Non activée"}</span></div><button className={twoFactor?"toggle on":"toggle"} onClick={()=>setTwoFactor(v=>!v)}><i/></button></div><div className="securityStatus"><CheckCircle2 size={18}/><div><b>Isolation des données</b><span>Vérification serveur requise avant toute opération.</span></div></div></div><div className="panel"><h2>Règles protégées</h2><div className="metricLine"><span>Dernier Admin non supprimable</span><b>Activé</b></div><div className="metricLine"><span>Admin limité à son entreprise</span><b>Activé</b></div><div className="metricLine"><span>Super Admin protégé</span><b>Activé</b></div></div></div></div>}
        {active==="Dashboard" && <>
          <div className="cards">
            {[
              ["Clients",data.Clients.length,String(data.Clients.length)+" client(s)",Users],
              ["Prospects",data.Prospects.length,String(data.Prospects.length)+" prospect(s)",Target],
              ["Partenaires",data.Partenaires.length,String(data.Partenaires.length)+" partenaire(s)",Handshake],
              ["Produits",data.Produits.length,String(data.Produits.length)+" produit(s)",Package],
              ["Chiffre d'affaires",data.Paiements.reduce((sum,x)=>sum+(x.amount||0),0).toLocaleString("fr-FR")+" FCFA","Paiements enregistrés",Wallet]
            ].map(([t,v,s,Icon]:any)=><div className="card" key={t}><div className="cardTop"><span>{t}</span><span className="cardIcon"><Icon size={19}/></span></div><strong>{v}</strong><p><span className="green">{s}</span></p></div>)}
          </div>
          <div className="grid">
            <div className="panel"><div className="panelHead"><div><h2>Activité récente</h2><p>Dernières actions de votre espace</p></div></div>
              {activity.length ? activity.map((x:any)=><div className="row" key={x.id}><div className="dot"><x.Icon size={14}/></div><div><b>{x.title}</b><span>{x.detail}</span></div><time>{x.time}</time></div>) : <div className="emptyInline">Aucune activité pour le moment. Les actions de votre entreprise apparaîtront ici.</div>}
            </div>
            <div className="panel"><div className="panelHead"><div><h2>Suivi commercial</h2><p>Pipeline prospects</p></div><span className="miniBadge"><Target size={13}/> Réel</span></div><div className="bars">{salesStages.slice(0,4).map(stage=>{const count=data.Prospects.filter(x=>x.status===stage).length;const max=Math.max(...salesStages.map(s=>data.Prospects.filter(x=>x.status===s).length),1);return <div key={stage}><span>{stage}</span><b>{count}</b><em style={{width:(count/max*100)+"%"}}/></div>})}</div></div>
          </div>
        </>}

        {["Clients","Prospects","Partenaires","Produits","Paiements"].includes(active) && <div className="panel tablePanel">
          <div className="panelHead"><div><h2>{active}</h2><p>{filtered.length} élément(s) affiché(s)</p></div><div style={{display:"flex",gap:"8px",alignItems:"center"}}><button className="secondary" onClick={exportData} disabled={!rows.length}><Download size={15}/>Exporter CSV</button><span className="miniBadge"><CheckCircle2 size={13}/> Espace isolé</span></div></div>
          <div className="table">
            {filtered.map(x=><div className="tableRow" key={x.id}><div className="entityIcon">{active==="Clients"?<Users size={16}/>:active==="Prospects"?<Target size={16}/>:active==="Partenaires"?<Handshake size={16}/>:active==="Produits"?<Package size={16}/>:<CreditCard size={16}/>}</div><div className="entityMain"><b>{x.name}</b><span>{x.detail}</span></div>{x.amount!==undefined&&<strong>{x.amount.toLocaleString("fr-FR")} FCFA</strong>}<span className="status">{x.status}</span><button className="iconBtn"><Pencil size={15}/></button><button className="iconBtn danger" onClick={()=>removeItem(x.id)}><Trash2 size={15}/></button></div>)}
            {!filtered.length && <div className="emptyInline">Aucun résultat.</div>}
          </div>
        </div>}

        {active==="Statistiques" && (()=>{const revenue=data.Paiements.reduce((s,x)=>s+(x.amount||0),0);const prospects=data.Prospects.length;const converted=data.Prospects.filter(x=>x.status==="Converti").length;const open=data.Prospects.filter(x=>["Nouveau","Contacté","En négociation"].includes(x.status||"")).length;const pipeline=data.Prospects.filter(x=>x.status!=="Perdu"&&x.status!=="Converti").reduce((s,x)=>s+(x.amount||0),0);const conversion=prospects?Math.round(converted/prospects*1000)/10:0;const avgPayment=data.Paiements.length?Math.round(revenue/data.Paiements.length):0;const stages=salesStages.map(stage=>({stage,count:data.Prospects.filter(x=>x.status===stage).length,value:data.Prospects.filter(x=>x.status===stage).reduce((s,x)=>s+(x.amount||0),0)}));const maxStage=Math.max(...stages.map(x=>x.count),1);return <div className="statsPage"><div className="statsKpis"><div className="statMetric"><span>Chiffre d'affaires</span><strong>{revenue.toLocaleString("fr-FR")} {currency}</strong><small>{data.Paiements.length} paiement(s)</small></div><div className="statMetric"><span>Prospects</span><strong>{prospects}</strong><small>{open} opportunité(s) ouvertes</small></div><div className="statMetric"><span>Taux de conversion</span><strong>{conversion}%</strong><small>{converted} prospect(s) converti(s)</small></div><div className="statMetric"><span>Pipeline ouvert</span><strong>{pipeline.toLocaleString("fr-FR")} {currency}</strong><small>Valeur des opportunités en cours</small></div></div><div className="statsGrid"><div className="panel statBig"><div className="panelHead"><div><h2>Performance commerciale</h2><p>Nombre de prospects par étape</p></div><span className="miniBadge"><BarChart3 size={13}/> Données réelles</span></div><div className="stageChart">{stages.map(x=><div className="stageBar" key={x.stage}><div className="stageValue">{x.count}</div><i style={{height:Math.max(8,Math.round(x.count/maxStage*150))+"px"}}/><span>{x.stage}</span></div>)}</div></div><div className="panel statBig"><div className="panelHead"><div><h2>Indicateurs financiers</h2><p>Lecture rapide de votre activité</p></div></div><div className="metricLine"><span>Panier moyen</span><b>{avgPayment.toLocaleString("fr-FR")} {currency}</b></div><div className="metricLine"><span>Partenaires</span><b>{data.Partenaires.length}</b></div><div className="metricLine"><span>Produits</span><b>{data.Produits.length}</b></div><div className="metricLine"><span>Clients</span><b>{data.Clients.length}</b></div><div className="metricLine"><span>Prospects perdus</span><b>{data.Prospects.filter(x=>x.status==="Perdu").length}</b></div></div></div><div className="panel"><div className="panelHead"><div><h2>Répartition du pipeline</h2><p>Valeur par étape commerciale</p></div></div><div className="pipelineStats">{stages.map(x=><div key={x.stage}><div><span>{x.stage}</span><b>{x.value.toLocaleString("fr-FR")} {currency}</b></div><em><i style={{width:(pipeline?Math.min(100,x.value/pipeline*100):0)+"%"}}/></em></div>)}</div></div></div>})()}

        {active==="Paramètres" && <div className="settingsPage"><div className="settingsGrid"><div className="panel"><div className="panelHead"><div><h2>Entreprise</h2><p>Personnalisez votre espace professionnel</p></div><Building2 size={18}/></div><label className="settingsField">Nom de l'entreprise<input value={companyName} onChange={e=>setCompanyName(e.target.value)} /></label><label className="settingsField">Devise<select value={currency} onChange={e=>setCurrency(e.target.value)}><option>FCFA</option><option>EUR</option><option>USD</option></select></label><div className="saveHint"><CheckCircle2 size={15}/> Modifications enregistrées automatiquement</div></div><div className="panel"><div className="panelHead"><div><h2>Préférences</h2><p>Adaptez DataFlow à votre façon de travailler</p></div><Settings size={18}/></div><div className="toggleRow"><div><b>Alertes par email</b><span>Recevoir les notifications importantes.</span></div><button className={emailAlerts?"toggle on":"toggle"} onClick={()=>setEmailAlerts(v=>!v)}><i/></button></div><div className="toggleRow"><div><b>Mode compact</b><span>Réduire les espacements de l'interface.</span></div><button className={compactMode?"toggle on":"toggle"} onClick={()=>setCompactMode(v=>!v)}><i/></button></div><div className="toggleRow"><div><b>Authentification renforcée</b><span>Préparer la protection 2 étapes du compte.</span></div><button className={twoFactor?"toggle on":"toggle"} onClick={()=>setTwoFactor(v=>!v)}><i/></button></div></div></div><div className="settingsGrid"><div className="panel"><div className="panelHead"><div><h2>Rôles et permissions</h2><p>Administration séparée des privilèges système</p></div><ShieldCheck size={18}/></div><div className="role"><b>ADMIN</b><span>Accès système complet</span></div><div className="role"><b>ADMINISTRATION</b><span>Accès administratif sans privilèges ADMIN</span></div><div className="role"><b>MEMBRE</b><span>Accès limité aux modules autorisés</span></div></div><div className="panel"><div className="panelHead"><div><h2>Sécurité</h2><p>État de votre espace</p></div></div><div className="securityStatus"><CheckCircle2 size={17}/><div><b>Données séparées</b><span>Les informations restent organisées par espace.</span></div></div><div className="securityStatus"><ShieldCheck size={17}/><div><b>Protection du compte</b><span>{twoFactor?"Authentification renforcée activée":"Authentification renforcée non activée"}</span></div></div></div></div></div>}

        <div className="trial"><div><b>Essai gratuit</b><span>Il vous reste 7 jours pour tester DataFlow.</span></div><button>Gérer l'abonnement</button></div>
      </section>
    </main>

    {memberModal && <div className="modalBackdrop" onClick={()=>setMemberModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modalHead"><div><h2>Inviter un membre</h2><p>Préparez une invitation à rejoindre l'entreprise.</p></div><button className="iconBtn" onClick={()=>setMemberModal(false)}><X size={18}/></button></div><label>Nom<input value={memberForm.name} onChange={e=>setMemberForm({...memberForm,name:e.target.value})}/></label><label style={{display:"block",marginTop:"12px"}}>Email<input type="email" value={memberForm.email} onChange={e=>setMemberForm({...memberForm,email:e.target.value})}/></label><label style={{display:"block",marginTop:"12px"}}>Rôle<select value={memberForm.role} onChange={e=>setMemberForm({...memberForm,role:e.target.value as AppRole})}><option value="MEMBRE">Membre</option><option value="ADMIN_ENTREPRISE">Admin Entreprise</option></select></label><div className="modalActions"><button className="secondary" onClick={()=>setMemberModal(false)}>Annuler</button><button className="primary" onClick={inviteMember}>Créer l'invitation</button></div></div></div>}
    {permissionMember && <div className="modalBackdrop" onClick={()=>setPermissionMember(null)}><div className="modal permissionModal" onClick={e=>e.stopPropagation()}><div className="modalHead"><div><h2>Permissions de {permissionMember.name}</h2><p>{permissionMember.email}</p></div><button className="iconBtn" onClick={()=>setPermissionMember(null)}><X size={18}/></button></div><div className="permissionMatrix">{Object.entries(permissionGroups).map(([group,perms])=><div className="permissionGroup" key={group}><h3>{group}</h3>{perms.map(p=><label key={p}><input type="checkbox" checked={(memberPermissions[permissionMember.id]||[]).includes(p)} onChange={e=>setMemberPermissions(x=>({...x,[permissionMember.id]:e.target.checked?[...(x[permissionMember.id]||[]),p]:(x[permissionMember.id]||[]).filter(v=>v!==p)}))}/><span>{p.replace(/_/g," ")}</span></label>)}</div>)}</div><div className="modalActions"><button className="secondary" onClick={()=>setPermissionMember(null)}>Annuler</button><button className="primary" onClick={saveMemberPermissions}>Enregistrer</button></div></div></div>}
    {confirmDelete && <div className="modalBackdrop" onClick={()=>setConfirmDelete(null)}><div className="modal" onClick={e=>e.stopPropagation()}><h2>Supprimer ce membre ?</h2><p>Cette action est définitive pour {confirmDelete.email}.</p><div className="modalActions"><button className="secondary" onClick={()=>setConfirmDelete(null)}>Annuler</button><button className="primary" onClick={()=>{setMembers(x=>x.filter(m=>m.id!==confirmDelete.id));setConfirmDelete(null);}}>Supprimer</button></div></div></div>}
    {modal && <div className="modalBackdrop" onClick={()=>setModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modalHead"><div><h2>Ajouter {active.toLowerCase()}</h2><p>Les données seront enregistrées dans cet espace.</p></div><button className="iconBtn" onClick={()=>setModal(false)}><X size={18}/></button></div><label>Nom<input autoFocus value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem()} placeholder={active==="Clients"?"Nom du client":"Nom de l'élément"}/></label><div className="modalActions"><button className="secondary" onClick={()=>setModal(false)}>Annuler</button><button className="primary" onClick={addItem}><Plus size={16}/>Créer</button></div></div></div>}
  </div>
}
