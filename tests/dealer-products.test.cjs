const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path,deps={}) {
 const result={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('require','module','exports',code)(name=>deps[name]||require(name),result,result.exports);
 return result.exports;
}
const dealer=load('src/lib/dealer-products.ts');
test('dealer catalog includes enabled published products only',()=>{
 const rows=[{id:'on',wholesaleEnabled:true,status:'active'},{id:'out',wholesaleEnabled:true,status:'sold-out'},{id:'draft',wholesaleEnabled:true,status:'draft'},{id:'off',wholesaleEnabled:false,status:'active'}];
 assert.deepEqual(dealer.getDealerProducts(rows).map(p=>p.id),['on','out']);
 assert.deepEqual(dealer.getDealerProducts(rows.map(p=>({...p,wholesaleEnabled:false}))),[]);
});
test('dealer pricing and minimum quantity are required only while enabled',()=>{
 assert.equal(dealer.validateDealerProduct({wholesaleEnabled:false}),null);
 const valid={wholesaleEnabled:true,wholesalePrice:250,wholesaleMinOrder:10};
 assert.equal(dealer.validateDealerProduct(valid),null);
 for(const patch of [{wholesalePrice:0},{wholesalePrice:NaN},{wholesaleMinOrder:0},{wholesaleMinOrder:1.5}]) assert.ok(dealer.validateDealerProduct({...valid,...patch}));
});
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const {HomeDealersSection}=load('src/components/HomeDealersSection.tsx',{
 '@/lib/dealer-products':dealer,
 '@/lib/format':{getWholesaleWhatsappUrl:number=>number ? 'https://wa.me/'+number : '#'},
 './HomeDealersSection.module.css':{default:{}},
 'next/link':{default:props=>React.createElement('a',props,props.children)},
});
test('homepage Dealers section shows information instead of product cards and hides when all are off',()=>{
 const products=[{name:'Enabled tee',wholesaleEnabled:true,status:'active'},{name:'Hidden tee',wholesaleEnabled:false,status:'active'}];
 const html=renderToStaticMarkup(React.createElement(HomeDealersSection,{products,whatsappNumber:''}));
 assert.match(html,/id="dealers"/);assert.match(html,/href="\/wholesale"/);assert.match(html,/Plan your quantity/);assert.doesNotMatch(html,/Enabled tee|Hidden tee|<select|<article|wa.me/);
 assert.equal(renderToStaticMarkup(React.createElement(HomeDealersSection,{products:[],whatsappNumber:''})), '');
});
test('admin action failures scroll to and focus their alert; success feedback does not',()=>{
 let effect;const calls=[];
 const feedback=load('src/components/AdminActionFeedback.tsx',{
  react:{useEffect:fn=>effect=fn,useRef:()=>({current:{scrollIntoView:options=>calls.push(['scroll',options]),focus:options=>calls.push(['focus',options])}})},
 });
 const previous=global.window;global.window={matchMedia:()=>({matches:true})};
 try {
  const alert=feedback.AdminActionFeedback({message:'Save failed',error:true});
  effect();assert.equal(alert.props.role,'alert');
  assert.deepEqual(calls,[['scroll',{behavior:'auto',block:'center'}],['focus',{preventScroll:true}]]);
  calls.length=0;feedback.AdminActionFeedback({message:'Saved',error:false});effect();assert.deepEqual(calls,[]);
 } finally {global.window=previous;}
});
