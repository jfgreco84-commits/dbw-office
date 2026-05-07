"""
DBW CLOUD SALES BOARD
=====================
Deployed on Render.com (free). Code lives on GitHub.
Reps enter numbers from phones. Board live everywhere.

  /        Board display (TV / any browser)
  /rep      Rep portal (phone — enter written orders)
  /admin    Froggy admin (edit anything, enter Colin data)
  /api/data Raw JSON

Render env vars needed:
  GITHUB_TOKEN   — personal access token (repo write access)
  ADMIN_PASSWORD — admin panel password (default: dbw2026)
  SECRET_KEY     — any random string
"""

import os, json, base64, time, requests
from datetime import date, timedelta
from flask import Flask, jsonify, request, render_template_string, session, redirect

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dbw-froggy-2026-secret')

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'dbw2026')
GITHUB_TOKEN   = os.environ.get('GITHUB_TOKEN', '')
GITHUB_REPO    = 'jfgreco84-commits/dbw-office'
DATA_FILE      = 'live-numbers.json'

# ── Roster & Constants ─────────────────────────────────────────────────────
REPS = [
    'RONNY B','ADAM MISUREK','ADAM WEST','SCOT TOPORSH','FROGGY',
    'TJ SUTTON','JOHN BAEMMERT','CHRIS K','LUIS MILLAN','CASSIE',
    'KERRY SMITH','NICO T','GEOFF NURSE','JAMEL LEE','LESLIE KUBENY'
]
YTD_BASE = {
    'RONNY B':281030.30,'ADAM MISUREK':257311.08,'ADAM WEST':249320.62,
    'SCOT TOPORSH':246859.41,'FROGGY':227621.06,'TJ SUTTON':79605.56,
    'JOHN BAEMMERT':67578.79,'CHRIS K':66196.99,'LUIS MILLAN':31264.54,
    'CASSIE':30132.44,'KERRY SMITH':21267.04,'NICO T':17683.87,
    'GEOFF NURSE':13125.70,'JAMEL LEE':9183.63,'LESLIE KUBENY':8170.06,
}
GOALS = {
    'RONNY B':180000,'ADAM MISUREK':180000,'ADAM WEST':110000,
    'SCOT TOPORSH':110000,'FROGGY':110000,'TJ SUTTON':60000,
    'JOHN BAEMMERT':60000,'CHRIS K':25000,'LUIS MILLAN':20000,
    'CASSIE':20000,'KERRY SMITH':20000,'NICO T':20000,
    'GEOFF NURSE':20000,'JAMEL LEE':20000,'LESLIE KUBENY':15000,
}
FISCAL = [
    {'m':'MAY',  's':date(2026,5,4),  'e':date(2026,6,5),  'd':24,'h':{date(2026,5,25)}},
    {'m':'JUNE', 's':date(2026,6,8),  'e':date(2026,7,3),  'd':19,'h':set()},
    {'m':'JULY', 's':date(2026,7,6),  'e':date(2026,7,31), 'd':20,'h':set()},
    {'m':'AUG',  's':date(2026,8,3),  'e':date(2026,9,4),  'd':25,'h':{date(2026,9,7)}},
    {'m':'SEPT', 's':date(2026,9,7),  'e':date(2026,10,2), 'd':19,'h':set()},
    {'m':'OCT',  's':date(2026,10,5), 'e':date(2026,11,6), 'd':25,'h':set()},
    {'m':'NOV',  's':date(2026,11,9), 'e':date(2026,12,4), 'd':18,'h':{date(2026,11,26)}},
    {'m':'DEC',  's':date(2026,12,7), 'e':date(2026,12,31),'d':18,'h':{date(2026,12,25)}},
]
DAYS = ['mon','tues','wed','thurs','fri']

Q2_LOWER_BASE   = 922260.91
Q2_STRETCH_BASE = 1135700.91
Q2_LOWER_GOAL   = 1245067
Q2_STRETCH_GOAL = 1458507

# ── In-memory store ────────────────────────────────────────────────────────
_data = {}
_last_save = 0
_github_sha = ''

def default_data():
    return {
        'week':     {r: {d: None for d in DAYS} for r in REPS},
        'mtd_prior':{r: 0 for r in REPS},
        'shipped':  {r: {'sell':0,'cogs':0} for r in REPS},
        'day_nums': [1,2,3,4,5],
        'updated':  str(date.today()),
    }

def load():
    global _data, _github_sha
    try:
        if GITHUB_TOKEN:
            url = f'https://api.github.com/repos/{GITHUB_REPO}/contents/{DATA_FILE}'
            r = requests.get(url, headers={'Authorization':f'token {GITHUB_TOKEN}','Accept':'application/vnd.github.v3+json'}, timeout=8)
            if r.status_code == 200:
                j = r.json()
                _github_sha = j.get('sha','')
                _data = json.loads(base64.b64decode(j['content']).decode())
                return
    except Exception as e:
        print(f'Load warning: {e}')
    _data = default_data()

