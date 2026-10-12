"""Check the real admin shell with local page/role fixtures, never hosted admin data.
Run: python3 tests/browser/test_admin_shell_inset.py
"""
import asyncio
import re
import urllib.request
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path('/tmp/browser/admin-shell-inset')

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    source = urllib.request.urlopen('http://localhost:8080/src/features/admin/AdminShell.tsx').read().decode()
    main_source = urllib.request.urlopen('http://localhost:8080/src/main.tsx').read().decode()
    react = re.search(r'"(/node_modules/.vite/deps/react.js\?[^"]+)"', source).group(1)
    dom = re.search(r'"(/node_modules/.vite/deps/react-dom_client.js\?[^"]+)"', main_source).group(1)
    router = re.search(r'"(/node_modules/.vite/deps/react-router-dom.js\?[^"]+)"', source).group(1)
    html = f'''<html><body><div id="root"></div><script type="module">
import RefreshRuntime from '/@react-refresh';
RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{{}};window.$RefreshSig$=()=>type=>type;
import React from '{react}';import ReactDOM from '{dom}';const {{createRoot}}=ReactDOM;
import {{MemoryRouter,Routes,Route,useNavigate,useLocation}} from '{router}';
import AdminShell from '/src/features/admin/AdminShell.tsx';
import {{applyRouteChrome}} from '/src/lib/routeChrome.ts';import '/src/index.css';
function App() {{const nav=useNavigate();const loc=useLocation();window.go=nav;
React.useLayoutEffect(()=>applyRouteChrome(loc.pathname,true),[loc.pathname]);
return React.createElement('div',{{className:'app-shell'}},React.createElement(Routes,null,
React.createElement(Route,{{path:'/clubhouse',element:React.createElement('div',null,'Local feed fixture')}}),
React.createElement(Route,{{path:'/admin-v2/*',element:React.createElement(AdminShell)}})));}}
createRoot(document.getElementById('root')).render(React.createElement(MemoryRouter,{{initialEntries:['/clubhouse']}},React.createElement(App)));
</script></body></html>'''
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width':1280,'height':1800})
        page = await context.new_page()
        errors = []
        page.on('pageerror', lambda error: (errors.append(str(error)), print('PAGE ERROR', str(error), flush=True)))

        async def fixture(route):
            path = route.request.url.split('?')[0]
            if path.endswith('/__admin-inset-check'):
                await route.fulfill(content_type='text/html', body=html)
            elif '/hooks/usePanelRole.ts' in path:
                await route.fulfill(content_type='text/javascript', body="export const usePanelRole=()=>({role:'full',loading:false});")
            elif '/features/admin/pages/' in path:
                await route.fulfill(content_type='text/javascript', body=f"import React from '{react}';export default ()=>React.createElement('div',{{'data-testid':'first-content',style:{{paddingTop:8}}}},React.createElement('div',{{'data-testid':'first-panel'}},'Local page fixture'));")
            elif path.endswith('/AdminDrawer.tsx'):
                await route.fulfill(content_type='text/javascript', body='export default ()=>null;')
            elif path.endswith('/AdminShell.tsx') or path.endswith('/src/index.css'):
                response = await route.fetch()
                # Chromium desktop has no notch: emulate the same CSS env value everywhere.
                text = (await response.text()).replace('env(safe-area-inset-top, 0px)', 'var(--test-notch, 0px)')
                await route.fulfill(response=response, body=text)
            else:
                await route.continue_()

        await page.route('http://localhost:8080/**', fixture)
        await page.goto('http://localhost:8080/__admin-inset-check')
        await page.wait_for_function('typeof window.go === "function"')
        for notch in (0, 47, 59):
            await page.evaluate('(n)=>document.documentElement.style.setProperty("--test-notch",n+"px")', notch)
            await page.evaluate('window.go("/clubhouse")')
            await page.get_by_text('Local feed fixture').wait_for()
            for section in ('dashboard', 'inbox', 'users', 'content', 'analytics', 'health'):
                await page.evaluate('(s)=>window.go("/admin-v2/"+s)', section)
                await page.get_by_test_id('first-panel').wait_for()
                await page.wait_for_timeout(250)
                header = await page.locator('header').bounding_box()
                panel = await page.get_by_test_id('first-panel').bounding_box()
                gap = panel['y'] - header['y'] - header['height']
                assert abs(gap - 8) < 0.1, (notch, section, gap)
                assert abs(header['height'] - (52 + notch)) < 0.1, header
                print(f'{section}: notch={notch}px, header bottom={header["height"]}px, content gap={gap}px')
                if section in ('dashboard', 'inbox') and notch == 59:
                    await page.screenshot(path=str(OUT / f'{section}-59px.png'))
        assert not errors, errors
        await browser.close()

asyncio.run(main())