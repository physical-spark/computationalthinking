import {test,expect} from '@playwright/test';
test('Python runtime loads and checks the first task',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('/');
 await expect(page.getByRole('button',{name:'▶ 실행'})).toBeEnabled({timeout:60000});
 await page.getByRole('textbox',{name:'Python 코드 편집기'}).fill('1+2');
 await page.getByRole('button',{name:'▶ 실행'}).click();
 await expect(page.getByLabel('Python 실행 결과')).toContainText('3');
 await expect(page.getByText('✓ 통과',{exact:true})).toBeVisible();
 expect(errors).toEqual([]);
});