def save():
    global _last_save, _github_sha
    if time.time() - _last_save < 5:
        return
    _last_save = time.time()
    _data['updated'] = str(date.today())
    try:
        if GITHUB_TOKEN:
            url = f'https://api.github.com/repos/{GITHUB_REPO}/contents/{DATA_FILE}'
            content = base64.b64encode(json.dumps(_data, indent=2, default=str).encode()).decode()
            payload = {'message':'Board update','content':content}
            if _github_sha:
                payload['sha'] = _github_sha
            r = requests.put(url, json=payload, headers={'Authorization':f'token {GITHUB_TOKEN}','Accept':'application/vnd.github.v3+json'}, timeout=10)
            if r.status_code in (200,201):
                _github_sha = r.json().get('content',{}).get('sha','')
    except Exception as e:
        print(f'Save warning: {e}')

# ── Date helpers ───────────────────────────────────────────────────────────
def ago_date(months, extra_days=0):
    t = date.today()
    y, m = t.year - months//12, t.month - months%12
    if m <= 0: m += 12; y -= 1
    try:    d = date(y,m,t.day) - timedelta(days=extra_days)
    except: d = date(y,m,1)    - timedelta(days=extra_days)
    return d.strftime('%m/%d/%y')

def get_period():
    t = date.today()
    for p in FISCAL:
        if p['s'] <= t <= p['e']: return p
    return None

def bdays_remaining():
    t = date.today(); p = get_period()
    if not p: return 0
    c=0; d=t
    while d <= p['e']:
        if d.weekday()<5 and d not in p['h']: c+=1
        d += timedelta(1)
    return c

def bdays_elapsed():
    t = date.today(); p = get_period()
    if not p: return 1
    c=0; d=p['s']
    while d < t:
        if d.weekday()<5 and d not in p['h']: c+=1
        d += timedelta(1)
    return max(c,1)

# ── Stats ──────────────────────────────────────────────────────────────────
def calc():
    el = bdays_elapsed(); rem = bdays_remaining(); tot = el + rem
    total_shipped = sum(_data['shipped'].get(r,{}).get('sell',0) for r in REPS)
    stats = []
    for r in REPS:
        week = _data['week'].get(r, {})
        wk   = sum(week.get(d) or 0 for d in DAYS)
        mtdp = _data['mtd_prior'].get(r,0)
        mtdw = wk + mtdp
        sh   = _data['shipped'].get(r,{})
        sell = sh.get('sell',0); cogs = sh.get('cogs',0)
        mu   = round(sell/cogs,3) if cogs>0 else 0
        ytd  = YTD_BASE.get(r,0) + sell
        goal = GOALS.get(r,0)
        pct  = round(mtdw/goal*100,1) if goal>0 else 0
        togo = max(goal-mtdw,0)
        davg = mtdw/el if el>0 else 0
        proj = round(davg*tot) if davg>0 else 0
        dgoal= round(goal/tot) if tot>0 else 0
        wgoal= dgoal*5
        ship_per_rem = round(sell/rem) if rem>0 else 0
        stats.append({
            'name':r,'mon':week.get('mon'),'tues':week.get('tues'),
            'wed':week.get('wed'),'thurs':week.get('thurs'),'fri':week.get('fri'),
            'week':wk,'mtd_written':mtdw,'sell':sell,'cogs':cogs,
            'mu':mu,'mu_diff':round(mu-1.7,3) if mu>0 else None,
            'ytd':ytd,'goal':goal,'pct':pct,'togo':togo,
            'proj':proj,'dgoal':dgoal,'wgoal':wgoal,'ship_per_rem':ship_per_rem,
        })
    p = get_period()
    return {
        'stats':stats,'day_nums':_data.get('day_nums',[1,2,3,4,5]),
        'rem':rem,'elapsed':el,'total_days':tot,
        'today':date.today().strftime('%m/%d/%y'),
        'mo18':ago_date(18,5),'mo36':ago_date(36),
        'q2_lower':round(Q2_LOWER_BASE-total_shipped),
        'q2_stretch':round(Q2_STRETCH_BASE-total_shipped),
        'q2_lower_goal':Q2_LOWER_GOAL,'q2_stretch_goal':Q2_STRETCH_GOAL,
        'month':p['m'] if p else '','updated':_data.get('updated',''),
    }

# ── Startup load (works with gunicorn AND direct run) ─────────────────────
load()

# ── Routes ─────────────────────────────────────────────────────────────────
@app.route('/')
def board(): return render_template_string(BOARD_HTML)

@app.route('/rep')
def rep(): return render_template_string(REP_HTML)

