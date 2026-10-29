"""Real-component geometry regression with controlled query-cache rows, no hosted writes.
Run: python3 tests/browser/test_review_course_search_height.py
Checks natural two-list sizing, 85dvh scrolling, pinned header/search and query-height hold.
Evidence lives under /tmp/browser; this is not an authenticated entrypoint check.
"""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width":430,"height":786})
        await page.goto('http://localhost:8080', wait_until='domcontentloaded')
        await page.wait_for_timeout(1500)
        await page.evaluate('''async () => {
          const {default: React} = await import('/node_modules/.vite/deps/react.js');
          const {default: ReactDOM} = await import('/node_modules/.vite/deps/react-dom_client.js');
          const {QueryClient, QueryClientProvider} = await import('/node_modules/.vite/deps/@tanstack_react-query.js');
          const {default: Sheet} = await import('/src/features/composer-flow/ReviewCourseSearchSheet.tsx');
          const client = new QueryClient({defaultOptions:{queries:{retry:false}}});
          client.setQueryDefaults(['review-course-search'], {staleTime: Infinity});
          client.setQueryData(['top100-verdict-config'], {t100_subscore_min_ratings:3});
          const row = (id) => ({id, name:'Course '+id, region:'Scotland', subCountry:null, country:'Scotland', thumbnail:null, avg:8, count:3, mine:null, rank:null});
          client.setQueryData(['review-course-idle', null, 3], {recent:[row('recent')], threshold:[], popular:[row('popular')]});
          client.setQueryData(['review-course-search', null, 'Course'], Array.from({length:30}, (_,i)=>row(String(i))));
          client.setQueryData(['review-course-search', null, 'zz'], []);
          const host = document.createElement('div'); document.body.append(host);
          ReactDOM.createRoot(host).render(React.createElement(QueryClientProvider,{client},React.createElement(Sheet,{open:true,userId:null,onClose:()=>{},onPick:()=>{}})));
        }''')
        body=page.get_by_test_id('review-course-search')
        await body.wait_for()
        await page.wait_for_timeout(200)
        async def sizes():
            return await body.evaluate('''el=>{const c=el.querySelector('.rcs-content'), s=el.closest('.post-or-review-surface');return {sheet:s.getBoundingClientRect().height, body:el.getBoundingClientRect().height, content:c.clientHeight, scroll:c.scrollHeight, flex:getComputedStyle(c).flex, cap:getComputedStyle(s).maxHeight, header:el.querySelector('header').getBoundingClientRect().top, field:el.querySelector('input').getBoundingClientRect().top, min:el.style.minHeight, heightMode:s.style.height}}''')
        short=await sizes(); print('short:',json.dumps(short))
        assert short['heightMode'] == 'auto'
        assert short['sheet'] < 786*.85
        assert short['content'] == short['scroll']
        assert short['flex'] == '0 1 auto'
        await body.screenshot(path='/tmp/browser/review-course-height/short.png')
        field=page.get_by_role('searchbox')
        await field.fill('C'); first=await sizes()
        assert abs(first['sheet']-short['sheet']) < 1
        await field.fill('zz'); await page.wait_for_timeout(350)
        empty=await sizes(); print('empty while typing:',json.dumps(empty))
        assert abs(empty['sheet']-short['sheet']) < 1
        await field.fill('Course'); await page.wait_for_timeout(350)
        long=await sizes(); print('many rows:',json.dumps(long))
        assert abs(long['sheet']-786*.85) < 1
        assert long['scroll'] > long['content']
        await body.locator('.rcs-content').evaluate('(el)=>el.scrollTop=500')
        after=await sizes()
        assert after['header']==long['header'] and after['field']==long['field']
        assert await body.locator('.rcs-content').evaluate('(el)=>el.scrollTop') > 0
        await body.screenshot(path='/tmp/browser/review-course-height/long.png')
        await page.get_by_role('button',name='Clear search',exact=True).click()
        cleared=await sizes(); print('cleared:',json.dumps(cleared))
        assert cleared['min']=='' and abs(cleared['sheet']-short['sheet']) < 1
        print('PASS: controlled real-component geometry; live authenticated entrypoint not available')
        await browser.close()
asyncio.run(main())
