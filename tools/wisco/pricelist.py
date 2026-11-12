# parse price list -> list of rows {sku, desc, cost, p3, top, sheet, section}
import openpyxl,re
def norm(s): return re.sub(r'[^A-Z0-9.]','',str(s).upper())
def load(path):
    wb=openpyxl.load_workbook(path,data_only=True); rows=[]
    def num(x): return isinstance(x,(int,float)) and not isinstance(x,bool)
    def add(sheet,sec,sku,desc,cost,price,basis,extra=None):
        rows.append(dict(sheet=sheet,section=sec,sku=str(sku).strip(),desc=re.sub(r'\s+',' ',str(desc)).strip(),cost=cost,price=price,basis=basis,extra=extra or {}))
    for name in ['4" - 6"','7" - 10"','12"- 14"','16"-20"',' COREBITS','SAWS']:
        sec=''
        for r in wb[name].iter_rows(values_only=True):
            r=list(r)+[None]*6
            a,b,c,d=r[0],r[1],r[2],r[3]
            if a is None and isinstance(b,str) and b.strip(): sec=b.strip()
            if isinstance(a,str) and b is None and c is None: sec=a.strip(); continue
            if isinstance(a,str) and isinstance(b,str) and num(c) and c>0:
                if a.strip() in('VENDOR PART #',): continue
                add(name.strip(),sec,a,b,c,d if num(d) and d>0 else None,'3.0' if (num(d) and d>0) else None)
    sec=''
    for r in wb['WET BLADES'].iter_rows(values_only=True):
        r=list(r)+[None]*6
        if r[0] in('DESCRIPTION','PART #'): sec=str(r[1]).strip(); continue
        if isinstance(r[0],str) and isinstance(r[1],str) and num(r[2]) and r[2]>0:
            add('WET BLADES',sec,r[0],r[1],r[2],r[3] if num(r[3]) else None,'3.0' if sec.find('PRESTRESS')<0 else '2.1')
    for r in wb['GREEN KUT (2)'].iter_rows(values_only=True):
        r=list(r)+[None]*6
        if isinstance(r[0],str) and isinstance(r[1],str):
            if num(r[2]) and num(r[3]): add('GREEN KUT','GREEN KUT',r[0],r[1],r[3],r[2],'MSRP')
            elif r[2] is None and num(r[3]): add('GREEN KUT','SKID PLATES',r[0],r[1],r[3],None,None)
            elif num(r[2]) and r[3] is None: add('GREEN KUT','SOFF CUT SAWS',r[0],r[1],r[2],None,None)
            elif r[2]=='INQUIRE': add('GREEN KUT','SOFF CUT SAWS',r[0],r[1],None,None,None)
    for name in ['ICS GAS CHAIN','HUSQVARNA GAS CHAIN','STIHL GAS CHAIN','ICS HYDRAULIC CHAIN','RGC HYDRAULIC CHAIN','HUSQVARNA HIGH CYCLE CHAIN']:
        sec=''
        for r in wb[name].iter_rows(values_only=True):
            r=list(r)+[None]*6
            t=[x for x in r if isinstance(x,str) and x.strip()]
            if len(t)>=1 and not any(num(x) and x>0 for x in r) and r[0] not in('PART #','PART#'):
                sec=t[0].strip(); continue
            if isinstance(r[0],str) and isinstance(r[1],str) and num(r[3]) and r[3]>0:
                add(name,sec,r[0],r[1],r[3],r[4] if num(r[4]) else None,'top',{'saw':str(r[2] or '').strip()})
    sec=''
    for r in wb['CORE RIGS'].iter_rows(values_only=True):
        r=list(r)+[None]*6
        if isinstance(r[0],str) and r[0].startswith('DR SCHULZE'): sec=r[0].strip(); continue
        if isinstance(r[0],str) and num(r[7]) and r[7]>0:
            ex={k:str(v) for k,v in zip(['c2','c3','c4','c5','c6'],r[2:7]) if v is not None}
            add('CORE RIGS',sec,r[0] if r[1] else 'PKG',r[1] or r[0],r[7],r[8] if num(r[8]) else None,'top',dict(ex,voltage=str(r[2])))
    for r in wb['ABRASIVES'].iter_rows(values_only=True):
        r=list(r)+[None]*6
        if isinstance(r[1],str) and isinstance(r[2],str) and num(r[5]):
            add('ABRASIVES',str(r[3]).strip(),r[1],r[2],r[5],r[4] if num(r[4]) else None,'LIST')
    for r in wb['DUSTLESS'].iter_rows(values_only=True):
        r=list(r)+[None]*6
        if isinstance(r[0],(str,int)) and isinstance(r[1],str) and num(r[4]):
            add('DUSTLESS','DUSTLESS',r[0],r[1],r[4],None,None,{'app':str(r[2] or ''),'saw':str(r[3] or '')})
    return rows