@app.route('/admin', methods=['GET','POST'])
def admin():
    if request.method=='POST':
        if request.form.get('pw') == ADMIN_PASSWORD:
            session['admin']=True
    if not session.get('admin'):
        return render_template_string(LOGIN_HTML)
    return render_template_string(ADMIN_HTML)

@app.route('/admin/logout')
def logout(): session.clear(); return redirect('/admin')

@app.route('/api/data')
def api_data(): return jsonify(calc())

@app.route('/api/submit', methods=['POST'])
def submit():
    d=request.json; rep=d.get('rep','').upper()
    day=d.get('day','').lower(); val=d.get('amount')
    if rep not in REPS or day not in DAYS:
        return jsonify({'ok':False,'msg':'Invalid rep or day'})
    try: val=float(val)
    except: return jsonify({'ok':False,'msg':'Invalid amount'})
    if val<0: return jsonify({'ok':False,'msg':'Amount cannot be negative'})
    _data.setdefault('week',{}).setdefault(rep,{})[day]=val
    save()
    return jsonify({'ok':True,'msg':f'{rep} {day.upper()} → ${val:,.0f}'})

@app.route('/api/admin/edit', methods=['POST'])
def admin_edit():
    if not session.get('admin'): return jsonify({'ok':False})
    d=request.json; rep=d.get('rep','').upper()
    day=d.get('day','').lower(); val=d.get('amount')
    try: val=float(val) if val is not None else None
    except: return jsonify({'ok':False,'msg':'Bad value'})
    if rep not in REPS: return jsonify({'ok':False,'msg':'Bad rep'})
    if day=='mtd_prior':
        _data.setdefault('mtd_prior',{})[rep]=val or 0
    elif day in DAYS:
        _data.setdefault('week',{}).setdefault(rep,{})[day]=val
    else:
        return jsonify({'ok':False,'msg':'Bad day'})
    save(); return jsonify({'ok':True})

@app.route('/api/admin/shipped', methods=['POST'])
def admin_shipped():
    if not session.get('admin'): return jsonify({'ok':False})
    d=request.json; rep=d.get('rep','').upper()
    try:
        sell=float(d.get('sell',0)); cogs=float(d.get('cogs',0))
    except: return jsonify({'ok':False,'msg':'Bad values'})
    if rep=='ALL':
        for r in REPS: _data.setdefault('shipped',{})[r]={'sell':0,'cogs':0}
    elif rep in REPS:
        _data.setdefault('shipped',{})[rep]={'sell':sell,'cogs':cogs}
    else: return jsonify({'ok':False,'msg':'Bad rep'})
    save(); return jsonify({'ok':True})

@app.route('/api/admin/reset-week', methods=['POST'])
def reset_week():
    if not session.get('admin'): return jsonify({'ok':False})
    for r in REPS:
        wk=sum(_data['week'].get(r,{}).get(d) or 0 for d in DAYS)
        _data.setdefault('mtd_prior',{})[r]=_data['mtd_prior'].get(r,0)+wk
        _data['week'][r]={d:None for d in DAYS}
    nums=_data.get('day_nums',[1,2,3,4,5])
    start=nums[-1]+1 if nums else 6
    _data['day_nums']=[start+i for i in range(5)]
    save(); return jsonify({'ok':True,'msg':'Week reset. MTD carried forward.'})

@app.route('/api/admin/reset-month', methods=['POST'])
def reset_month():
    if not session.get('admin'): return jsonify({'ok':False})
    _data['week']    = {r:{d:None for d in DAYS} for r in REPS}
    _data['mtd_prior']= {r:0 for r in REPS}
    _data['shipped']  = {r:{'sell':0,'cogs':0} for r in REPS}
    _data['day_nums'] = [1,2,3,4,5]
    save(); return jsonify({'ok':True,'msg':'Full month reset complete.'})

@app.route('/api/admin/set-days', methods=['POST'])
def set_days():
    if not session.get('admin'): return jsonify({'ok':False})
    _data['day_nums']=request.json.get('nums',[1,2,3,4,5])
    save(); return jsonify({'ok':True})

