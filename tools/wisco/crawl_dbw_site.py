import re,html,json,sys,os,time,subprocess,hashlib
out=sys.argv[1]
B='https://www.diamondbladewarehouse.com'
def get(u):
    fn=os.path.join(out,'pages',hashlib.md5(u.encode()).hexdigest()+'.html')
    if os.path.exists(fn) and os.path.getsize(fn)>2000: return open(fn,encoding='utf8',errors='ignore').read()
    for a in range(4):
        r=subprocess.run(['curl','-sS','-L','-m','40','-A','Mozilla/5.0','-o',fn,'-w','%{http_code}',u],capture_output=True,text=True)
        if r.stdout.strip()=='200': return open(fn,encoding='utf8',errors='ignore').read()
        time.sleep(2*(a+1))
    return ''
sm=open(os.path.join(out,'sitemap.xml')).read()
cats=[u for u in re.findall(r'<loc>([^<]+)</loc>',sm) if '/catalog' in u]
seen=set();queue=list(cats);prods={}
while queue:
    u=queue.pop(0)
    if u in seen: continue
    seen.add(u)
    s=get(u)
    for h in re.findall(r'href="([^"]+)"',s):
        h=html.unescape(h)
        if h.startswith('/'): h=B+h
        if not h.startswith(B+'/catalog'): continue
        if '/product/' in h:
            prods.setdefault(h.split('?')[0].split('#')[0],set()).add(u)
        elif h not in seen and ('page=' in h or h.split('?')[0] not in seen):
            queue.append(h)
    time.sleep(0.15)
print('category pages',len(seen),'products',len(prods),file=sys.stderr)
def txt(x):
    x=re.sub(r'<[^>]+>',' ',x); return re.sub(r'\s+',' ',html.unescape(x)).strip()
res=[]
for u in sorted(prods):
    s=get(u); time.sleep(0.15)
    if not s: print('FAIL',u,file=sys.stderr); continue
    i=s.find('_shopaholic-product-wrapper'); j=s.find('</main>',i)
    b=s[i:j] if i>0 else s
    d={'url':u,'cats':sorted(prods[u])}
    m=re.search(r'<h2 class="primary-color">(.*?)</h2>',b,re.S); d['name']=txt(m.group(1)) if m else ''
    d['info']={}
    for m in re.finditer(r'<div class="product-info__title">(.*?)</div>\s*<strong[^>]*>(.*?)</strong>',b,re.S):
        d['info'][txt(m.group(1))]=txt(m.group(2))
    d['offers']=[]
    for m in re.finditer(r'<input type="radio"[^>]*name="offer_id"([^>]*)>\s*<strong class="lead">(.*?)</strong>',b,re.S):
        a=dict(re.findall(r'data-([a-z-]+)="([^"]*)"',m.group(1)))
        d['offers'].append({'sku':html.unescape(a.get('sku','')),'dia':a.get('diameter',''),'app':html.unescape(a.get('cutting-application','')),'size':txt(m.group(2))})
    d['imgs']=re.findall(r'<a href="([^"]+)" data-lightbox',b)
    k=b.find('<div class="fr-view">')
    if k>0:
        e=b.find('</form>',k); fr=b[k:]
        # cut at brochure / next section
        for stop in ['<div class="cell','<section','<form']:
            p=fr.find(stop,20)
            if p>0: fr=fr[:p]
        d['bullets']=[txt(x) for x in re.findall(r'<li[^>]*>(.*?)</li>',fr,re.S)]
        d['paras']=[t for t in (txt(x) for x in re.findall(r'<p[^>]*>(.*?)</p>',re.sub(r'<ul.*?</ul>','',fr,flags=re.S),re.S)) if t]
        d['fr_text']=txt(fr)[:4000]
    d['brochure']=[html.unescape(x) for x in re.findall(r'href="([^"]+)"[^>]*title="Download',b)]
    d['video']=re.findall(r'(?:youtube\.com/embed/|youtu\.be/|vimeo\.com/video/)([\w-]+)',b)
    res.append(d)
json.dump(res,open(os.path.join(out,'dbw_products.json'),'w'),indent=1)
print('done',len(res),sum(len(d['offers']) for d in res),file=sys.stderr)
