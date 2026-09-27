"use client";

import { useMemo, useState } from "react";
import { BarChart3, Bell, Boxes, CalendarDays, ChevronRight, CircleDollarSign, ClipboardList, Coffee, CreditCard, DollarSign, LayoutDashboard, Menu as MenuIcon, Package, Plus, Receipt, Settings, ShoppingBag, Store, Table2, TrendingUp, Users, Wallet, X } from "lucide-react";

type OrderStatus = "En attente" | "En préparation" | "Prête" | "Servie" | "Annulée";
type TableStatus = "Libre" | "Occupée" | "En attente de paiement";

const products = [
  { id: 1, name: "Poulet braisé", category: "Plats", price: 4500 },
  { id: 2, name: "Poisson braisé", category: "Plats", price: 5000 },
  { id: 3, name: "Burger maison", category: "Plats", price: 3500 },
  { id: 4, name: "Frites maison", category: "Accompagnements", price: 1500 },
  { id: 5, name: "Salade fraîche", category: "Entrées", price: 2000 },
  { id: 6, name: "Jus de gingembre", category: "Boissons", price: 1000 },
  { id: 7, name: "Coca-Cola", category: "Boissons", price: 1000 },
  { id: 8, name: "Eau minérale", category: "Boissons", price: 500 },
];

const initialOrders = [
  { id: "#1042", table: "Table 4", items: 3, total: 10500, status: "En préparation" as OrderStatus, time: "18:24" },
  { id: "#1041", table: "Table 2", items: 2, total: 7000, status: "En attente" as OrderStatus, time: "18:19" },
  { id: "#1040", table: "À emporter", items: 4, total: 12500, status: "Prête" as OrderStatus, time: "18:10" },
  { id: "#1039", table: "Table 7", items: 5, total: 18500, status: "Servie" as OrderStatus, time: "17:55" },
];

const initialTables = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  status: (i === 1 || i === 3 || i === 6 ? "Occupée" : i === 8 ? "En attente de paiement" : "Libre") as TableStatus,
}));