# ── HTML — Board ───────────────────────────────────────────────────────────
BOARD_HTML = r"""<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"><title>DBW SALES BOARD</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0d0d1a;font-family:'Arial Black',Arial,sans-serif;overflow:hidden;height:100vh;display:flex;flex-direction:column}
.hbar{display:grid;grid-template-columns:1fr 1fr 1fr;background:linear-gradient(135deg,#FFD700,#FFA500);padding:5px 14px;gap:10px;flex-shrink:0}
.hcell{display:flex;align-items:center;gap:8px;font-size:18px;font-weight:900}
.hlbl{color:#000;letter-spacing:1px}
.hval{background:#003399;color:#fff;padding:3px 12px;border-radius:4px;font-size:20px;min-width:80px;text-align:center}
.cbar{display:grid;grid-template-columns:1fr auto 1fr;background:#001833;padding:6px 16px;gap:16px;align-items:center;flex-shrink:0;border-bottom:2px solid #FFD700}
.daysbox{text-align:center;padding:0 24px}
.daysnum{font-size:64px;font-weight:900;color:#FF3333;line-height:1;text-shadow:0 0 20px rgba(255,50,50,.5)}
.dayslbl{font-size:14px;color:#FFD700;font-weight:900;letter-spacing:3px}
.q2blk{text-align:center}
.q2val{font-size:32px;font-weight:900;color:#00FF88;line-height:1.1}
.q2lbl{font-size:12px;color:#aaa;margin-top:2px;letter-spacing:1px}
.q2goal{font-size:13px;color:#FFD700;font-weight:700}
.wrap{flex:1;padding:3px 6px;overflow:hidden}
table{width:100%;border-collapse:collapse;table-layout:fixed;height:100%}
thead th{background:#002255;color:#FFD700;font-size:13px;padding:5px 2px;text-align:center;font-weight:900;letter-spacing:.5px;border:1px solid #1a3a6a}
tbody tr{border-bottom:1px solid #1a2a44}
tbody tr:nth-child(even){background:rgba(255,255,255,.025)}
td{padding:4px 3px;text-align:right;font-size:21px;font-weight:700}
.nc{text-align:center;color:#55AAFF;font-size:16px;font-weight:900}
.yc{color:#FFD700;font-size:18px}
.gc{color:#00DD55}.rc{color:#FF3333}
.dim{color:#444;font-size:17px}
.orange{color:#FF9900;font-size:17px;font-weight:900}
.mu-g{color:#00DD55;font-size:14px}.mu-r{color:#FF3333;font-size:14px}
.pbar-wrap{height:8px;background:#222;border-radius:4px;overflow:hidden;margin-top:2px}
.pbar{height:100%;border-radius:4px;transition:width .5s}
tfoot td{background:#001833;color:#FFD700;font-size:19px;font-weight:900;text-align:right;padding:4px 3px;border-top:2px solid #FFD700}
.foot{text-align:right;padding:2px 8px;color:#333;font-size:10px;background:#000;flex-shrink:0}
</style></head><body>
<div class="hbar">
  <div class="hcell"><span class="hlbl">TODAY</span><span class="hval" id="h-today">--</span></div>
  <div class="hcell" style="justify-content:center"><span class="hlbl">18 MO+5D AGO</span><span class="hval" id="h-18mo">--</span></div>
  <div class="hcell" style="justify-content:flex-end"><span class="hlbl">36 MO AGO</span><span class="hval" id="h-36mo">--</span></div>
</div>
<div class="cbar">
  <div class="q2blk">
    <div class="q2val" id="q2lo">--</div>
    <div class="q2lbl">Q2 TO GO — GOAL <span class="q2goal" id="q2lo-g"></span></div>
  </div>
  <div class="daysbox">
    <div class="daysnum" id="days-rem">--</div>
    <div class="dayslbl">DAYS LEFT</div>
  </div>
  <div class="q2blk">
    <div class="q2val" id="q2str">--</div>
    <div class="q2lbl">STRETCH TO GO — GOAL <span class="q2goal" id="q2str-g"></span></div>
  </div>
</div>
<div class="wrap"><table>
<thead><tr>
  <th style="width:8%">YTD</th>
  <th style="width:10%">REP</th>
  <th style="width:5.5%" id="dh0">MON</th>
  <th style="width:5.5%" id="dh1">TUES</th>
  <th style="width:5.5%" id="dh2">WED</th>
  <th style="width:5.5%" id="dh3">THURS</th>
  <th style="width:5.5%" id="dh4">FRI</th>
  <th style="width:6%">WK</th>
  <th style="width:7%">MTD WR</th>
  <th style="width:7%">SHIPPED</th>
  <th style="width:6.5%">PROJ</th>
  <th style="width:5.5%">D-GOAL</th>
  <th style="width:6%">GOAL</th>
  <th style="width:6%">M/U</th>
  <th style="width:10%" colspan="2">% OF GOAL / TO GO</th>
</tr></thead>
<tbody id="tbody"></tbody>
<tfoot><tr id="tfoot"><td colspan="16">Loading...</td></tr></tfoot>
</table></div>
<div class="foot" id="foot">Loading...</div>
<script>
const $ = id => document.getElementById(id);
function fmt(v,big){
  if(v===null||v===undefined)return '<span class="dim">—</span>';
  const n=Math.round(v);
  const cls=n>=1000?'gc':'rc';
  return `<span class="${cls}">$${n.toLocaleString()}</span>`;
}
function fmtK(v){if(!v&&v!==0)return '--';return '$'+Math.round(v).toLocaleString();}

async function refresh(){
  try{
    const r=await fetch('/api/data'); const d=await r.json();
    $('h-today').textContent=d.today||'--';
    $('h-18mo').textContent=d.mo18||'--';
    $('h-36mo').textContent=d.mo36||'--';
    $('days-rem').textContent=d.rem??'--';
    $('q2lo').textContent=fmtK(d.q2_lower);
    $('q2str').textContent=fmtK(d.q2_stretch);
    $('q2lo-g').textContent=d.q2_lower_goal?'$'+d.q2_lower_goal.toLocaleString():'';
    $('q2str-g').textContent=d.q2_stretch_goal?'$'+d.q2_stretch_goal.toLocaleString():'';
    const dn=d.day_nums||[1,2,3,4,5];
    ['mon','tues','wed','thurs','fri'].forEach((lbl,i)=>{
      $('dh'+i).textContent=dn[i]?'#'+dn[i]:lbl.toUpperCase();
    });
    const tb=$('tbody'); tb.innerHTML='';
    let tYtd=0,tMon=0,tTue=0,tWed=0,tThu=0,tFri=0,tWk=0,tMtd=0,tShip=0,tGoal=0;
    d.stats.forEach(s=>{
      tYtd+=s.ytd||0;tMon+=s.mon||0;tTue+=s.tues||0;tWed+=s.wed||0;
      tThu+=s.thurs||0;tFri+=s.fri||0;tWk+=s.week||0;
      tMtd+=s.mtd_written||0;tShip+=s.sell||0;tGoal+=s.goal||0;
      const pct=Math.min(s.pct||0,100);
      const barClr=pct>=100?'#00DD55':pct>=70?'#FFD700':'#FF3333';
      const muHtml=s.mu>0?`<span class="${s.mu_diff>=0?'mu-g':'mu-r'}">${s.mu.toFixed(2)}<br>${s.mu_diff>=0?'+':''}${s.mu_diff?.toFixed(2)||''}</span>`:'<span class="dim">—</span>';
      const tr=document.createElement('tr');
      tr.innerHTML=
        `<td class="yc">$${Math.round(s.ytd).toLocaleString()}</td>`+
        `<td class="nc">${s.name}</td>`+
        `<td>${fmt(s.mon)}</td><td>${fmt(s.tues)}</td><td>${fmt(s.wed)}</td>`+
        `<td>${fmt(s.thurs)}</td><td>${fmt(s.fri)}</td>`+
        `<td>${fmt(s.week)}</td><td>${fmt(s.mtd_written)}</td>`+
        `<td>${fmt(s.sell)}</td>`+
        `<td class="orange">$${(s.proj||0).toLocaleString()}</td>`+
        `<td class="dim">$${(s.dgoal||0).toLocaleString()}</td>`+
        `<td class="orange">$${(s.goal||0).toLocaleString()}</td>`+
        `<td>${muHtml}</td>`+
        `<td style="width:5%"><span style="color:${barClr};font-size:15px">${pct.toFixed(0)}%</span><div class="pbar-wrap"><div class="pbar" style="width:${pct}%;background:${barClr}"></div></div></td>`+
        `<td style="width:5%;font-size:15px" class="rc">$${(s.togo||0).toLocaleString()}</td>`;
      tb.appendChild(tr);
    });
    $('tfoot').innerHTML=
      `<td>$${Math.round(tYtd).toLocaleString()}</td><td></td>`+
      `<td>$${Math.round(tMon).toLocaleString()}</td><td>$${Math.round(tTue).toLocaleString()}</td>`+
      `<td>$${Math.round(tWed).toLocaleString()}</td><td>$${Math.round(tThu).toLocaleString()}</td>`+
      `<td>$${Math.round(tFri).toLocaleString()}</td><td>$${Math.round(tWk).toLocaleString()}</td>`+
      `<td>$${Math.round(tMtd).toLocaleString()}</td><td>$${Math.round(tShip).toLocaleString()}</td>`+
      `<td colspan="3" class="orange">Goal: $${Math.round(tGoal).toLocaleString()}</td><td colspan="3"></td>`;
    $('foot').textContent='Updated: '+d.updated+' | '+d.month+' | Elapsed: '+d.elapsed+' days | Remaining: '+d.rem+' days';
  }catch(e){$('foot').textContent='Error: '+e.message;}
}
refresh(); setInterval(refresh,30000);
</script></body></html>"""

