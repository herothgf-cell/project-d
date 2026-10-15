"""Real browser interactions; no app state injection. Emulation is not a real phone test."""
import functools, http.server, json, os, pathlib, shutil, threading, re
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
OFFLINE=os.environ.get('UI_OFFLINE')=='1'
def inline_html():
    html=(ROOT/'index.html').read_text()
    html=html.replace('<link rel="stylesheet" href="./src/style.css">','<style>'+(ROOT/'src/style.css').read_text()+'</style>')
    return re.sub(r'<script src="\./([^"]+)"></script>',lambda m:'<script>'+(ROOT/m.group(1)).read_text()+'</script>',html)
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
    def translate_path(self,path):
        if path.startswith('/project-d/'):
            path=path[len('/project-d'):]
        return super().translate_path(path)

def run():
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    url=f'http://127.0.0.1:{server.server_port}/project-d/'
    errors=[]; checks=[]
    def load(page, data=None, denied=False):
        if OFFLINE:
            if not denied:
                page.evaluate('''data=>{window.__testStorageData=data||{};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__testStorageData[k]??null,setItem:(k,v)=>window.__testStorageData[k]=String(v)}});}''',data)
            page.set_content(inline_html(),wait_until='load')
        else:page.goto(url)
    def refresh(page):
        if not OFFLINE:
            page.reload();return page
        data=page.evaluate('window.__testStorageData');new=page.context.new_page();new.on('pageerror',lambda e:errors.append(str(e)));page.close();load(new,data);return new
    try:
      with sync_playwright() as p:
        executable=os.environ.get('BROWSER_PATH') or shutil.which('chromium')
        browser=p.chromium.launch(headless=True,executable_path=executable,args=['--no-sandbox','--disable-dev-shm-usage'])
        context=browser.new_context(viewport={'width':1280,'height':960})
        page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        load(page);page.wait_for_selector('#board',timeout=5000);page.wait_for_function('window.BodyShareApp !== undefined')
        def snap(): return page.evaluate('BodyShareApp.inspect()')
        def choose(i):
            page.locator('#stageButton').click()
            page.locator(f'#stageDialog [data-level="{i}"]').click()
        assert page.title().startswith('몸 나눠쓰기')
        start=snap();page.keyboard.press('ArrowLeft');assert snap()['moves']==0
        page.keyboard.press('ArrowRight');assert snap()['moves']==1
        page=refresh(page);page.wait_for_function('window.BodyShareApp !== undefined');assert snap()['moves']==1
        page.keyboard.press('z');assert snap()['bodies']==start['bodies'];checks.append('PC invalid input / reload / undo')
        page.locator('#rulesButton').click();page.keyboard.press('ArrowRight');assert snap()['moves']==0
        page.locator('#rulesClose').click();checks.append('dialog keyboard isolation')
        # A long real mouse drag grows only one cell.
        pt=page.evaluate('BodyShareApp.cellPoint(BodyShareApp.inspect().bodies[0][0])')
        page.mouse.move(pt['x'],pt['y']);page.mouse.down();page.mouse.move(pt['x']+pt['cell']*2.2,pt['y'],steps=5);page.mouse.up()
        assert snap()['moves']==1;checks.append('long mouse drag = one move')
        before=snap();page.locator('#hint').click();page.locator('#hint').click();page.locator('#hint').click()
        assert snap()['demo']
        while not page.locator('#demoNext').is_disabled():page.locator('#demoNext').click()
        page.locator('#demoExit').click();assert snap()['bodies']==before['bodies'];assert not snap()['complete'];checks.append('hint demo restores original progress')
        choose(1);page.locator('#reset').click();page.locator('#confirmReset').click()
        levels=page.evaluate('BodyShareLevels.map(l=>({id:l.id,solution:l.solution,trap:l.trap}))')
        for l in levels:
            choose(l['id']);page.locator('#reset').click();page.locator('#confirmReset').click()
            for a in l['solution']:
                page.keyboard.press(str(a['actor']+1));page.keyboard.press({'U':'ArrowUp','R':'ArrowRight','D':'ArrowDown','L':'ArrowLeft'}[a['dir']])
            assert snap()['status']=='won',l['id']
            page.keyboard.press('z');assert snap()['status']!='won';assert snap()['complete']
        checks.append('all 12 solutions through keyboard; undo after win')
        choose(5);page.locator('#reset').click();page.locator('#confirmReset').click()
        pixel=page.evaluate('''()=>{const p=BodyShareApp.cellPoint(8),c=document.getElementById('board'),r=c.getBoundingClientRect(),scale=c.width/r.width;return [...c.getContext('2d').getImageData((p.x-r.left+p.cell*.27)*scale,(p.y-r.top+p.cell*.26)*scale,1,1).data].slice(0,3);}''')
        assert min(pixel)>240 or pixel[2]>pixel[0],('home hidden by another body',pixel)
        checks.append('home marker stays visible under the other head')
        choose(6);page.locator('#reset').click();page.locator('#confirmReset').click()
        for a in levels[5]['trap']:
            page.keyboard.press(str(a['actor']+1));page.keyboard.press({'U':'ArrowUp','R':'ArrowRight','D':'ArrowDown','L':'ArrowLeft'}[a['dir']])
        assert snap()['status']=='blocked';assert page.locator('#status').get_attribute('data-kind')=='blocked'
        page.keyboard.press('z');assert snap()['status']!='blocked';checks.append('deadlock message and recovery')
        choose(8);page.locator('#reset').click();page.locator('#confirmReset').click()
        (ROOT/'test-results').mkdir(exist_ok=True)
        page.screenshot(path=str(ROOT/'test-results/desktop.png'),full_page=True)
        page.locator('#phonePreview').check();assert page.locator('.game').bounding_box()['width']<=400
        page.locator('#phonePreview').uncheck();checks.append('PC mobile-width preview')
        mobile=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)
        m=mobile.new_page();m.on('pageerror',lambda e:errors.append(str(e)));load(m);m.wait_for_function('window.BodyShareApp !== undefined')
        def ms():return m.evaluate('BodyShareApp.inspect()')
        a=m.evaluate('BodyShareApp.cellPoint(BodyShareApp.inspect().bodies[0][0])')
        m.touchscreen.tap(a['x'],a['y']);m.touchscreen.tap(a['x']+a['cell'],a['y']);assert ms()['moves']==1
        m=refresh(m);m.wait_for_function('window.BodyShareApp !== undefined');assert ms()['moves']==1
        m.locator('#undo').tap();assert ms()['moves']==0;checks.append('mobile tap controls / reload / undo')
        a=m.evaluate('BodyShareApp.cellPoint(BodyShareApp.inspect().bodies[0][0])')
        cdp=mobile.new_cdp_session(m)
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':a['x'],'y':a['y']}]})
        m.wait_for_timeout(100)  # Model a real swipe duration, not zero-time CDP events.
        cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':a['x']+a['cell']*2,'y':a['y']}]})
        m.wait_for_timeout(100)
        cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});assert ms()['moves']==1;m.wait_for_timeout(120);checks.append('mobile long swipe = one move')
        m.locator('#undo').tap();m.wait_for_function('BodyShareApp.inspect().moves===0',timeout=2000);a=m.evaluate('BodyShareApp.cellPoint(BodyShareApp.inspect().bodies[0][0])')
        m.locator('#board').dispatch_event('pointerdown',{'pointerId':6,'pointerType':'touch','isPrimary':True,'clientX':a['x'],'clientY':a['y'],'button':0})
        m.locator('#board').dispatch_event('pointercancel',{'pointerId':6,'pointerType':'touch','isPrimary':True})
        m.locator('#board').dispatch_event('pointerup',{'pointerId':6,'pointerType':'touch','isPrimary':True,'clientX':a['x']+a['cell'],'clientY':a['y']})
        assert ms()['moves']==0;checks.append('pointercancel does not move')
        m.locator('#stageButton').tap();m.locator('#stageDialog [data-level="8"]').tap()
        m.screenshot(path=str(ROOT/'test-results/mobile.png'),full_page=True)
        for w,h in [(320,740),(360,640),(390,844),(768,1024),(844,390)]:
            m.set_viewport_size({'width':w,'height':h})
            assert m.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,h)
        checks.append('320–844px layouts have no horizontal overflow')
        corrupt=mobile.new_page();corrupt.on('pageerror',lambda e:errors.append(str(e)))
        if not OFFLINE:
            corrupt.add_init_script("localStorage.setItem('body-share:v02','{broken')")
        load(corrupt,{'body-share:v02':'{broken'})
        corrupt.wait_for_function('window.BodyShareApp !== undefined')
        assert corrupt.evaluate('BodyShareApp.inspect().level')==1
        assert corrupt.evaluate('BodyShareApp.inspect().moves')==0
        assert '저장을 읽을 수 없어요' in corrupt.locator('#saveNotice').inner_text()
        corrupt.locator('#right').tap();assert corrupt.evaluate('BodyShareApp.inspect().moves')==1
        checks.append('corrupt save fallback')
        denied=browser.new_context(viewport={'width':390,'height':844})
        denied.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('denied')}})")
        d=denied.new_page();d.on('pageerror',lambda e:errors.append(str(e)));load(d,denied=True);d.wait_for_function('window.BodyShareApp !== undefined');d.keyboard.press('ArrowRight')
        assert d.evaluate('BodyShareApp.inspect().moves')==1;assert '저장' in d.locator('#saveLabel').inner_text();checks.append('storage denied: play remains usable')
        assert not errors,errors
        browser.close()
        report={'browser':'Chromium','mode':'in-memory storage adapter / inline local artifact' if OFFLINE else 'HTTP / real browser localStorage','checks':checks,'count':len(checks),'pageErrors':errors,'realMobileDeviceTested':False}
        (ROOT/'test-results/ui.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
        print(json.dumps(report,ensure_ascii=False,indent=2))
    finally:
      server.shutdown();server.server_close()
if __name__=='__main__':run()
