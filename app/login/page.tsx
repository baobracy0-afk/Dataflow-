"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail, Store } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("Connexion prête — connectez votre compte Restaurant.");
  };

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-brand">
          <div className="brand-mark"><Store size={28} /></div>
          <div className="eyebrow">NexaSoft Africa</div>
          <h1>Gérez votre restaurant<br /><span>simplement.</span></h1>
          <p>Commandes, tables, caisse, stock et statistiques réunis dans un seul espace.</p>
          <div className="mini-stats">
            <div><strong>+12,5%</strong><small>CA aujourd’hui</small></div>
            <div><strong>42</strong><small>commandes</small></div>
            <div><strong>12</strong><small>tables</small></div>
          </div>
        </section>

        <section className="login-card">
          <div className="logo-row"><div className="small-mark"><Store size={17}/></div><b>Restaurant</b></div>
          <h2>Bienvenue 👋</h2>
          <p className="muted">Connectez-vous à votre espace de gestion.</p>

          <form onSubmit={submit}>
            <label>Adresse e-mail</label>
            <div className="input-wrap"><Mail size={17}/><input type="email" placeholder="vous@restaurant.com" required /></div>

            <div className="password-head"><label>Mot de passe</label><button type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword ? "Masquer" : "Afficher"}</button></div>
            <div className="input-wrap"><LockKeyhole size={17}/><input type={showPassword ? "text" : "password"} placeholder="••••••••" required /></div>

            <div className="form-row"><label className="check"><input type="checkbox" /> Se souvenir de moi</label><button type="button" className="forgot">Mot de passe oublié ?</button></div>
            <button className="submit" type="submit">Se connecter <ArrowRight size={17}/></button>
          </form>

          {message && <div className="notice">{message}</div>}
          <div className="signup">Vous n’avez pas encore de compte ? <button type="button">Créer un compte</button></div>
          <Link className="back" href="/">← Retour à Restaurant</Link>
        </section>
      </div>

      <style>{`
        *{box-sizing:border-box}body{margin:0;background:#f6f7f8;color:#17191c;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .login-page{min-height:100vh;padding:24px;display:grid;place-items:center;background:radial-gradient(circle at 15% 10%,#fff6d7 0,transparent 32%),#f6f7f8}
        .login-shell{width:min(1080px,100%);min-height:650px;background:#111315;border-radius:28px;overflow:hidden;display:grid;grid-template-columns:1.08fr .92fr;box-shadow:0 25px 70px #11131520}
        .login-brand{padding:70px;color:white;display:flex;flex-direction:column;justify-content:center}
        .brand-mark,.small-mark{background:#f2c94c;color:#111;display:grid;place-items:center;border-radius:14px}
        .brand-mark{width:58px;height:58px;margin-bottom:35px}.eyebrow{text-transform:uppercase;letter-spacing:.14em;color:#9ea4ab;font-size:11px;font-weight:700}
        h1{font-size:48px;line-height:1.05;margin:14px 0 18px;letter-spacing:-1.8px}h1 span{color:#f2c94c}.login-brand p{color:#b5bac1;max-width:480px;line-height:1.7;margin:0;font-size:15px}
        .mini-stats{display:flex;gap:12px;margin-top:45px}.mini-stats div{border:1px solid #ffffff18;background:#ffffff08;border-radius:14px;padding:14px 18px;min-width:120px}.mini-stats strong{display:block;font-size:17px}.mini-stats small{display:block;color:#969ca4;margin-top:4px;font-size:10px}
        .login-card{background:white;padding:55px;display:flex;flex-direction:column;justify-content:center}.logo-row{display:flex;align-items:center;gap:9px;font-size:18px;margin-bottom:40px}.small-mark{width:34px;height:34px;border-radius:10px}
        h2{font-size:29px;margin:0 0 8px}.muted{color:#7b8087;font-size:13px;margin:0 0 28px}
        form{display:grid;gap:9px}label{font-size:12px;font-weight:700;margin-top:5px}.input-wrap{height:48px;border:1px solid #dfe2e6;border-radius:11px;display:flex;align-items:center;gap:10px;padding:0 13px;color:#8a9097}.input-wrap:focus-within{border-color:#17191c;box-shadow:0 0 0 3px #17191c0b}.input-wrap input{border:0;outline:0;width:100%;font:inherit;font-size:13px}
        .password-head{display:flex;justify-content:space-between;align-items:center}.password-head button,.forgot,.signup button{border:0;background:none;color:#555b63;cursor:pointer;font-size:11px}.form-row{display:flex;justify-content:space-between;align-items:center;margin:7px 0 12px}.check{display:flex;gap:7px;align-items:center;font-weight:500}.check input{accent-color:#17191c}.submit{height:48px;border:0;border-radius:11px;background:#15171a;color:#fff;font-weight:800;display:flex;justify-content:center;align-items:center;gap:8px;cursor:pointer}.submit:hover{background:#282b2f}
        .notice{margin-top:14px;padding:11px;border-radius:10px;background:#f2f8f3;color:#247443;font-size:12px}.signup{text-align:center;color:#7b8087;font-size:12px;margin-top:24px}.signup button{font-weight:800;color:#17191c}.back{text-align:center;color:#777d84;font-size:11px;text-decoration:none;margin-top:20px}
        @media(max-width:800px){.login-page{padding:12px}.login-shell{grid-template-columns:1fr;min-height:auto}.login-brand{padding:35px 28px}.login-brand h1{font-size:36px}.mini-stats{margin-top:28px}.login-card{padding:35px 28px}.mini-stats div{min-width:0;flex:1}}
        @media(max-width:430px){.login-brand p{font-size:13px}.mini-stats div{padding:11px 8px}.mini-stats small{font-size:9px}.login-card{padding:30px 20px}}
      `}</style>
    </main>
  );
}