# ── HTML — Rep Portal ──────────────────────────────────────────────────────
REP_HTML = r"""<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DBW — Enter My Numbers</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a1a;color:#fff;font-family:Arial,sans-serif;padding:16px;min-height:100vh}
h1{color:#FFD700;text-align:center;font-size:22px;margin-bottom:4px}
.sub{color:#aaa;text-align:center;font-size:13px;margin-bottom:16px}
label{display:block;color:#aaa;font-size:13px;margin-bottom:5px;margin-top:12px}
select,input[type=number]{width:100%;padding:12px;background:#1a1a2e;color:#fff;border:1px solid #333;border-radius:8px;font-size:18px}
.day-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:12px}
.day-btn{padding:14px 0;background:#1a1a2e;border:2px solid #333;border-radius:8px;color:#aaa;font-size:13px;font-weight:700;cursor:pointer;text-align:center;transition:.2s}
.day-btn.selected{border-color:#FFD700;color:#FFD700;background:#111100}
.amount-row{display:flex;gap:8px;margin-top:12px;align-items:flex-end}
.amount-row input{flex:1}
.submit-btn{width:100%;padding:16px;background:#003d80;color:#FFD700;border:none;border-radius:10px;font-size:20px;font-weight:900;cursor:pointer;margin-top:16px;letter-spacing:1px}
.submit-btn:active{background:#002255}
.msg{background:#111;border-radius:8px;padding:14px;margin-top:12px;min-height:50px;font-size:16px;text-align:center}
.ok{color:#00FF88}.err{color:#FF4444}
.my-week{background:#0d0d22;border-radius:10px;padding:12px;margin-top:16px}
.my-week h3{color:#FFD700;font-size:15px;margin-bottom:10px}
.week-row{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
.wday{text-align:center;background:#1a1a2e;border-radius:6px;padding:8px 2px}
.wday-lbl{font-size:11px;color:#aaa}
.wday-val{font-size:16px;font-weight:700;margin-top:2px}
.board-link{display:block;text-align:center;color:#4499FF;margin-top:16px;font-size:14px;text-decoration:none}
</style></head><body>
<h1>💰 ENTER MY NUMBERS</h1>
<div class="sub">Diamond Blade Warehouse — WI Office</div>

<label>YOUR NAME</label>
<select id="rep-sel"><option value="">-- Select Your Name --</option></select>

<label>DAY OF WEEK</label>
<div class="day-grid">
  <div class="day-btn" data-day="mon" onclick="selDay(this)">MON</div>
  <div class="day-btn" data-day="tues" onclick="selDay(this)">TUES</div>
  <div class="day-btn" data-day="wed" onclick="selDay(this)">WED</div>
  <div class="day-btn" data-day="thurs" onclick="selDay(this)">THURS</div>
  <div class="day-btn" data-day="fri" onclick="selDay(this)">FRI</div>
</div>

<label>WRITTEN ORDER AMOUNT ($)</label>
<input type="number" id="amount" placeholder="e.g. 4500" min="0" step="100">

<button class="submit-btn" onclick="submit()">✅ SUBMIT</button>

<div class="msg" id="msg">Select your name, pick the day, enter your amount.</div>

<div class="my-week">
  <h3>MY WEEK SO FAR</h3>
  <div class="week-row" id="my-week">
    <div class="wday"><div class="wday-lbl">MON</div><div class="wday-val dim">—</div></div>
    <div class="wday"><div class="wday-lbl">TUES</div><div class="wday-val dim">—</div></div>
    <div class="wday"><div class="wday-lbl">WED</div><div class="wday-val dim">—</div></div>
    <div class="wday"><div class="wday-lbl">THURS</div><div class="wday-val dim">—</div></div>
    <div class="wday"><div class="wday-lbl">FRI</div><div class="wday-val dim">—</div></div>
  </div>
</div>

<a class="board-link" href="/">📊 View Full Board</a>

<script>
const REPS=['RONNY B','ADAM MISUREK','ADAM WEST','SCOT TOPORSH','FROGGY',
'TJ SUTTON','JOHN BAEMMERT','CHRIS K','LUIS MILLAN','CASSIE',
'KERRY SMITH','NICO T','GEOFF NURSE','JAMEL LEE','LESLIE KUBENY'];
const sel=document.getElementById('rep-sel');
REPS.forEach(r=>{const o=document.createElement('option');o.value=r;o.textContent=r;sel.appendChild(o);});

// Auto-select today's day
const dayMap=[null,'mon','tues','wed','thurs','fri',null];
const todayDay=dayMap[new Date().getDay()];
if(todayDay){
  document.querySelectorAll('.day-btn').forEach(b=>{
    if(b.dataset.day===todayDay)b.click();
  });
}

// Restore last rep
const savedRep=localStorage.getItem('myRep');
if(savedRep)sel.value=savedRep;
sel.addEventListener('change',()=>{localStorage.setItem('myRep',sel.value);loadMyWeek();});

let selDayVal=todayDay||'mon';
function selDay(el){
  document.querySelectorAll('.day-btn').forEach(b=>b.classList.remove('selected'));
  el.classList.add('selected');
  selDayVal=el.dataset.day;
}

async function submit(){
  const rep=sel.value; const amt=parseFloat(document.getElementById('amount').value);
  const msg=document.getElementById('msg');
  if(!rep){msg.innerHTML='<span class="err">Select your name first.</span>';return;}
  if(isNaN(amt)||amt<0){msg.innerHTML='<span class="err">Enter a valid amount.</span>';return;}
  msg.innerHTML='Submitting...';
  try{
    const r=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({rep,day:selDayVal,amount:amt})});
    const d=await r.json();
    msg.innerHTML=d.ok?`<span class="ok">✅ ${d.msg}</span>`:`<span class="err">❌ ${d.msg}</span>`;
    if(d.ok){document.getElementById('amount').value='';loadMyWeek();}
  }catch(e){msg.innerHTML=`<span class="err">Error: ${e.message}</span>`;}
}

async function loadMyWeek(){
  const rep=sel.value; if(!rep)return;
  try{
    const r=await fetch('/api/data'); const d=await r.json();
    const s=d.stats.find(x=>x.name===rep);
    if(!s)return;
    const days=['mon','tues','wed','thurs','fri'];
    const lbls=['MON','TUES','WED','THURS','FRI'];
    document.getElementById('my-week').innerHTML=days.map((day,i)=>{
      const v=s[day]; const disp=v!=null?'$'+Math.round(v).toLocaleString():'—';
      const cls=v==null?'dim':v>=1000?'gc':'rc';
      return `<div class="wday"><div class="wday-lbl">${lbls[i]}</div><div class="wday-val ${cls}">${disp}</div></div>`;
    }).join('');
  }catch(e){}
}
loadMyWeek();
setInterval(loadMyWeek,30000);

// Number input — allow k shorthand (type 4.5k = 4500)
document.getElementById('amount').addEventListener('blur',function(){
  const v=this.value.trim().toLowerCase();
  if(v.endsWith('k')){const n=parseFloat(v);if(!isNaN(n))this.value=Math.round(n*1000);}
});
</script>
<style>.gc{color:#00DD55}.rc{color:#FF3333}.dim{color:#555}</style>
</body></html>"""