const money = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export default function RestaurantApp() {
  const [active, setActive] = useState("Tableau de bord");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [orders, setOrders] = useState(initialOrders);
  const [tables, setTables] = useState(initialTables);
  const [cart, setCart] = useState<{id:number; qty:number}[]>([]);
  const [category, setCategory] = useState("Tous");
  const [showNewOrder, setShowNewOrder] = useState(false);

  const cartTotal = useMemo(() => cart.reduce((sum, line) => {
    const p = products.find(x => x.id === line.id)!;
    return sum + p.price * line.qty;
  }, 0), [cart]);

  const addProduct = (id:number) => setCart(c => {
    const found = c.find(x => x.id === id);
    return found ? c.map(x => x.id === id ? {...x, qty:x.qty+1} : x) : [...c, {id, qty:1}];
  });

  const createOrder = () => {
    if (!cart.length) return;
    const order = { id: "#" + (1043 + orders.length - initialOrders.length), table: "À emporter", items: cart.reduce((s,x)=>s+x.qty,0), total: cartTotal, status: "En attente" as OrderStatus, time: new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) };
    setOrders(o => [order, ...o]);
    setCart([]);
    setShowNewOrder(false);
    setActive("Commandes");
  };

  const nav = [
    ["Tableau de bord", LayoutDashboard], ["Commandes", ClipboardList], ["Tables", Table2],
    ["Menu", MenuIcon], ["Caisse", CreditCard], ["Stock", Boxes], ["Dépenses", Receipt],
    ["Clients", Users], ["Employés", Users], ["Statistiques", BarChart3], ["Paramètres", Settings],
  ] as const;

  return (
    <div className="restaurant-app">
      <style>{`
        *{box-sizing:border-box} body{margin:0;background:#f7f8fa;color:#15171a;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        button{font:inherit}.restaurant-app{min-height:100vh;display:flex;background:#f7f8fa}.sidebar{width:250px;background:#111315;color:#fff;padding:22px 14px;position:fixed;inset:0 auto 0 0;z-index:30}
        .brand{display:flex;align-items:center;gap:11px;padding:4px 10px 25px;font-weight:800;font-size:20px}.brandIcon{width:38px;height:38px;border-radius:12px;background:#f2c94c;color:#111;display:grid;place-items:center}.brand small{display:block;color:#8d9299;font-size:10px;font-weight:500;margin-top:2px}
        .nav{display:grid;gap:4px}.nav button{border:0;background:transparent;color:#aeb3ba;padding:11px 12px;border-radius:10px;text-align:left;display:flex;align-items:center;gap:12px;cursor:pointer;font-size:14px}.nav button:hover,.nav button.active{background:#24272a;color:#fff}.nav button.active{box-shadow:inset 3px 0 #f2c94c}
        .main{margin-left:250px;width:calc(100% - 250px);min-width:0}.top{height:72px;background:#fff;border-bottom:1px solid #e7e8ea;display:flex;align-items:center;justify-content:space-between;padding:0 30px;position:sticky;top:0;z-index:20}.topLeft h1{font-size:20px;margin:0 0 2px}.topLeft p{margin:0;color:#7b8087;font-size:12px}.topRight{display:flex;align-items:center;gap:14px}.iconBtn{width:38px;height:38px;border:1px solid #e5e7eb;background:#fff;border-radius:10px;display:grid;place-items:center;cursor:pointer}.profile{display:flex;align-items:center;gap:9px}.avatar{width:36px;height:36px;border-radius:50%;background:#202327;color:#fff;display:grid;place-items:center;font-size:12px;font-weight:700}.content{padding:28px 30px 40px;max-width:1500px;margin:auto}.actions{display:flex;gap:10px}.primary{background:#15171a;color:#fff;border:0;border-radius:10px;padding:10px 15px;display:flex;gap:8px;align-items:center;cursor:pointer;font-weight:700}.secondary{background:#fff;color:#15171a;border:1px solid #e1e4e8;border-radius:10px;padding:10px 15px;cursor:pointer}
        .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.card{background:#fff;border:1px solid #e6e8eb;border-radius:14px;padding:18px}.metric{display:flex;justify-content:space-between;align-items:flex-start}.metricLabel{color:#72777f;font-size:12px}.metricValue{font-size:25px;font-weight:800;margin-top:7px}.metricIcon{width:38px;height:38px;border-radius:10px;background:#f5f6f7;display:grid;place-items:center}.trend{font-size:11px;color:#22834a;margin-top:7px}.sectionTitle{display:flex;justify-content:space-between;align-items:center;margin:26px 0 12px}.sectionTitle h2{font-size:16px;margin:0}.muted{font-size:12px;color:#7b8087}.split{display:grid;grid-template-columns:1.45fr .8fr;gap:14px}.orders{width:100%;border-collapse:collapse}.orders th,.orders td{padding:13px 8px;text-align:left;border-bottom:1px solid #eef0f2;font-size:12px}.orders th{color:#81868d;font-weight:600}.badge{display:inline-flex;border-radius:999px;padding:5px 9px;font-size:10px;font-weight:700}.pending{background:#fff5d9;color:#9b7300}.prep{background:#e7f0ff;color:#2762a8}.ready{background:#e6f7ee;color:#21804a}.served{background:#edf0f3;color:#525960}.cancel{background:#fde8e8;color:#b42318}.bars{height:205px;display:flex;align-items:end;gap:12px;padding:16px 6px 5px}.barWrap{flex:1;height:100%;display:flex;align-items:end;gap:6px}.bar{width:100%;background:#24272a;border-radius:5px 5px 0 0;min-height:15px}.barLight{background:#e5e7eb}.barLabel{font-size:10px;color:#858a90;text-align:center;margin-top:7px}.tableGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.tableCard{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:16px;cursor:pointer}.tableNo{font-size:22px;font-weight:800}.statusDot{font-size:11px;margin-top:8px;color:#686e75}.free{border-top:3px solid #4aa564}.busy{border-top:3px solid #e05252}.pay{border-top:3px solid #e2b93b}.menuGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.product{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:16px}.productTop{height:80px;border-radius:10px;background:#f2f3f4;display:grid;place-items:center}.product h3{font-size:14px;margin:12px 0 4px}.price{font-weight:800}.tag{font-size:10px;color:#7b8087}.modalBg{position:fixed;inset:0;background:#0008;z-index:50;display:grid;place-items:center;padding:18px}.modal{width:min(850px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:18px;padding:22px}.modalHead{display:flex;justify-content:space-between;align-items:center}.modalHead h2{margin:0}.catRow{display:flex;gap:8px;overflow:auto;padding:15px 0}.cat{white-space:nowrap;border:1px solid #e1e4e8;background:#fff;border-radius:999px;padding:8px 12px;font-size:12px;cursor:pointer}.cat.active{background:#15171a;color:#fff}.modalProducts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.modalProduct{border:1px solid #e5e7eb;background:#fff;border-radius:12px;padding:13px;text-align:left;cursor:pointer}.cartBox{margin-top:18px;background:#f7f8fa;border-radius:12px;padding:14px}.cartLine{display:flex;justify-content:space-between;padding:7px 0;font-size:12px}.mobileMenu{display:none}
        @media(max-width:1000px){.grid{grid-template-columns:repeat(2,1fr)}.split{grid-template-columns:1fr}.menuGrid{grid-template-columns:repeat(2,1fr)}.tableGrid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:760px){.sidebar{display:none}.sidebar.open{display:block;width:270px;box-shadow:10px 0 30px #0004}.main{margin-left:0;width:100%}.top{padding:0 16px}.mobileMenu{display:grid}.topLeft h1{font-size:17px}.content{padding:20px 16px}.grid{grid-template-columns:1fr 1fr}.tableGrid{grid-template-columns:1fr 1fr}.modalProducts{grid-template-columns:1fr 1fr}.actions .secondary{display:none}.profile span{display:none}}
        @media(max-width:460px){.grid{grid-template-columns:1fr}.menuGrid{grid-template-columns:1fr 1fr}.modalProducts{grid-template-columns:1fr}.tableGrid{grid-template-columns:1fr 1fr}.topRight{gap:6px}}
      `}</style>

      <aside className={`sidebar ${mobileOpen ? "open":""}`}>
        <div className="brand"><div className="brandIcon"><Store size={20}/></div><div>Restaurant<small>par NexaSoft Africa</small></div></div>
        <nav className="nav">{nav.map(([label,Icon])=><button key={label} className={active===label?"active":""} onClick={()=>{setActive(label);setMobileOpen(false)}}><Icon size={17}/>{label}</button>)}</nav>
      </aside>

      <main className="main">
        <header className="top">
          <div className="topLeft"><h1>{active}</h1><p>Gérez votre restaurant simplement et efficacement.</p></div>
          <div className="topRight"><button className="iconBtn mobileMenu" onClick={()=>setMobileOpen(!mobileOpen)}>{mobileOpen?<X size={18}/>:<MenuIcon size={18}/>}</button><button className="iconBtn"><Bell size={17}/></button><div className="profile"><div className="avatar">RA</div><span style={{fontSize:12,fontWeight:700}}>Responsable</span></div></div>
        </header>

        <div className="content">
          {active==="Tableau de bord" && <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,gap:10,flexWrap:"wrap"}}><div><div className="muted">Aujourd’hui · 27 septembre 2026</div><h2 style={{margin:"4px 0",fontSize:24}}>Bonjour 👋</h2></div><div className="actions"><button className="secondary"><CalendarDays size={15}/> Aujourd’hui</button><button className="primary" onClick={()=>setShowNewOrder(true)}><Plus size={16}/> Nouvelle commande</button></div></div>
            <div className="grid">
              {[
                ["Chiffre d’affaires",money(248500),TrendingUp,"+12,5%"],
                ["Commandes", "42", ClipboardList, "+8,2%"],
                ["En attente","6",ShoppingBag,"Aujourd’hui"],
                ["Bénéfice estimé",money(126400),DollarSign,"+10,1%"],
              ].map(([label,value,Icon,trend])=><div className="card" key={String(label)}><div className="metric"><div><div className="metricLabel">{label}</div><div className="metricValue">{value}</div><div className="trend">{trend}</div></div><div className="metricIcon"><Icon size={18}/></div></div></div>)}
            </div>
            <div className="split">
              <section><div className="sectionTitle"><h2>Ventes de la semaine</h2><span className="muted">7 derniers jours</span></div><div className="card"><div className="bars">{[55,72,48,86,66,94,76].map((h,i)=><div key={i} style={{flex:1,height:"100%",display:"flex",flexDirection:"column",justifyContent:"end"}}><div className="bar" style={{height:h+"%"}}></div><div className="barLabel">{["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"][i]}</div></div>)}</div></section>
              <section><div className="sectionTitle"><h2>Stock</h2><span className="muted">À surveiller</span></div><div className="card">{[["Poulet","12 kg","low"],["Riz","38 kg","ok"],["Huile","6 L","low"],["Boissons","84 unités","ok"]].map(x=><div key={x[0]} style={{padding:"10px 0",borderBottom:"1px solid #eef0f2",display:"flex",justifyContent:"space-between",fontSize:12}}><span>{x[0]}</span><b>{x[1]}</b></div>)}</div></section>
            </div>
            <div className="sectionTitle"><h2>Commandes récentes</h2><button className="secondary" onClick={()=>setActive("Commandes")}>Voir tout <ChevronRight size={14}/></button></div>
            <div className="card"><table className="orders"><thead><tr><th>Commande</th><th>Table</th><th>Articles</th><th>Total</th><th>Statut</th></tr></thead><tbody>{orders.slice(0,4).map(o=><tr key={o.id}><td><b>{o.id}</b><div className="muted">{o.time}</div></td><td>{o.table}</td><td>{o.items}</td><td><b>{money(o.total)}</b></td><td><span className={`badge ${o.status==="En attente"?"pending":o.status==="En préparation"?"prep":o.status==="Prête"?"ready":o.status==="Annulée"?"cancel":"served"}`}>{o.status}</span></td></tr>)}</tbody></table></div>
          </>}

          {active==="Commandes" && <><div className="sectionTitle"><div><h2>Commandes</h2><span className="muted">{orders.length} commandes enregistrées</span></div><button className="primary" onClick={()=>setShowNewOrder(true)}><Plus size={16}/> Nouvelle commande</button></div><div className="card"><table className="orders"><thead><tr><th>Commande</th><th>Table</th><th>Articles</th><th>Total</th><th>Statut</th><th>Action</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td><b>{o.id}</b><div className="muted">{o.time}</div></td><td>{o.table}</td><td>{o.items}</td><td><b>{money(o.total)}</b></td><td><span className={`badge ${o.status==="En attente"?"pending":o.status==="En préparation"?"prep":o.status==="Prête"?"ready":o.status==="Annulée"?"cancel":"served"}`}>{o.status}</span></td><td><button className="secondary" onClick={()=>setOrders(xs=>xs.map(x=>x.id===o.id?{...x,status:x.status==="En attente"?"En préparation":x.status==="En préparation"?"Prête":x.status==="Prête"?"Servie":x.status}:x))}>Étape suivante</button></td></tr>)}</tbody></table></div></>}

          {active==="Tables" && <><div className="sectionTitle"><div><h2>Tables</h2><span className="muted">Suivi en temps réel des tables</span></div></div><div className="tableGrid">{tables.map(t=><div className={`tableCard ${t.status==="Libre"?"free":t.status==="Occupée"?"busy":"pay"}`} key={t.id} onClick={()=>setTables(ts=>ts.map(x=>x.id===t.id?{...x,status:x.status==="Libre"?"Occupée":x.status==="Occupée"?"En attente de paiement":"Libre"}:x))}><div className="tableNo">Table {t.id}</div><div className="statusDot">{t.status==="Libre"?"🟢":t.status==="Occupée"?"🔴":"🟡"} {t.status}</div></div>)}</div></>}

          {active==="Menu" && <><div className="sectionTitle"><div><h2>Menu</h2><span className="muted">Gérez vos produits et tarifs</span></div><button className="primary"><Plus size={16}/> Ajouter un produit</button></div><div className="menuGrid">{products.map(p=><div className="product" key={p.id}><div className="productTop"><Coffee size={28}/></div><h3>{p.name}</h3><div className="tag">{p.category}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}><span className="price">{money(p.price)}</span><button className="iconBtn" onClick={()=>addProduct(p.id)}><Plus size={15}/></button></div></div>)}</div></>}

          {["Caisse","Stock","Dépenses","Clients","Employés","Statistiques","Paramètres"].includes(active) && <><div className="sectionTitle"><div><h2>{active}</h2><span className="muted">Module prêt à être connecté à vos données réelles.</span></div></div><div className="grid"><div className="card"><div className="metricIcon"><Wallet size={18}/><div></div></div><div className="metricValue">248 500 FCFA</div><div className="metricLabel">Résumé du jour</div></div><div className="card"><div className="metricIcon"><Package size={18}/><div></div></div><div className="metricValue">12</div><div className="metricLabel">Éléments à suivre</div></div><div className="card"><div className="metricIcon"><Users size={18}/><div></div></div><div className="metricValue">86</div><div className="metricLabel">Enregistrés</div></div><div className="card"><div className="metricIcon"><BarChart3 size={18}/><div></div></div><div className="metricValue">+12,5%</div><div className="metricLabel">Évolution</div></div></div></>}
        </div>
      </main>

      {showNewOrder && <div className="modalBg" onClick={(e)=>{if(e.target===e.currentTarget)setShowNewOrder(false)}}><div className="modal"><div className="modalHead"><div><h2>Nouvelle commande</h2><span className="muted">Ajoutez les produits puis validez.</span></div><button className="iconBtn" onClick={()=>setShowNewOrder(false)}><X size={18}/></button></div><div className="catRow">{["Tous","Plats","Accompagnements","Entrées","Boissons"].map(c=><button className={`cat ${category===c?"active":""}`} key={c} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="modalProducts">{products.filter(p=>category==="Tous"||p.category===category).map(p=><button className="modalProduct" key={p.id} onClick={()=>addProduct(p.id)}><b>{p.name}</b><div className="muted">{money(p.price)}</div></button>)}</div><div className="cartBox"><b>Commande</b>{cart.length===0?<div className="muted" style={{marginTop:8}}>Aucun produit ajouté.</div>:cart.map(line=>{const p=products.find(x=>x.id===line.id)!;return <div className="cartLine" key={line.id}><span>{p.name} × {line.qty}</span><b>{money(p.price*line.qty)}</b></div>})}<div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid #ddd",marginTop:8,paddingTop:10}}><b>Total</b><b>{money(cartTotal)}</b></div></div><div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:16}}><button className="secondary" onClick={()=>setShowNewOrder(false)}>Annuler</button><button className="primary" disabled={!cart.length} onClick={createOrder}>Créer la commande</button></div></div></div>}
    </div>
  );
}
