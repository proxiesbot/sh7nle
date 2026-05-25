import{G as m,j as a,S as p,x as g}from"./app-93646e9c.js";import{A as x}from"./AdminLayout-17115208.js";import{B as i}from"./button-2100f272.js";import{I as d}from"./input-82ff9074.js";import{L as l}from"./label-21f6b9cb.js";import"./AutoTranslator-6d687ada.js";import"./sitePreferences-9be4fa38.js";function k({providerSource:t=null}){const{data:e,setData:n,put:h,processing:c,errors:r}=m({name:(t==null?void 0:t.name)||"",slug:(t==null?void 0:t.slug)||"",driver:(t==null?void 0:t.driver)||"generic",baseUrl:(t==null?void 0:t.base_url)||"",apiToken:(t==null?void 0:t.api_token)||"",authHeader:(t==null?void 0:t.auth_header)||"api-token",authPrefix:(t==null?void 0:t.auth_prefix)||"",catalogEndpoint:(t==null?void 0:t.catalog_endpoint)||"",productEndpoint:(t==null?void 0:t.product_endpoint)||"",orderEndpoint:(t==null?void 0:t.order_endpoint)||"",checkEndpoint:(t==null?void 0:t.check_endpoint)||"",supportsCatalog:t!=null&&t.supports_catalog?1:0,isActive:t?t.is_active?1:0:1,configJson:(t==null?void 0:t.config_json)||`{
  "catalog_categories_path": "data.categories",
  "catalog_products_path": "data.products",
  "catalog_tree_endpoint": "/content/{parentId}",
  "catalog_fallback_endpoint": "/products",
  "catalog_fallback_products_path": "__root__",
  "product_data_path": "__root__",
  "order_data_path": "data",
  "check_data_path": "data",
  "order_http_method": "post",
  "field_map": {
    "id": "id",
    "name": "name",
    "price": "price",
    "base_price": "base_price",
    "product_type": "product_type",
    "params": "params",
    "qty_values": "qty_values",
    "category_name": "category_name",
    "parent_id": "parent_id",
    "available": "available"
  }
}`}),o=s=>{s.preventDefault(),h(route("providerSources.update",t.id))};return a.jsxs(x,{title:t?"تعديل مزود":"إضافة مزود",children:[a.jsx(p,{title:t?"تعديل مزود":"إضافة مزود"}),a.jsx("div",{className:"rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm",children:a.jsxs("form",{onSubmit:o,className:"space-y-6 text-right",children:[a.jsxs("div",{className:"grid gap-6 md:grid-cols-2",children:[a.jsxs("div",{children:[a.jsx(l,{htmlFor:"name",children:"اسم المزود"}),a.jsx(d,{id:"name",value:e.name,onChange:s=>n("name",s.target.value),className:"mt-2"})]}),a.jsxs("div",{children:[a.jsx(l,{htmlFor:"slug",children:"Slug"}),a.jsx(d,{id:"slug",value:e.slug,onChange:s=>n("slug",s.target.value),className:"mt-2"})]})]}),a.jsxs("div",{className:"grid gap-6 md:grid-cols-2",children:[a.jsxs("div",{children:[a.jsx(l,{htmlFor:"driver",children:"نوع المزود"}),a.jsxs("select",{id:"driver",value:e.driver,onChange:s=>n("driver",s.target.value),className:"mt-2 flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm",children:[a.jsx("option",{value:"sawa",children:"Sawa-compatible"}),a.jsx("option",{value:"generic",children:"Generic REST"}),a.jsx("option",{value:"swgames",children:"SW Games"})]})]}),a.jsxs("div",{children:[a.jsx(l,{htmlFor:"baseUrl",children:"Base URL"}),a.jsx(d,{id:"baseUrl",value:e.baseUrl,onChange:s=>n("baseUrl",s.target.value),className:"mt-2"})]})]}),a.jsxs("div",{className:"grid gap-6 md:grid-cols-2",children:[a.jsxs("div",{children:[a.jsx(l,{htmlFor:"apiToken",children:"API Token"}),a.jsx(d,{id:"apiToken",value:e.apiToken,onChange:s=>n("apiToken",s.target.value),className:"mt-2"})]}),a.jsxs("div",{children:[a.jsx(l,{htmlFor:"authHeader",children:"اسم هيدر التوكن"}),a.jsx(d,{id:"authHeader",value:e.authHeader,onChange:s=>n("authHeader",s.target.value),className:"mt-2"})]})]}),a.jsxs("div",{children:[a.jsx(l,{htmlFor:"authPrefix",children:"بادئة التوكن (مثل Bearer )"}),a.jsx(d,{id:"authPrefix",value:e.authPrefix,onChange:s=>n("authPrefix",s.target.value),className:"mt-2"})]}),a.jsx("div",{className:"flex flex-wrap justify-end gap-2",children:a.jsx(i,{type:"button",variant:"outline",onClick:()=>{n({...e,name:"Shams4Store",slug:"shams4store",driver:"generic",baseUrl:"https://api.shams4store.com/client/api",authHeader:"api-token",apiToken:"",authPrefix:"",catalogEndpoint:"/content/{parentId}",productEndpoint:"/products?products_id={id}",orderEndpoint:"/newOrder/{id}/params",checkEndpoint:"/check",supportsCatalog:1,isActive:1,configJson:`{
  "catalog_categories_path": "data.categories",
  "catalog_products_path": "data.products",
  "catalog_tree_endpoint": "/content/{parentId}",
  "catalog_fallback_endpoint": "/products",
  "catalog_fallback_products_path": "__root__",
  "product_data_path": "__root__",
  "order_data_path": "data",
  "check_data_path": "data",
  "order_http_method": "post",
  "field_map": {
    "id": "id",
    "name": "name",
    "price": "price",
    "base_price": "price",
    "image": "image",
    "product_type": "product_type",
    "params": "params",
    "qty_values": "qty_values",
    "category_name": "category_name",
    "parent_id": "parent_id",
    "available": "available"
  }
}`})},children:"تعبئة تلقائية لـ Shams4Store"})}),a.jsxs("div",{className:"grid gap-6 md:grid-cols-2 xl:grid-cols-4",children:[a.jsxs("div",{children:[a.jsx(l,{htmlFor:"catalogEndpoint",children:"Catalog Endpoint"}),a.jsx(d,{id:"catalogEndpoint",value:e.catalogEndpoint,onChange:s=>n("catalogEndpoint",s.target.value),className:"mt-2",placeholder:"/content/{parentId}"})]}),a.jsxs("div",{children:[a.jsx(l,{htmlFor:"productEndpoint",children:"Product Endpoint"}),a.jsx(d,{id:"productEndpoint",value:e.productEndpoint,onChange:s=>n("productEndpoint",s.target.value),className:"mt-2",placeholder:"/products?products_id={id}"})]}),a.jsxs("div",{children:[a.jsx(l,{htmlFor:"orderEndpoint",children:"Order Endpoint"}),a.jsx(d,{id:"orderEndpoint",value:e.orderEndpoint,onChange:s=>n("orderEndpoint",s.target.value),className:"mt-2",placeholder:"/newOrder/{id}/params"})]}),a.jsxs("div",{children:[a.jsx(l,{htmlFor:"checkEndpoint",children:"Check Endpoint"}),a.jsx(d,{id:"checkEndpoint",value:e.checkEndpoint,onChange:s=>n("checkEndpoint",s.target.value),className:"mt-2",placeholder:"/check"})]})]}),a.jsxs("div",{children:[a.jsx(l,{htmlFor:"configJson",children:"JSON Mapping"}),a.jsx("textarea",{id:"configJson",rows:16,value:e.configJson,onChange:s=>n("configJson",s.target.value),className:"mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm"}),a.jsx("div",{className:"mt-2 text-xs text-slate-500",children:"يمكنك تعريف مسارات categories / products / data وأسماء الحقول باستخدام JSON."})]}),a.jsxs("div",{className:"grid gap-6 md:grid-cols-2",children:[a.jsxs("div",{children:[a.jsx(l,{htmlFor:"supportsCatalog",children:"يدعم استعراض الأقسام؟"}),a.jsxs("select",{id:"supportsCatalog",value:e.supportsCatalog,onChange:s=>n("supportsCatalog",Number(s.target.value)),className:"mt-2 flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm",children:[a.jsx("option",{value:1,children:"نعم"}),a.jsx("option",{value:0,children:"لا"})]})]}),a.jsxs("div",{children:[a.jsx(l,{htmlFor:"isActive",children:"الحالة"}),a.jsxs("select",{id:"isActive",value:e.isActive,onChange:s=>n("isActive",Number(s.target.value)),className:"mt-2 flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm",children:[a.jsx("option",{value:1,children:"نشط"}),a.jsx("option",{value:0,children:"معطل"})]})]})]}),a.jsxs("div",{className:"flex justify-end gap-3",children:[a.jsx(g,{href:route("providerSources.index"),children:a.jsx(i,{type:"button",variant:"outline",children:"رجوع"})}),a.jsx(i,{type:"submit",disabled:c,children:c?"جارٍ الحفظ...":"حفظ"})]})]})})]})}export{k as default};