# ── HTML — Admin ───────────────────────────────────────────────────────────
LOGIN_HTML = """<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DBW Admin Login</title>
<style>body{background:#0a0a1a;color:#fff;font-family:Arial;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.box{background:#111;border-radius:12px;padding:30px;width:100%;max-width:340px}
h2{color:#FFD700;margin-bottom:20px;text-align:center}
input{width:100%;padding:12px;background:#222;color:#fff;border:1px solid #333;border-radius:8px;font-size:16px;margin-bottom:12px}
button{width:100%;padding:14px;background:#003d80;color:#FFD700;border:none;border-radius:8px;font-size:18px;font-weight:900;cursor:pointer}</style>
</head><body><div class="box"><h2>🔒 ADMIN LOGIN</h2>
<form method="POST"><input type="password" name="pw" placeholder="Password" autofocus>
<button type="submit">ENTER</button></form></div></body></html>"""

ADMIN_HTML = r"""<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DBW Admin</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a1a;color:#fff;font-family:Arial;padding:16px}
h1{color:#FFD700;font-size:20px;margin-bottom:4px}
.sub{color:#aaa;font-size:12px;margin-bottom:16px}
.section{background:#111;border-radius:10px;padding:14px;margin-bottom:14px}
.section h3{color:#FFD700;font-size:15px;margin-bottom:12px;border-bottom:1px solid #333;padding-bottom:6px}
label{display:block;color:#aaa;font-size:12px;margin-bottom:4px;margin-top:10px}
select,input{width:100%;padding:10px;background:#1a1a2e;color:#fff;border:1px solid #333;border-radius:6px;font-size:15px;margin-bottom:6px}
.btn{width:100%;padding:13px;border:none;border-radius:8px;font-size:16px;font-weight:900;cursor:pointer;margin-top:4px}
.btn-blue{background:#003d80;color:#FFD700}
.btn-green{background:#004d20;color:#00FF88}
.btn-red{background:#4d0000;color:#FF4444}
.btn-orange{background:#4d2800;color:#FF9900}
.msg{background:#0d0d22;border-radius:8px;padding:12px;margin-top:10px;font-size:14px;min-height:40px;text-align:center}
.ok{color:#00FF88}.err{color:#FF4444}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:8px}
a.logout{display:block;text-align:center;color:#666;font-size:12px;margin-top:16px;text-decoration:none}
.warn{color:#FF9900;font-size:12px;text-align:center;margin-top:6px}
</style></head><body>
<h1>⚙️ DBW ADMIN PANEL</h1>
<div class="sub">Froggy only — all changes save immediately</div>

<!-- Edit rep number -->
<div class="section">
  <h3>✏️ Edit Written Number</h3>
  <label>Rep</label>
  <select id="e-rep"></select>
  <label>Day</label>
  <select id="e-day">
    <option value="mon">Monday</option><option value="tues">Tuesday</option>
    <option value="wed">Wednesday</option><option value="thurs">Thursday</option>
    <option value="fri">Friday</option><option value="mtd_prior">MTD Prior (previous weeks)</option>
  </select>
  <label>Amount ($)</label>
  <input type="number" id="e-amt" placeholder="0">
  <button class="btn btn-blue" onclick="editRep()">SAVE EDIT</button>
  <div class="msg" id="e-msg"></div>
</div>

<!-- Colin shipped data -->
<div class="section">
  <h3>📦 Update Shipped (from Colin)</h3>
  <label>Rep</label>
  <select id="s-rep"></select>
  <div class="two-col">
    <div><label>Sell ($)</label><input type="number" id="s-sell" placeholder="0"></div>
    <div><label>COGS ($)</label><input type="number" id="s-cogs" placeholder="0"></div>
  </div>
  <button class="btn btn-green" onclick="updateShipped()">UPDATE SHIPPED</button>
  <div class="msg" id="s-msg"></div>
</div>

<!-- Day numbers -->
<div class="section">
  <h3>📅 Set Day Numbers (Mon-Fri this week)</h3>
  <div class="two-col">
    <div><label>Mon #</label><input type="number" id="d0" placeholder="1"></div>
    <div><label>Tue #</label><input type="number" id="d1" placeholder="2"></div>
  </div>
  <div class="two-col">
    <div><label>Wed #</label><input type="number" id="d2" placeholder="3"></div>
    <div><label>Thu #</label><input type="number" id="d3" placeholder="4"></div>
  </div>
  <label>Fri #</label><input type="number" id="d4" placeholder="5">
  <button class="btn btn-blue" onclick="setDays()">SET DAY NUMBERS</button>
  <div class="msg" id="d-msg"></div>
</div>

<!-- Week / Month reset -->
<div class="section">
  <h3>🔄 Reset Controls</h3>
  <button class="btn btn-orange" onclick="resetWeek()">RESET WEEK (Monday morning)</button>
  <div class="warn">Carries current week written to MTD prior. Clears Mon-Fri for new week.</div>
  <br>
  <button class="btn btn-red" onclick="resetMonth()">RESET MONTH (new fiscal month)</button>
  <div class="warn">Clears ALL data including shipped and MTD. Use at start of new month.</div>
  <div class="msg" id="r-msg"></div>
</div>

<a class="logout" href="/admin/logout">Log out</a>

<script>
const REPS=['RONNY B','ADAM MISUREK','ADAM WEST','SCOT TOPORSH','FROGGY',
'TJ SUTTON','JOHN BAEMMERT','CHRIS K','LUIS MILLAN','CASSIE',
'KERRY SMITH','NICO T','GEOFF NURSE','JAMEL LEE','LESLIE KUBENY'];

function populateSels(){
  ['e-rep','s-rep'].forEach(id=>{
    const s=document.getElementById(id);
    s.innerHTML='';
    REPS.forEach(r=>{const o=document.createElement('option');o.value=r;o.textContent=r;s.appendChild(o);});
  });
}
populateSels();

// Prefill day numbers from current data
fetch('/api/data').then(r=>r.json()).then(d=>{
  const dn=d.day_nums||[1,2,3,4,5];
  dn.forEach((v,i)=>{const el=document.getElementById('d'+i);if(el&&v)el.value=v;});
});

async function post(url,body,msgId){
  const el=document.getElementById(msgId);
  el.innerHTML='Saving...';
  try{
    const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const d=await r.json();
    el.innerHTML=d.ok?`<span class="ok">✅ ${d.msg||'Saved'}</span>`:`<span class="err">❌ ${d.msg||'Error'}</span>`;
  }catch(e){el.innerHTML=`<span class="err">Error: ${e.message}</span>`;}
}

function editRep(){
  post('/api/admin/edit',{rep:document.getElementById('e-rep').value,
    day:document.getElementById('e-day').value,
    amount:parseFloat(document.getElementById('e-amt').value)||0},'e-msg');
}
function updateShipped(){
  post('/api/admin/shipped',{rep:document.getElementById('s-rep').value,
    sell:parseFloat(document.getElementById('s-sell').value)||0,
    cogs:parseFloat(document.getElementById('s-cogs').value)||0},'s-msg');
}
function setDays(){
  const nums=[0,1,2,3,4].map(i=>parseInt(document.getElementById('d'+i).value)||0);
  post('/api/admin/set-days',{nums},'d-msg');
}
function resetWeek(){
  if(!confirm('Reset week? This carries written totals to MTD and clears Mon-Fri.'))return;
  post('/api/admin/reset-week',{},'r-msg');
}
function resetMonth(){
  if(!confirm('FULL MONTH RESET? This clears ALL data including shipped and MTD. Cannot be undone.'))return;
  post('/api/admin/reset-month',{},'r-msg');
}
</script>
</body></html>"""

if __name__=='__main__':
    print('DBW Cloud Board starting...')
    app.run(debug=False, host='0.0.0.0', port=int(os.environ.get('PORT',5000)))
